const { getPoolScore } = require('../managers/databaseManager');
const dbManager = require("../managers/databaseManager");
const { orderPoolsStats } = require('../handler/scoreCalculator');


module.exports = {
    redirection: "/pools",

    run(req, res) {
        let currentTournamentLive = dbManager.getSetting("live_tournament");
        
        if (!currentTournamentLive) {
            res.status(400).send("Aucun tournoi n'est actuellement diffusé.");
            return;
        }

        let pools = getPoolScore(currentTournamentLive);

        orderPoolsStats(pools);

        res.send(pools);
    }
}