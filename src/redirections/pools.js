const { getPoolScore } = require('../managers/databaseManager');
const { orderPoolsStats } = require('../handler/scoreCalculator');


module.exports = {
    redirection: "/tournament/:id/pools",

    run(req, res) {
        let pools = getPoolScore(req.params.id);

        orderPoolsStats(pools);

        res.send(pools);
    }
}