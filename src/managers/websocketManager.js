// ------------------------ //
//         IMPORTS          //
// ------------------------ //
const { get } = require('http');
const { Server } = require('socket.io');


// ------------------------ //
//     INITIALISATIONS      //
// ------------------------ //
let io;

// ------------------------ //
//        PROGRAMME         //
// ------------------------ //

/**
 * Initialise le gestionnaire de WebSocket
 * @param {import('http').Server} server 
 * @returns { import('socket.io').Server }
 */
const setupWebsocketServer = (server) => {
  io = new Server(server);
};

const getWebsocketServer = () => {
    if (!io) {
        throw new Error("Le serveur WebSocket n'a pas été initialisé. Appelez d'abord setupWebsocketServer.");
    }

    return io;
}

module.exports = {
  setupWebsocketServer,
  getWebsocketServer,
};