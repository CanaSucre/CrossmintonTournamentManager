const databaseManager = require("../managers/databaseManager");
const websocketManager = require("../managers/websocketManager");

const logger = require("../managers/logManager");

module.exports = {
    namespace: /^\/tournament\/\d+\/matchList$/,
    event: "connection",

    run(socket) {
        const socketServ = websocketManager.getWebsocketServer();

        // Récupération de l'identifiant du tournoi depuis le nom du namespace (ex: /tournament/42/matchList -> 42)
        const tournamentId = socket.nsp.name.split("/")[2];
        
        if (!tournamentId || isNaN(tournamentId) || tournamentId <= 0) {
            logger.error(`ID de tournoi invalide pour la connexion WebSocket : ${tournamentId}`);
            return;
        }

        let tournamentInfo = databaseManager.getTournamentDatas(tournamentId);
        // Envoi de la liste des matchs du tournoi au client
        socketServ.of(`/tournament/${tournamentId}/matchList`).emit("load", {
            ...tournamentInfo
        });

    }
}