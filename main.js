/** Importation des modules */
const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const path = require('path')

const http = require('http');
const querystring = require('querystring');

/** Initialisation des applications */
const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "web/public")))
app.use(express.static(path.join(__dirname, "web/pages")))


/** Variables globales */
const config = require("./config");
let cache = {
  floorMatchs: {},
}

const serverHttp = http.createServer((req, res) => { handleScoreReception(req, res) });

/** Redirection de base */
app.get('/', (req, res) => {
  console.log(req);

  res.send({ status: 1, message: "Affichez le /panel" });
});

/** Panels Web */
app.get(`/panelStream`, (req, res) => {
  res.sendFile(join(__dirname, 'web/pages/panelStream.html'));
})

app.get(`/score`, (req, res) => {
  res.sendFile(join(__dirname, 'web/pages/score.html'));
})

app.get(`/viewer`, (req, res) => {
  res.sendFile(join(__dirname, 'web/pages/viewer.html'));
})

/** Gestion des overlay de scores */
app.get(`/setFloorMatch`, (req, res) => {

  let { floor, matchNumber } = req.query;

  if (!floor || isNaN(parseInt(floor))) return res.send({ status: 0 });

  floor = parseInt(floor);

  cache.floorMatchs[floor] = {
    match: matchNumber == "" ? null: parseInt(matchNumber),
    scores: null,
  };

  io.of(`floor${floor}`).emit("hide");

  res.send({ status: 1 })

});

/** Récupération du cache */
app.get(`/getCache`, (req, res) => {
  res.send({ status: 1, cache: cache });
})

/** Génération des pages de terrains */
for (let i = 0; i < config.AMOUNT_FLOORS; i++) {

  /** Génération des redirections */
  app.get(`/floor${i + 1}`, (req, res) => {
    res.sendFile(join(__dirname, "web/pages/floorOverlay.html"));
  });

  /** Génération des WebSocket*/
  io.of(`/floor${i + 1}`).on("connection", (socket) => {
    console.log(`CONNECTION : /floor${i + 1}`);

    setTimeout(() => {
      if (cache.floorMatchs[i+1]?.scores) {
        updateFloorScore(i + 1, cache.floorMatchs[i+1].scores);
      } else {
        io.of(`/floor${i+1}`).emit("hide");
      }
    }, 500);

    socket.on('disconnect', () => {
      console.log(`DECONNECTION : /floor${i + 1}`);
    });
  });

  cache.floorMatchs[i + 1] = {
    match: null,
    scores: null,
  };
};

/** Gestion des sockets */
io.of(`/panel`).on("connection", (socket) => {
  setTimeout(() => {
    io.of("/panel").emit("load", {
      status: 1,
      name: config.TOURNAMENT_NAME,
      amountFloors: config.AMOUNT_FLOORS,
      date: config.DATE,
      port: config.PORT_PANEL,
      cache: cache,
      ipAdressReseau: config.IP_ADRESS_RESEAU,
    })
  }, 200);

  socket.on("alert", datas => {
    io.of("/viewer").emit("notif", datas);
  });
});

io.of(`/score`).on("connection", (socket) => {
  setTimeout(() => {
    io.of("/score").emit("load", {
      status: 1,
      name: config.TOURNAMENT_NAME,
      amountFloors: config.AMOUNT_FLOORS,
      date: config.DATE,
      port: config.PORT_PANEL,
      ipAdressReseau: config.IP_ADRESS_RESEAU,
    })
  }, 200);
});

io.of(`/viewer`).on("connection", (socket) => { });

/** Fonctions diverses */
function updateFloorScore(floor, datas) {

  datas.ipAdressReseau = config.IP_ADRESS_RESEAU;

  io.of(`/floor${floor}`).emit("update", datas);

  return 1;
};

/** Fonction réception scores */
function handleScoreReception(req, res) {
  if (req.method === "POST") {
    let body = [];

    req.on('data', chunk => {
      body.push(chunk);
    });

    req.on('end', () => {
      body = Buffer.concat(body).toString();

      const data = querystring.parse(body);
      if (data.liveCompleted == "Completed" || data.liveCompleted == "Live") {
        let floors = Object.keys(cache.floorMatchs).filter(k => cache.floorMatchs[k].match == data.numMatch);

        if (floors?.length > 0) {
          floors.forEach(f => {
            updateFloorScore(f, data);

            io.of("/panel").emit("editFloorInfos", { floor: f, ...data });

            if (!cache.floorMatchs[f].scores) {
              io.of("/panel").emit("notif", {
                type: "info",
                message: `Début de match entre ${data.player1} et ${data.player2} sur le terrain ${f}.`
              });
            };


            if (data.winner != "") {
              io.of("/panel").emit("notif", {
                type: "info",
                message: `Match du terrain ${f} terminé : ${data.player1} - ${data.player2} | Vainqueur : ${data.winner}`
              })

              io.of("/panel").emit("endMatch", f);

              cache.floorMatchs[f] = {
                match: null,
                scores: null,
              };
            } else {
              cache.floorMatchs[f].scores = data;
            }

          })
        } else {
          io.of("/panel").emit("notif", {
            type: "error",
            message: `Le match ${data.numMatch} est en cours mais n'est lié à aucun terrain.`
          });
        };
      };

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('received\n');
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: "Méthode non autorisée" }));
  }
}


server.listen(config.PORT_PANEL, () => {
  console.log(`Server running at http://${config.IP_ADRESS_RESEAU}:${config.PORT_PANEL}`);
});

serverHttp.listen(config.PORT_ECOUTE, config.IP_ADRESS_RESEAU, () => {
  console.log(`Serveur de réception des scores démarré sur http://${config.IP_ADRESS_RESEAU}:${config.PORT_ECOUTE}`);
});