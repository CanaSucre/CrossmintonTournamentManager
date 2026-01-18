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
    const terrainId = i + 1;

    const server = http.createServer((req, res) => {
      handleScoreReception(req, res, terrainId);
    });

    httpServers.push(server);

    const port = config.PORT_ECOUTE + i;
    console.log(`Démarrage du serveur sur le port ${port} pour le terrain #${terrainId}`);
    server.listen(port);
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

    console.log("Les serveurs de réception ont été stoppés.")
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