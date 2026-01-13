const path = require('path')
const { join } = require('node:path');

module.exports = {
    redirection: "/viewer",

    run(req, res) {
        res.sendFile(join(__dirname, '../../web/pages/viewer.html'));
    }
}