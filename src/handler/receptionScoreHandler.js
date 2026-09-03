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

      
      data.numMatch = data.numMatch.replaceAll('"', "");
      
      if (data.player2) data.player2 = data.player2.replaceAll('"', "");
      
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

  // Si le match n'existe pas encore dans la BDD, on le crée.
  // Cela permet de ne pas devoir créer tous les matchs à l'avance et de gérer les phases
  // finales où l'ont ne connait pas à l'avance les joueurs qui vont s'affronter.
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

  // Si le match n'est pas encore en cours, on le met en cours et on indique le terrain
  // TODO : Check si le match est déjà terminé, dans ce cas ne pas modifier le statut et ne pas mettre à jour le terrain (pour éviter les fraudes)
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

  let matchWinner = getMatchWinner(data);
  if (matchWinner) {
    dbManager.updateMatchStatus(tournamentDb, data.numMatch, MatchStatus.COMPLETED);
    dbManager.updateMatchWinner(tournamentDb, data.numMatch, matchWinner);
  }

  const socketServ = websocketManager.getWebsocketServer();


  socketServ.of(`/tournament/${currentTournament}`).emit("updateMatchScore", {
    matchId: data.numMatch,
    score: score,
    winner: matchWinner,
    field: field,
    statut: matchWinner ? MatchStatus.COMPLETED : MatchStatus.IN_PROGRESS,
    player1: data.player1,
    player2: data.player2,
    category: data.category,
    round: data.round,
  });

  let matchInfos = {
    round: data.round,
    category: data.category,
    duration: data.duration,
    joueur1: data.player1,
    joueur2: data.player2,
    server1: data.server1,
    server2: data.server2,
    player1Set1: data.player1Set1,
    player1Set2: data.player1Set2,
    player1Set3: data.player1Set3,
    player2Set1: data.player2Set1,
    player2Set2: data.player2Set2,
    player2Set3: data.player2Set3,
    winner: matchWinner,
    idMatch: parseInt(data.numMatch),
    statut: matchWinner ? MatchStatus.COMPLETED : MatchStatus.IN_PROGRESS,
    field: field,
  };

  socketServ.of(`/fieldScore/${field}`).emit("update", matchInfos);
  socketServ.of(`/tournament/${currentTournament}/matchList`).emit("updateMatch", matchInfos);

  // *Version Rennaise : un apéro est mis quand un joueur gagne un set 7-0*
  // Vérifie si un apéro a été mis, et affiche un message dans les logs si c'est le cas
  checkApero(data);
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
   * - Si le gagnant est indiqué, alors le score doit correspondre à une victoire (ex : pas de gagnant si le score est 1-1 en 2 sets gagnants)
   */
  return true;
}


/**
 * Vérifie si le match est gagné par l'un des joueurs en fonction des scores indiqués. Si oui, indique le gagnant.
 * @param {Object} data Données reçues par l'application
 * @returns {String} Le nom du gagnant si le match est gagné, null sinon
 */
const getMatchWinner = (data) => {
  let player1SetsWon = 0;
  let player2SetsWon = 0;

  for (let i = 1; i <= 3; i++) {
    let player1Score = data[`player1Set${i}`];
    let player2Score = data[`player2Set${i}`];

    let setWinner = getSetWinner(player1Score, player2Score);
    if (setWinner === 1) {
      player1SetsWon++;
    } else if (setWinner === 2) {
      player2SetsWon++;
    }
  }

  if (player1SetsWon == 2) {
    return data.player1;
  } else if (player2SetsWon == 2) {
    return data.player2;
  } else {
    return null; // Match non terminé
  }

}

const getSetWinner = (player1Score, player2Score) => {
  if (player1Score == '' || player2Score == '') {
    // Set pas encore joué
    return null;
  }

  if (player1Score < 16 && player2Score < 16) {
    // Aucun des 2 joueurs n'a assez de point pour gagner le set
    return null;
  }
  
  
  let delta = Math.abs(player1Score - player2Score); // Différence de points entre les 2 joueurs

  // Le joueur a plus de 16 points, a plus de points que sont adversaire et a au moins 2 points d'écart
  if (player1Score >= 16 && player1Score > player2Score && delta >= 2) {
    return 1;
  } else if (player2Score >= 16 && player2Score > player1Score && delta >= 2) {
    return 2;
  } else {
    return null; // Si pas toutes ces conditions, set non fini
  }
}

const checkApero = (data) => {
  if (
    data.player1Set1 == 0 && data.player2Set1 == 7 ||
    data.player1Set2 == 0 && data.player2Set2 == 7 ||
    data.player1Set3 == 0 && data.player2Set3 == 7
  ) {
    logger.warning(`APERO ! Match n°${data.numMatch} : ${data.player2} a mis un 7-0 à ${data.player1} sur le terrain ${field}.`);
  } else if (
    data.player1Set1 == 7 && data.player2Set1 == 0 ||
    data.player1Set2 == 7 && data.player2Set2 == 0 ||
    data.player1Set3 == 7 && data.player2Set3 == 0
  ) {
    logger.warning(`APERO ! Match n°${data.numMatch} : ${data.player1} a mis un 7-0 à ${data.player2} sur le terrain ${field}.`);
  }
}

module.exports = {
  handleScoreReception,
  checkDataValidity,
  checkApero,
  getMatchWinner,
  getSetWinner,
};