const { join } = require('node:path');

module.exports = {
    redirection: "/tournament/:id",

    run(req, res) {
        res.sendFile(join(__dirname, '../../web/pages/tournament.html'));
    }
}