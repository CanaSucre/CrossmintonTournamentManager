const databaseManager = require("../managers/databaseManager");
const websocketManager = require("../managers/websocketManager");
const serverReceptionManager = require("../managers/serverReceptionManager");

const csvManager = require("../managers/csvManager");

const logger = require("../managers/logManager");

module.exports = {
    namespace: /^\/tournament\/\d+$/,
    event: "connection",

    run(socket) {
        const socketServ = websocketManager.getWebsocketServer();

        // Récupération de l'identifiant du tournoi depuis le nom du namespace (ex: /tournament/42 -> 42)
        const tournamentId = socket.nsp.name.split("/").pop();
        
        if (!tournamentId || isNaN(tournamentId) || tournamentId <= 0) {
            logger.error(`ID de tournoi invalide pour la connexion WebSocket : ${tournamentId}`);
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

                    socketServ.of(`/tournament/${tournamentId}`).emit("reload", {
                        ...tournamentDatas,
                        isLive: true,
                        liveEnabled: true
                    });

                    callback(true)
                } catch (error) {
                    callback(false);
                }

            } else if (liveTournamentId == tournamentId) {
                databaseManager.updateSetting("live_tournament", null);

                try {
                    serverReceptionManager.closeReceptionServer();

                    socketServ.of(`/tournament/${tournamentId}`).emit("reload", {
                        ...tournamentDatas,
                        isLive: false,
                        liveEnabled: false
                    });

                    callback(true);
                } catch {
                    callback(false);
                }

            } else {
                callback(false);
            }
        });

        socket.on("editTournament", data => {
            databaseManager.updateTournamentName(tournamentId, data.nom);
            databaseManager.updateTournamentDate(tournamentId, data.date);
            databaseManager.updateTournamentFields(tournamentId, data.terrains);

            liveTournamentId = databaseManager.getSetting("live_tournament");

            socketServ.of(`/tournament/${tournamentId}`).emit("reload", {
                ...databaseManager.getTournamentDatas(tournamentId),
                isLive: liveTournamentId && liveTournamentId == tournamentId ? true: false,
                liveEnabled: liveTournamentId ? true: false
            });
        });

        socket.on("loadMatchs", data => {
            try {
                const matchs = csvManager.readCSV(data.matchs);
               
                let tournamentDatas = databaseManager.getTournamentDatas(tournamentId);
                let tournamentDb = databaseManager.loadDatabase(tournamentDatas.tournamentInfos.databaseName);

                databaseManager.registerMatchs(tournamentDb, matchs);

                liveTournamentId = databaseManager.getSetting("live_tournament");

                socketServ.of(`/tournament/${tournamentId}`).emit("reload", {
                    ...databaseManager.getTournamentDatas(tournamentId),
                    isLive: liveTournamentId && liveTournamentId == tournamentId ? true: false,
                    liveEnabled: liveTournamentId ? true: false
                });
            } catch (error) {
                logger.error(`Erreur lors du parsing des matchs CSV : ${error.message}`);
            }
        });
    }
}