// ------------------------ //
//         IMPORTS          //
// ------------------------ //
const Database = require('better-sqlite3');
const fs = require("fs");

const { MatchStatus } = require('../enums/MatchStatus');
const { TournamentStatus } = require('../enums/TournamentStatus');

const logger = require("../managers/logManager");

// ------------------------ //
//        CONSTANTES        //
// ------------------------ //
const FOLDER_DB_NAME = "databases";
const MAIN_DB_NAME = "main.db";

const MAIN_DB_TOURNAMENTS_TABLE = "tournois";
const MAIN_DB_SETTINGS_TABLE = "settings";
const MAIN_DB_MATCH_TABLE = "matchs";

// matchId, round, category, player1, player2
const NB_ELEMENTS_IN_MATCH_CSV = 5;

// ------------------------ //
//        FONCTIONS         //
// ------------------------ //



/**
 * Créer le dossier des bases de données s'il n'existe pas.
 */
const createDatabaseDirectory = () => {
    if (!fs.existsSync(`${FOLDER_DB_NAME}`)) {
        fs.mkdirSync(FOLDER_DB_NAME);
    }
}


/**
 * Récupère la base de données principale, la crée si elle n'existe pas.
 * @returns { Database }
 */
const getDatabase = () => {
    createDatabaseDirectory();

    let path = `${FOLDER_DB_NAME}/${MAIN_DB_NAME}`;

    if (fs.existsSync(path)) {
        return new Database(path)
    } else {
        createDatabase();
        return getDatabase();
    };
};


/**
 * Créer une base de données si elle n'existe pas.
 * @returns { Database }
 */
const createDatabase = () => {
    createDatabaseDirectory();

    let path = `${FOLDER_DB_NAME}/${MAIN_DB_NAME}`;

    if (!fs.existsSync(path)) {
        let db = new Database(path);

        logger.info(`La base de données principale a été créée sous le nom ${MAIN_DB_NAME}.`);
        initializeDatabase(db);

        return db;
    } else {
        throw new Error(`Une base de données existe déjà sous le nom ${MAIN_DB_NAME}.`);
    }
}


/**
 * Initialise la base de données principale.
 * @param { Database } db 
 */
const initializeDatabase = (db) => {
    let requeteTableTournois = `CREATE TABLE IF NOT EXISTS ${MAIN_DB_TOURNAMENTS_TABLE} (
        idTournoi INTEGER PRIMARY KEY AUTOINCREMENT,
        nomTournoi TEXT NOT NULL,
        dateTournoi TEXT NOT NULL,
        nombreTerrains INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT '${TournamentStatus.UPCOMING}'
    );`;

    let requeteTableSettings = `CREATE TABLE IF NOT EXISTS ${MAIN_DB_SETTINGS_TABLE} (
        key TEXT PRIMARY KEY,
        value TEXT
    );`;

    let requeteTableMatch = `CREATE TABLE IF NOT EXISTS ${MAIN_DB_MATCH_TABLE} (
        idTournoi INTEGER,
        idMatch INTEGER,

        round TEXT NOT NULL,
        category TEXT NOT NULL,

        player1 TEXT NOT NULL,
        player2 TEXT NOT NULL,
        player1Set1 INTEGER,
        player1Set2 INTEGER,
        player1Set3 INTEGER,
        player2Set1 INTEGER,
        player2Set2 INTEGER,
        player2Set3 INTEGER,

        field INTEGER,
        statut TEXT NOT NULL DEFAULT '${MatchStatus.NOT_PLAYED}',

        PRIMARY KEY(idTournoi, idMatch)
    )`

    db.prepare(requeteTableTournois).run();
    db.prepare(requeteTableSettings).run();
    db.prepare(requeteTableMatch).run();
}


/**
 * Enregistre un nouveau tournoi dans la base de données principale.
 * @param {string} tournamentName 
 * @param {string} tournamentDate 
 * @param {int} numberOfCourts 
 */
const registerNewTournament = (tournamentName, tournamentDate, numberOfCourts) => {
    let insertTournament = `INSERT INTO ${MAIN_DB_TOURNAMENTS_TABLE} 
    (nomTournoi, dateTournoi, nombreTerrains) 
    VALUES (?, ?, ?);`;

    let mainDb = getDatabase();
    mainDb.prepare(insertTournament).run(tournamentName, tournamentDate, numberOfCourts);    
};

/**
 * Récupère la liste des tournois enregistrés dans la base de données principale.
 * @returns { Array }
 */
const getTournamentList = () => {
    let mainDb = getDatabase();

    let getTournaments = `SELECT * FROM ${MAIN_DB_TOURNAMENTS_TABLE};`;
    
    return mainDb.prepare(getTournaments).all();
}

/**
 * Met à jour ou enregistre une valeur dans la table des paramètres.
 * @param {string} key 
 * @param {string} value 
 */
const updateSetting = (key, value) => {
    let upsertSetting = `INSERT INTO ${MAIN_DB_SETTINGS_TABLE} (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value;`;

    let mainDb = getDatabase();
    mainDb.prepare(upsertSetting).run(key, value);
};

/**
 * Récupère une valeur dans la table des paramètres.
 * @param {string} key 
 * @returns {string|null}
 */
const getSetting = (key) => {
    let getSetting = `SELECT value FROM ${MAIN_DB_SETTINGS_TABLE} WHERE key = ?;`;

    let mainDb = getDatabase();
    let row = mainDb.prepare(getSetting).get(key);

    if (row) {
        return row.value;
    } else {
        return null;
    }
};


/**
 * Change le nom d'un tournoi dans la base de données principale.
 * @param {int} idTournoi
 * @param {string} newName
 */
const updateTournamentName = (idTournoi, newName) => {
    if (idTournoi <= 0 || isNaN(idTournoi)) {
        throw new Error(`ID de tournoi invalide : ${idTournoi}`);
    };

    let updateName = `UPDATE ${MAIN_DB_TOURNAMENTS_TABLE} SET nomTournoi = ? WHERE idTournoi = ?;`;

    let mainDb = getDatabase();
    mainDb.prepare(updateName).run(newName, idTournoi);
};

/**
 * Change la date d'un tournoi dans la base de données principale.
 * @param {int} idTournoi 
 * @param {string} newDate 
 */
const updateTournamentDate = (idTournoi, newDate) => {
    if (idTournoi <= 0 || isNaN(idTournoi)) {
        throw new Error(`ID de tournoi invalide : ${idTournoi}`);
    };

    let updateDate = `UPDATE ${MAIN_DB_TOURNAMENTS_TABLE} SET dateTournoi = ? WHERE idTournoi = ?;`;

    let mainDb = getDatabase();
    mainDb.prepare(updateDate).run(newDate, idTournoi);
};

/**
 * Change le nombre de terrains d'un tournoi dans la base de données principale.
 * @param {int} idTournoi 
 * @param {int} newNumberOfCourts 
 */
const updateTournamentFields = (idTournoi, newNumberOfCourts) => {
    if (idTournoi <= 0 || isNaN(idTournoi)) {
        throw new Error(`ID de tournoi invalide : ${idTournoi}`);
    };

    if (newNumberOfCourts <= 0 || isNaN(newNumberOfCourts)) {
        throw new Error(`Nombre de terrains invalide : ${newNumberOfCourts}`);
    }

    let updateFields = `UPDATE ${MAIN_DB_TOURNAMENTS_TABLE} SET nombreTerrains = ? WHERE idTournoi = ?;`;

    let mainDb = getDatabase();
    mainDb.prepare(updateFields).run(newNumberOfCourts, idTournoi);
};

// --------------------- MATCH MANAGEMENT --------------------- //

/**
 * Enregistre des matchs dans la base de données. La liste provient d'un fichier CSV.
 * @param { Integer } idTournoi 
 * @param { Array<Array<string>> } matchs 
 */
const registerMatchs = (idTournoi, matchs) => {
    let mainDb = getDatabase();
    
    for (let i = 0; i < matchs.length; i++) {
        let match = matchs[i];

        if (match.length != NB_ELEMENTS_IN_MATCH_CSV) continue;
        
        let insertMatch = `INSERT INTO ${MAIN_DB_MATCH_TABLE} 
        (idTournoi, idMatch, category, round, player1, player2) 
        VALUES (?, ?, ?, ?, ?, ?);`;

        mainDb.prepare(insertMatch).run(
            idTournoi, 
            match[0], // idMatch
            match[1], // category
            match[2], // round
            match[3], // player1
            match[4]  // player2
        );
    }
}

/**
 * Change le statut d'un match dans la base de données.
 * @param { int } idTournoi 
 * @param { int } matchId 
 * @param { MatchStatus } status 
 */
const updateMatchStatus = (idTournoi, matchId, status) => {
    if (matchId <= 0 || isNaN(matchId)) {
        throw new Error(`ID de match invalide : ${matchId}`);
    }

    let matchDatas = getMatchDatas(idTournoi, matchId);
    if (!matchDatas) {
        throw new Error(`Le match avec l'ID ${matchId} n'existe pas pour le tournoi ${idTournoi}.`);
    }



    if (!Object.values(MatchStatus).includes(status)) {
        throw new Error(`Statut de match invalide : ${status}`);
    }

    let updateStatus = `UPDATE matchs SET statut = ? WHERE idMatch = ? AND idTournoi = ?;`;

    db.prepare(updateStatus).run(status, matchId, idTournoi);
};


/**
 * Change le numéro de terrain d'un match dans la base de données.
 * @param {int} idTournoi
 * @param {int} matchId 
 * @param {int} field 
 */
const updateMatchField = (iTournoi, matchId, field) => {
    if (matchId <= 0 || isNaN(matchId)) {
        throw new Error(`ID de match invalide : ${matchId}`);
    }

    let matchDatas = getMatchDatas(idTournoi, matchId);
    if (!matchDatas) {
        throw new Error(`Le match avec l'ID ${matchId} n'existe pas.`);
    }

    if (field <= 0 || isNaN(field)) {
        throw new Error(`Numéro de terrain invalide : ${field}`);
    }
    
    
    let updateField = `UPDATE matchs SET field = ? WHERE idMatch = ? AND idTournoi = ?;`;

    db.prepare(updateField).run(field, matchId, idTournoi);
}



/**
 * Permet de récupérer les données d'un match à partir de son identifiant.
 * @param { int } idTournoi Identifiant du tournoi
 * @param { int } matchId Identifiant du match
 * @returns { Object }
 */
const getMatchDatas = (idTournoi, matchId) => {
    if (matchId <= 0 || isNaN(matchId)) {
        throw new Error(`ID de match invalide : ${matchId}`);
    }

    let getStatus = `SELECT * FROM matchs WHERE idMatch = ? AND idTournoi = ?;`;

    let row = db.prepare(getStatus).get(matchId, idTournoi);

    if (row) {
        return row;
    } else {
        return null;
    }
};

/**
 * Met à jour le score d'un match dans la base de données.
 * @param { int } idTournoi
 * @param { int } matchId 
 * @param { Object } score 
 */
const updateMatchScore = (idTournoi, matchId, score) => {
    if (matchId <= 0 || isNaN(matchId)) {
        throw new Error(`ID de match invalide : ${matchId}`);
    }

    let matchDatas = getMatchDatas(idTournoi, matchId);
    if (!matchDatas) {
        throw new Error(`Le match avec l'ID ${matchId} n'existe pas.`);
    }

    let updateScore = `UPDATE matchs 
    SET player1Set1 = ?, player2Set1 = ?, 
        player1Set2 = ?, player2Set2 = ?, 
        player1Set3 = ?, player2Set3 = ? 
    WHERE idMatch = ? AND idTournoi = ?;`;

    db.prepare(updateScore).run(
        score.player1Set1, score.player2Set1,
        score.player1Set2, score.player2Set2,
        score.player1Set3, score.player2Set3,
        matchId, idTournoi
    );
};

/**
 * Renvoie les données d'un tournoi à partir de son identifiant.
 * @param {Integer} idTournoi Identifiant du tournoi
 * @returns {Object} { tournamentInfos: {...}, matchs: [...] }
 */
const getTournamentDatas = (idTournoi) => {
    if (!idTournoi || isNaN(idTournoi) || idTournoi <= 0) {
        throw new Error(`ID de tournoi invalide : ${idTournoi}`);
    }

    let infosQuery = `SELECT * FROM ${MAIN_DB_TOURNAMENTS_TABLE} WHERE idTournoi = ?;`;

    let tournamentInfo = getDatabase().prepare(infosQuery).get(idTournoi);

    let matchQuery = `SELECT * FROM ${MAIN_DB_MATCH_TABLE} WHERE idTournoi = ?;`;
    let matchs = getDatabase().prepare(matchQuery).all(idTournoi);

    return {
        tournamentInfos: { ...tournamentInfo },
        matchs
    };
}
        

module.exports = {
    getDatabase,
    createDatabase,
    registerNewTournament,
    registerMatchs,
    updateMatchStatus,
    getMatchDatas,
    updateMatchScore,
    getTournamentList,
    getTournamentDatas,
    updateSetting,
    getSetting,
    updateMatchField,
    updateMatchScore,
    updateTournamentDate,
    updateTournamentFields,
    updateTournamentName
}