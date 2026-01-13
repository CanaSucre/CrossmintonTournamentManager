// ------------------------ //
//         IMPORTS          //
// ------------------------ //
const dbManager = require('./src/managers/databaseManager');
const webAppManager = require('./src/managers/webAppManager');
const websocketManager = require('./src/managers/websocketManager');

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

// if (!dbManager.checkDatabaseExists("national_rennes2026.db")) {
//     console.log("Database 'national_rennes2026' does not exist. Creating...");

//     dbManager.registerNewTournament("National Rennes", "18 avril 2026", 6, "national_rennes2026.db");
// }

// if (!dbManager.checkDatabaseExists("lgo_rennes2026.db")) {
//     console.log("Database 'lgo_rennes2026' does not exist. Creating...");

//     dbManager.registerNewTournament("LGO Rennes", "11 janvier 2026", 6, "lgo_rennes2026.db");
// }

// if (!dbManager.checkDatabaseExists("lgo_lannion2025.db")) {
//     console.log("Database 'lgo_lannion2025' does not exist. Creating...");

//     dbManager.registerNewTournament("LGO Lannion", "15 octobre 2025", 6, "lgo_lannion2025.db");
// }