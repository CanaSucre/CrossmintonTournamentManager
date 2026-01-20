const { join } = require('node:path');

const dbManager = require("../managers/databaseManager");

module.exports = {
    redirection: "/fieldScore/:id",

    run(req, res) {

        if (!req.params.id || isNaN(req.params.id) || req.params.id <= 0) {
            res.status(400).send("ID de terrain invalide.");
            return;
        }

        let currentTournamentLive = dbManager.getSetting("live_tournament");

        if (!currentTournamentLive) {
            res.status(400).send("Aucun tournoi n'est actuellement diffusé.");
            return;
        }

        let tournamentData = dbManager.getTournamentDatas(currentTournamentLive);

        if (tournamentData.tournamentInfos.nombreTerrains < req.params.id) {
            res.status(400).send("Le terrain demandé n'existe pas dans le tournoi actuellement diffusé.");
            return;
        }

        res.sendFile(join(__dirname, '../../web/pages/fieldScore.html'));
    }
}