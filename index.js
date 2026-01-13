// ------------------------ //
//         IMPORTS          //
// ------------------------ //
const dbManager = require('./src/managers/databaseManager');
const csvManager = require('./src/managers/csvManager');
const webAppManager = require('./src/managers/webAppManager');

const { MatchStatus } = require('./src/enums/MatchStatues');

const { loadRedirection } = require('./src/handler/redirectionHandler');

// ------------------------ //
//        CONSTANTES        //
// ------------------------ //



// ------------------------ //
//     INITIALISATIONS      //
// ------------------------ //
dbManager.getMainDatabase();

loadRedirection(webAppManager.app);