// ------------------------ //
//         IMPORTS          //
// ------------------------ //
const dbManager = require('./src/managers/databaseManager');
const webAppManager = require('./src/managers/webAppManager');
const websocketManager = require('./src/managers/websocketManager');
const serverReceptionManager = require('./src/managers/serverReceptionManager');

const { loadRedirection } = require('./src/handler/redirectionHandler');
const { loadWebsocket } = require('./src/handler/websocketHandler');

// ------------------------ //
//        CONSTANTES        //
// ------------------------ //



// ------------------------ //
//     INITIALISATIONS      //
// ------------------------ //
dbManager.getMainDatabase();

websocketManager.setupWebsocketServer(webAppManager.server);

loadRedirection(webAppManager.app);
loadWebsocket();


// ------------------------ //
//        PROGRAMME         //
// ------------------------ //



// Démarrage des serveurs de réception des scores s'il y a un tournoi en cours de LiveScore
let currentLiveScoreTournament = dbManager.getSetting("live_tournament");

if (currentLiveScoreTournament) {
    let tournamentDatas = dbManager.getTournamentDatas(currentLiveScoreTournament);

    serverReceptionManager.startReceptionServer(tournamentDatas.tournamentInfos.nombreTerrains);
    console.log(`Serveur de réception des scores démarré pour le tournoi "${tournamentDatas.tournamentInfos.nomTournoi}" (${tournamentDatas.tournamentInfos.nombreTerrains} terrains).`);
}