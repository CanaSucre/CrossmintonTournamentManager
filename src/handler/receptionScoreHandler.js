// ------------------------ //
//         IMPORTS          //
// ------------------------ //
const querystring = require('querystring');
const dbManager = require("../managers/databaseManager");
const websocketManager = require("../managers/websocketManager");

const logger = require('../managers/logManager');

const { MatchStatus } = require("../enums/MatchStatus")
// ------------------------ //
//     INITIALISATIONS      //
// ------------------------ //




// ------------------------ //
//        PROGRAMME         //
// ------------------------ //


/*
DATAS :

{
  numMatch: '1',
  category: 'Category',
  round: 'Round',
  duration: '00:00',
  player1: 'J1',
  player2: 'J2',
  server1: '0',
  server2: '1',
  player1Set1: '1',
  player1Set2: '',
  player1Set3: '',
  player2Set1: '0',
  player2Set2: '',
  player2Set3: '',
  winner: '',
  liveCompleted: 'Live'
}

*/

/**
 * Gère la réception d'un score depuis l'application via une requête http
 * @param {request} req Requête entrante
 * @param {response} res Réponse sortante
 * @param {Integer} field Numéro du terrain d'où provient la requête
 */
const handleScoreReception = (req, res, field) => {
  logger.info(`Réception d'une requête de score sur le terrain #${field} depuis l'IP ${req.socket.remoteAddress} sur le port ${req.socket.localPort}. ${req.method} ${req.url}`, true);

  if (req.method === 'POST') {
    let body = [];

    req.on('data', chunk => {
      body.push(chunk);
    });

    req.on('end', () => {
      body = Buffer.concat(body).toString();
      const data = querystring.parse(body);

      logger.info(`Données reçues sur le terrain #${field} : ${JSON.stringify(data)}`, true);

      if (checkDataValidity(data, field)) {
        processData(data, field);

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Score received successfully\n');
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request: Invalid data\n');
      };
    });

  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed\n');
  }
}

const processData = async (data, field) => {
  // Tournament ID :
  let currentTournament = dbManager.getSetting("live_tournament");
  let tournamentDatas = dbManager.getTournamentDatas(currentTournament);

  let tournamentDb = dbManager.loadDatabase(tournamentDatas.tournamentInfos.databaseName);
  let matchDatas = dbManager.getMatchDatas(tournamentDb, data.numMatch);

  let unknownMatch = matchDatas ? false : true;

  if (unknownMatch) {

    await dbManager.registerMatchs(
      tournamentDb,
      [
        [ data.numMatch, data.round, data.category, data.player1, data.player2 ]
      ]
    )

    matchDatas = dbManager.getMatchDatas(tournamentDb, data.numMatch);
  }

  if (matchDatas.statut != MatchStatus.IN_PROGRESS) {
    dbManager.updateMatchStatus(tournamentDb, data.numMatch, MatchStatus.IN_PROGRESS);
    dbManager.updateMatchField(tournamentDb, data.numMatch, field);
  }

  let score = {
    player1Set1: data.player1Set1,
    player2Set1: data.player2Set1,

    player1Set2: data.player1Set2,
    player2Set2: data.player2Set2,

    player1Set3: data.player1Set3,
    player2Set3: data.player2Set3,
  };

  dbManager.updateMatchScore(tournamentDb, data.numMatch, score);

  if (data.winner && (data.winner === data.player1 || data.winner === data.player2)) {
    dbManager.updateMatchStatus(tournamentDb, data.numMatch, MatchStatus.COMPLETED);
    dbManager.updateMatchWinner(tournamentDb, data.numMatch, data.winner);
  }

  const socketServ = websocketManager.getWebsocketServer();


  socketServ.of(`/tournament/${currentTournament}`).emit("updateMatchScore", {
    matchId: data.numMatch,
    score: score,
    winner: data.winner == '' ? null : data.winner,
    field: field,
    statut: data.winner == '' ? MatchStatus.IN_PROGRESS : MatchStatus.COMPLETED,
    player1: data.player1,
    player2: data.player2,
    category: data.category,
    round: data.round,
  });

  let matchInfos = {
    round: data.round,
    category: data.category,
    duration: data.duration,
    player1: data.player1,
    player2: data.player2,
    server1: data.server1,
    server2: data.server2,
    player1Set1: data.player1Set1,
    player1Set2: data.player1Set2,
    player1Set3: data.player1Set3,
    player2Set1: data.player2Set1,
    player2Set2: data.player2Set2,
    player2Set3: data.player2Set3,
    winner: data.winner,
    idMatch: parseInt(data.numMatch),
    statut: data.winner == '' ? MatchStatus.IN_PROGRESS : MatchStatus.COMPLETED,
    field: field,
  };

  socketServ.of(`/fieldScore/${field}`).emit("update", matchInfos);
  socketServ.of(`/tournament/${currentTournament}/matchList`).emit("updateMatch", matchInfos);

}


/**
 * Vérifie la validité des données reçues depuis l'application. Pour éviter les fraudes ou erreurs.
 * @param {Object} data Données reçues par l'application
 * @param {Integer} field Numéro du terrain d'où provient la requête
 * @param {Boolean} isTest Indique si la vérification est effectuée en mode test (affiche des logs)
 * @returns {Boolean} true si les données sont valides, false sinon
 */
const checkDataValidity = (data, field, isTest = false) => {
  // TODO : Implémenter la vérification de la validité des données reçues

  /** Vérifications possibles :
   * - Le match existe dans la BDD
   * - Le match est bien en cours sur le terrain indiqué
   * - Les scores sont cohérents (ex : pas de score négatif, augmentation de 1 par 1, etc.)
   * - La durée est cohérente (ex : pas de durée négative, etc.)
   * - Durée minimale du match de 5 minutes (sauf si abandon)
   * - Les joueurs correspondent bien au match
   * - Le gagnant est cohérent avec les scores
   * - Le tournoi est bien en cours
   * - Le serveur est bien l'un des deux joueurs et correpond bien au score
   * - La catégorie et le tour correspondent au match
   * - Le format des données est correct (ex : numMatch est un entier, duration est au format HH:MM, etc.)
   * - Le set n'excède pas le format du match (ex : pas de set 3 si le match est en 2 sets gagnants)
   * - Pas de modification du score si le match est déjà terminé
   * - Le match démarre bien avec un score de 1-0 ou 0-1 sur le 1er set
   * - Un set a une augmentation de score uniquement si le set précédent est terminé
   */
  return true;
}


module.exports = {
  handleScoreReception,
};