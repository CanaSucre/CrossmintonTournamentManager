const fs = require('fs');
const path = require('path');

const webSocketManger = require('../managers/websocketManager');

/**
 * Charge les redirections dans l'application web.
 * @param {import('express').Express} webApp 
 */
const loadWebsocket = () => {
    let wb = webSocketManger.getWebsocketServer();

    // Fichier contenant l'ensemble des websocket d'envoi
    const websocketPath = path.join(__dirname, '../websockets');

    fs.readdirSync(websocketPath).forEach(file => {
        // Empêche de charger les fichiers non JS
        if (file.endsWith('.js')) {
            const fileWs = require(path.join(websocketPath, file));
            
            // Ajoute l'événement au namespace
            wb.of(fileWs.namespace).on(fileWs.event, (socket) => fileWs.run(socket));
        }

    });
}

module.exports = {
    loadWebsocket,
};