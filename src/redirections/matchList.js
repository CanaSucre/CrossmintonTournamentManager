const { join } = require('node:path');

module.exports = {
    redirection: "/tournament/:id/matchList",

    run(req, res) {
        res.sendFile(join(__dirname, '../../web/pages/matchList.html'));
    }
}