const { join } = require('node:path');

const dbManager = require("../managers/databaseManager");
const { generateCategoryBracket } = require('../handler/bracketCalculator');

module.exports = {
    redirection: "/liveBracket/:category",

    run(req, res) {

        if (!req.params.category) {
            res.status(400).send("Veuillez saisir une catégorie.");
            return;
        }

        let currentTournamentLive = dbManager.getSetting("live_tournament");

        if (!currentTournamentLive) {
            res.status(400).send("Aucun tournoi n'est actuellement diffusé.");
            return;
        }

        let bracketDatas =generateCategoryBracket(currentTournamentLive, req.params.category);

        if (bracketDatas === undefined) {
            res.status(400).send("Impossible de générer le bracket pour la catégorie demandée. Celle-ci n'existe peut-être pas ou n'a pas encore de matchs.");
            return;
        }

        res.send(bracketDatas);
    }
}