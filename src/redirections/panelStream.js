const path = require('path')
const { join } = require('node:path');

module.exports = {
    redirection: "/panelStream",

    run(req, res) {
        res.sendFile(join(__dirname, '../../web/pages/panelStream.html'));
    }
}