const databaseManager = require("../managers/databaseManager");
const websocketManager = require("../managers/websocketManager");
const serverReceptionManager = require("../managers/serverReceptionManager");

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


        socket.on("editLiveScoreStatus", (callback) => {
            let liveTournamentId = databaseManager.getSetting("live_tournament");
            let tournamentDatas = databaseManager.getTournamentDatas(tournamentId);

            if (liveTournamentId == null) {
                databaseManager.updateSetting("live_tournament", tournamentId);

                try {
                    serverReceptionManager.startReceptionServer(tournamentDatas.tournamentInfos.nombreTerrains);
                    callback(true)
                } catch (error) {
                    callback(false);
                }

            } else if (liveTournamentId == tournamentId) {
                databaseManager.updateSetting("live_tournament", null);

                try {
                    serverReceptionManager.closeReceptionServer();
                    callback(true);
                } catch {
                    callback(false);
                }

            } else {
                callback(false);
            }
        });

    }
}