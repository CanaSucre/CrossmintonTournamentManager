const dbManager = require("../managers/databaseManager");
const websocketManager = require("../managers/websocketManager");

const { MatchStatus } = require("../enums/MatchStatus")

const logger = require("../managers/logManager");

module.exports = {
	namespace: /^\/fieldScore\/\d+$/,
	event: "connection",

	run(socket) {
		const socketServ = websocketManager.getWebsocketServer();

		// Récupération de l'identifiant du terrain depuis le nom du namespace (ex: /fieldScore/3 -> 3)
		const fieldId = socket.nsp.name.split("/").pop();

		if (!fieldId || isNaN(fieldId) || fieldId <= 0) {
			logger.error(`ID de terrain invalide pour la connexion WebSocket : ${fieldId}`);
			return;
		}

		let currentTournamentLive = dbManager.getSetting("live_tournament");

		if (currentTournamentLive) {
			let tournamentData = dbManager.getTournamentDatas(currentTournamentLive);

			let fieldMatch = tournamentData.matchs.find(m => m.field == fieldId && m.statut === MatchStatus.IN_PROGRESS);

			if (fieldMatch) {
				socketServ.of(`/fieldScore/${fieldId}`).emit("update", fieldMatch);
			}

		}
	}
}