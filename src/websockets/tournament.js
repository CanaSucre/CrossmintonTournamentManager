const databaseManager = require("../managers/databaseManager");
const websocketManager = require("../managers/websocketManager");
const serverReceptionManager = require("../managers/serverReceptionManager");

const csvManager = require("../managers/csvManager");

const logger = require("../managers/logManager");

const config = require("../../config");

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
        let modeAttributionScore = databaseManager.getSetting("mode_attribution_score"); // Si on récupère depuis des serveurs différents ou un unique où on défini le N° de match par terrain à la main

        let tournamentDatas = databaseManager.getTournamentDatas(tournamentId);
        socketServ.of(`/tournament/${tournamentId}`).emit("load", {
            ...tournamentDatas,
            isLive: liveTournamentId && liveTournamentId == tournamentId ? true : false,
            liveEnabled: liveTournamentId ? true : false,
            modeAttributionScore: modeAttributionScore,
            startPort: config.PORT_ECOUTE,
            ipAddress: config.IP_ADRESS_RESEAU,
        })

        setTimeout(() => {
            sendAllLinksMatch();
        }, 1000);



        socket.on("editLiveScoreStatus", (callback) => {
            let liveTournamentId = databaseManager.getSetting("live_tournament");
            let tournamentDatas = databaseManager.getTournamentDatas(tournamentId);

            if (liveTournamentId == null) {
                databaseManager.updateSetting("live_tournament", tournamentId);

                try {
                    serverReceptionManager.startReceptionServer(tournamentDatas.tournamentInfos.nombreTerrains);

                    sendReload();

                    callback(true)
                } catch (error) {
                    callback(false);
                }

            } else if (liveTournamentId == tournamentId) {
                databaseManager.updateSetting("live_tournament", null);

                try {
                    serverReceptionManager.closeReceptionServer();

                    sendReload();

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
            databaseManager.updateTournamentType(tournamentId, data.type);

            liveTournamentId = databaseManager.getSetting("live_tournament");

            sendReload();
        });

        socket.on("loadMatchs", data => {
            try {
                const matchs = csvManager.readCSV(data.matchs);

                databaseManager.registerMatchs(tournamentId, matchs);

                liveTournamentId = databaseManager.getSetting("live_tournament");

                sendReload();
            } catch (error) {
                logger.error(`Erreur lors du parsing des matchs CSV : ${error.message}`);
            }
        });

        socket.on("changeTournamentStatus", (status) => {

            databaseManager.updateTournamentStatus(tournamentId, status);

            liveTournamentId = databaseManager.getSetting("live_tournament");

            sendReload();
        });

        socket.on("toggleLinkMatchWithId", () => {
            let modeAttributionScore = databaseManager.getSetting("mode_attribution_score");

            if (modeAttributionScore === "automatic") {
                databaseManager.updateSetting("mode_attribution_score", "manual");
                sendReload();
                sendAllLinksMatch();
            } else {
                databaseManager.updateSetting("mode_attribution_score", "automatic");
                sendReload();
            }
        });

        socket.on("linkMatchWithId", (data) => {
            const { fieldNumber, matchId } = data;

            console.log(`Linking match ID ${matchId} to field number ${fieldNumber} for tournament ID ${tournamentId}`);

            databaseManager.updateSetting(`match_on_field_${fieldNumber}`, matchId);

            socketServ.of(`/tournament/${tournamentId}`).emit('updateMatchOnField', {
                fieldNumber,
                matchId: Math.floor(matchId)
            })
        });

        const sendReload = () => {
            liveTournamentId = databaseManager.getSetting("live_tournament");
            socketServ.of(`/tournament/${tournamentId}`).emit("reload", {
                ...databaseManager.getTournamentDatas(tournamentId),
                isLive: liveTournamentId && liveTournamentId == tournamentId ? true : false,
                liveEnabled: liveTournamentId ? true : false,
                modeAttributionScore: databaseManager.getSetting("mode_attribution_score"),
                startPort: config.PORT_ECOUTE,
                ipAddress: config.IP_ADRESS_RESEAU,
            });
        };

        const sendAllLinksMatch = () => {
            for (let i = 1; i <= tournamentDatas.tournamentInfos.nombreTerrains; i++) {
                let matchId = databaseManager.getSetting(`match_on_field_${i}`);

                if (!matchId) {
                    databaseManager.updateSetting(`match_on_field_${i}`, 0);
                    matchId = 0;
                }

                socketServ.of(`/tournament/${tournamentId}`).emit('updateMatchOnField', {
                    fieldNumber: i,
                    matchId: Math.floor(matchId)
                });
            }
        }
    }
}