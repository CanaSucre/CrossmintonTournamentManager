const { getPoolScore } = require('../managers/databaseManager');
const dbManager = require("../managers/databaseManager");



module.exports = {
    redirection: "/pools",

    run(req, res) {
        let currentTournamentLive = dbManager.getSetting("live_tournament");
        
        if (!currentTournamentLive) {
            res.status(400).send("Aucun tournoi n'est actuellement diffusé.");
            return;
        }

        let pools = getPoolScore(currentTournamentLive);

        res.send(pools);
    }
}