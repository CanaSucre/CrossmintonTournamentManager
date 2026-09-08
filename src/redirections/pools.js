const { getPoolScore } = require('../managers/databaseManager');



module.exports = {
    redirection: "/tournament/:id/pools",

    run(req, res) {
        let pools = getPoolScore(req.params.id);

        res.send(pools);
    }
}