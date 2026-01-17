// ------------------------ //
//         IMPORTS          //
// ------------------------ //
const http = require('http');
const config = require('../../config');

const { handleScoreReception } = require('../handler/receptionScoreHandler');

// ------------------------ //
//     INITIALISATIONS      //
// ------------------------ //
let httpServers = [];



// ------------------------ //
//        PROGRAMME         //
// ------------------------ //

/**
 * Démarre les serveurs de réception des scores à partir du port et de l'adresse IP définis dans la configuration.
 */
const startReceptionServer = (amountOfServers) => {
  if (httpServers.length > 0) {
    throw new Error("Les serveurs de réception sont déjà démarrés.");
  };

  for (let i = 0; i < amountOfServers; i++) {
    const server = http.createServer((req, res) => { 
      handleScoreReception(req, res, i+1) 
    });
    httpServers.push(server);
    
    console.log(`Démarrage du serveur de réception des scores sur le port ${config.PORT_ECOUTE + i} pour le terrain #${i+1}.`);
    server.listen(config.PORT_ECOUTE + i, config.IP_ADRESS_RESEAU, () => { });
  }
}


/**
 * Ferme les serveurs de réception des scores.
 */
const closeReceptionServer = () => {
  if (httpServers.length > 0) {
    httpServers.forEach(server => {
      server.close(() => { });
    });
    
    httpServers = [];
  } else {
    throw new Error("Les serveurs de réception ne sont pas démarrés.");
  }
};


/**
 * Retourne le statut des serveurs de réception des scores. true s'ils sont démarrés, false sinon.
 * @returns {boolean} Statut des serveurs de réception des scores.
 */
const getReceptionServerStatus = () => {
  return httpServers.length > 0;
};



module.exports = {
  startReceptionServer,
  closeReceptionServer,
  getReceptionServerStatus,
};