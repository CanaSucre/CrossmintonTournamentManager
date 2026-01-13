const path = require('path')
const { join } = require('node:path');

module.exports = {
    redirection: "/",

    run(req, res) {
        res.sendFile(join(__dirname, '../../web/pages/index.html'));
    }
}