// ------------------------ //
//         IMPORTS          //
// ------------------------ //
const path = require('path')
const { join } = require('node:path');

const express = require('express');
const { createServer } = require('node:http');

const { Server } = require('socket.io');

const config = require("../../config");


// ------------------------ //
//     INITIALISATIONS      //
// ------------------------ //
const app = express();
const server = createServer(app);

app.use(express.static(path.join(__dirname, "../../web/public")))
app.use(express.static(path.join(__dirname, "../../web/pages")))


// ------------------------ //
//        PROGRAMME         //
// ------------------------ //
server.listen(config.PORT_PANEL, () => {
  console.log(`Server running at http://${config.IP_ADRESS_RESEAU}:${config.PORT_PANEL}`);
});


module.exports = {
    app,
    server,
}