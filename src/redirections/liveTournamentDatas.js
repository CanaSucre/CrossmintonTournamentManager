const dbManager = require("../managers/databaseManager");

module.exports = {
    redirection: "/liveTournament",

    run(req, res) {
        let currentTournamentLive = dbManager.getSetting("live_tournament");
        
        if (!currentTournamentLive) {
            res.status(400).send("Aucun tournoi n'est actuellement diffusé.");
            return;
        }

        let tournamentDatas = dbManager.getTournamentDatas(currentTournamentLive);

        if (req.query && req.query.match) {
            res.send(tournamentDatas);
        } else {
            res.send(tournamentDatas.tournamentInfos);
        }

    }
}