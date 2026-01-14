const databaseManager = require("../managers/databaseManager");
const websocketManager = require("../managers/websocketManager");

module.exports = {
    namespace: /^\/tournament\/\d+$/,
    event: "connection",

    run(socket) {
        const socketServ = websocketManager.getWebsocketServer();

        // Récupération de l'identifiant du tournoi depuis le nom du namespace (ex: /tournament/42 -> 42)
        const tournamentId = socket.nsp.name.split("/").pop();
        
        if (!tournamentId || isNaN(tournamentId) || tournamentId <= 0) {
            console.error(`ID de tournoi invalide pour la connexion WebSocket : ${tournamentId}`);
            return;
        }

        let liveTournamentId = databaseManager.getSetting("live_tournament");

        socketServ.of(`/tournament/${tournamentId}`).emit("load", {
            ...databaseManager.getTournamentDatas(tournamentId),
            isLive: liveTournamentId && liveTournamentId == tournamentId ? true: false,
            liveEnabled: liveTournamentId ? true: false
        });

    }
}