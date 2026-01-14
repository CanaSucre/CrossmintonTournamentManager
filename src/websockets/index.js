const databaseManager = require("../managers/databaseManager");
const websocketManager = require("../managers/websocketManager");

module.exports = {
    namespace: "/index",
    event: "connection",

    run(socket) {

        let socketServ = websocketManager.getWebsocketServer();

        socketServ.of("/index").emit("load", {
            tournaments: databaseManager.getTournamentList(),
            tournamentLive: databaseManager.getSetting("live_tournament"), 
        })

        

        socket.on("createTournament", (datas) => {
            databaseManager.registerNewTournament(datas.nom, datas.date, datas.terrains);

            socketServ.of("/index").emit("load", {
                tournaments: databaseManager.getTournamentList(),
                tournamentLive: databaseManager.getSetting("live_tournament"), 
            })
        })

    }
}