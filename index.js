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