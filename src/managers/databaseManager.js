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

// matchId, round, category, player1, player2
const NB_ELEMENTS_IN_MATCH_CSV = 5;

// ------------------------ //
//        PROGRAMME         //
// ------------------------ //


// --------------------- ALL DATABASE --------------------- //


/**
 * Vérifie si le nom de la base de données est valide (doit se terminer par .db)
 * @param {string} databaseName 
 * @returns { boolean }
 */
const isValidDatabaseName = (databaseName) => {
    return databaseName.endsWith(".db");
}


/**
 * Créer le dossier des bases de données s'il n'existe pas.
 */
const createDatabaseDirectory = () => {
    if (!fs.existsSync(`${FOLDER_DB_NAME}`)) {
        fs.mkdirSync(FOLDER_DB_NAME);
    }
}


/**
 * Charge une base de données si elle existe
 * @param {string} databaseName | Nom de la base de données à charger
 * @returns { Database }
 */
const loadDatabase = (databaseName) => {
    if (!isValidDatabaseName(databaseName)) {
        throw new Error(`Le nom de la base de données doit se terminer par .db`);
    }

    createDatabaseDirectory();

    let path = `${FOLDER_DB_NAME}/${databaseName}`;

    if (fs.existsSync(path)) {
        return new Database(path)
    } else {
        throw new Error(`Aucune base de donnée n'existe sous le nom ${databaseName}.`);
    };
};


/**
 * Créer une base de données si elle n'existe pas.
 * @param {string} databaseName | Nom de la base de données à créer
 * @returns { Database }
 */
const createDatabase = (databaseName) => {
    if (!isValidDatabaseName(databaseName)) {
        throw new Error(`Le nom de la base de données doit se terminer par .db`);
    }

    createDatabaseDirectory();

    let path = `${FOLDER_DB_NAME}/${databaseName}`

    if (fs.existsSync(path)) {
        throw new Error(`Une base de données existe déjà sous le nom ${databaseName}.`);
    } else {
        return new Database(path);
    };
}


/**
 * Vérifie si une base de données éxiste
 * @param {string} databaseName 
 * @returns { boolean }
 */
const checkDatabaseExists = (databaseName) => {
    if (!isValidDatabaseName(databaseName)) {
        throw new Error(`Le nom de la base de données doit se terminer par .db`);
    }

    createDatabaseDirectory();

    let path = `${FOLDER_DB_NAME}/${databaseName}`

    return fs.existsSync(path);
};



// --------------------- MAIN DATABASE --------------------- //

/**
 * Récupère la base de données principale, la crée si elle n'existe pas.
 * @returns { Database }
 */
const getMainDatabase = () => {
    if (!checkDatabaseExists(MAIN_DB_NAME)) {
        let db = createDatabase(MAIN_DB_NAME);

        initializeMainDatabase(db);
        logger.info(`La base de données principale a été créée sous le nom ${MAIN_DB_NAME}.`);
    }

    return loadDatabase(MAIN_DB_NAME);
}

/**
 * Initialise la base de données principale.
 * @param { Database } db 
 */
const initializeMainDatabase = (db) => {
    let requeteTableTournois = `CREATE TABLE IF NOT EXISTS ${MAIN_DB_TOURNAMENTS_TABLE} (
        idTournoi INTEGER PRIMARY KEY AUTOINCREMENT,
        nomTournoi TEXT NOT NULL,
        dateTournoi TEXT NOT NULL,
        nombreTerrains INTEGER NOT NULL,
        databaseName TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT '${TournamentStatus.UPCOMING}'
    );`;

    let requeteTableSettings = `CREATE TABLE IF NOT EXISTS ${MAIN_DB_SETTINGS_TABLE} (
        key TEXT PRIMARY KEY,
        value TEXT
    );`;

    db.prepare(requeteTableTournois).run();
    db.prepare(requeteTableSettings).run();
}


/**
 * Enregistre un nouveau tournoi dans la base de données principale.
 * @param {string} tournamentName 
 * @param {string} tournamentDate 
 * @param {int} numberOfCourts 
 * @param {string} databaseName 
 */
const registerNewTournament = (tournamentName, tournamentDate, numberOfCourts) => {
    let databaseName = generateTournamentDatabaseName(tournamentName, tournamentDate);

    let insertTournament = `INSERT INTO ${MAIN_DB_TOURNAMENTS_TABLE} 
    (nomTournoi, dateTournoi, nombreTerrains, databaseName) 
    VALUES (?, ?, ?, ?);`;

    let mainDb = getMainDatabase();
    mainDb.prepare(insertTournament).run(tournamentName, tournamentDate, numberOfCourts, databaseName);

    let db = createDatabase(databaseName);
    initializeTournamentDatabase(db);
};


/**
 * Génère un nom de base de données unique pour un tournoi.
 * @param {string} tournamentName 
 * @param {string} tournamentDate 
 * @returns {string}
 */
const generateTournamentDatabaseName = (tournamentName, tournamentDate) => {
    let datePart = tournamentDate.replace(/-/g, "");
    let namePart = tournamentName.replaceAll("-", "").trim().replace(/\s+/g, "_").toLowerCase();

    if (checkDatabaseExists(`${namePart}-${datePart}.db`)) {
        let counter = 1;

        while (checkDatabaseExists(`${namePart}-${datePart}-${counter}.db`)) {
            counter++;
        }

        return `${namePart}-${datePart}-${counter}.db`;
    }

    return `${namePart}-${datePart}.db`;
}

/**
 * Récupère la liste des tournois enregistrés dans la base de données principale.
 * @returns { Array }
 */
const getTournamentList = () => {
    let mainDb = getMainDatabase();

    let getTourneys = `SELECT * FROM ${MAIN_DB_TOURNAMENTS_TABLE};`;

    return mainDb.prepare(getTourneys).all();
}

/**
 * Met à jour ou enregistre une valeur dans la table des paramètres.
 * @param {string} key 
 * @param {string} value 
 */
const updateSetting = (key, value) => {
    let upsertSetting = `INSERT INTO ${MAIN_DB_SETTINGS_TABLE} (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value;`;

    let mainDb = getMainDatabase();
    mainDb.prepare(upsertSetting).run(key, value);
};

/**
 * Récupère une valeur dans la table des paramètres.
 * @param {string} key 
 * @returns {string|null}
 */
const getSetting = (key) => {
    let getSetting = `SELECT value FROM ${MAIN_DB_SETTINGS_TABLE} WHERE key = ?;`;

    let mainDb = getMainDatabase();
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

    let mainDb = getMainDatabase();
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

    let mainDb = getMainDatabase();
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

    let mainDb = getMainDatabase();
    mainDb.prepare(updateFields).run(newNumberOfCourts, idTournoi);
};

// --------------------- OTHER DATABASE --------------------- //

const listDatabases = () => {
    createDatabaseDirectory();

    let files = fs.readdirSync(FOLDER_DB_NAME);

    files = files.filter(file =>
        file.endsWith(".db") &&
        file !== MAIN_DB_NAME
    );

    return files;
}

/**
 * Initialise une base de données de tournoi.
 * @param { Database } db 
 */
const initializeTournamentDatabase = (db) => {
    let requeteTableMatchs = `CREATE TABLE IF NOT EXISTS matchs (
        idMatch INTEGER PRIMARY KEY,

        round TEXT NOT NULL,
        category TEXT NOT NULL,

        joueur1 TEXT NOT NULL,
        joueur2 TEXT NOT NULL,

        player1Set1 INTEGER,
        player2Set1 INTEGER,
        player1Set2 INTEGER,
        player2Set2 INTEGER,
        player1Set3 INTEGER,
        player2Set3 INTEGER,


        field INTEGER,
        winner TEXT,

        statut TEXT NOT NULL DEFAULT '${MatchStatus.NOT_PLAYED}'
    );`;

    db.prepare(requeteTableMatchs).run();
};

/**
 * Enregistre des matchs dans une base de données de tournoi. La liste provient d'un fichier CSV.
 * @param { Database } db 
 * @param { Array<Array<string>> } matchs 
 */
const registerMatchs = async (db, matchs) => {
    return new Promise(async resolve => {
        for (let i = 0; i < matchs.length; i++) {
            let match = matchs[i];

            if (match.length != NB_ELEMENTS_IN_MATCH_CSV) continue;

            let insertMatch = `INSERT INTO matchs 
        (idMatch, category, round, joueur1, joueur2) 
        VALUES (?, ?, ?, ?, ?);`;

            await db.prepare(insertMatch).run(
                match[0], // idMatch
                match[1], // category
                match[2], // round
                match[3], // player1
                match[4]  // player2
            );
        }
    })

}

/**
 * Change le statut d'un match dans la base de données.
 * @param { Database } db 
 * @param { int } matchId 
 * @param { MatchStatus } status 
 */
const updateMatchStatus = (db, matchId, status) => {
    if (matchId <= 0 || isNaN(matchId)) {
        throw new Error(`ID de match invalide : ${matchId}`);
    }

    let matchDatas = getMatchDatas(db, matchId);
    if (!matchDatas) {
        throw new Error(`Le match avec l'ID ${matchId} n'existe pas.`);
    }



    if (!Object.values(MatchStatus).includes(status)) {
        throw new Error(`Statut de match invalide : ${status}`);
    }

    let updateStatus = `UPDATE matchs SET statut = ? WHERE idMatch = ?;`;

    db.prepare(updateStatus).run(status, matchId);
};


/**
 * Change le numéro de terrain d'un match dans la base de données.
 * @param {Database} db 
 * @param {int} matchId 
 * @param {int} field 
 */
const updateMatchField = (db, matchId, field) => {
    if (matchId <= 0 || isNaN(matchId)) {
        throw new Error(`ID de match invalide : ${matchId}`);
    }

    let matchDatas = getMatchDatas(db, matchId);
    if (!matchDatas) {
        throw new Error(`Le match avec l'ID ${matchId} n'existe pas.`);
    }

    if (field <= 0 || isNaN(field)) {
        throw new Error(`Numéro de terrain invalide : ${field}`);
    }


    let updateField = `UPDATE matchs SET field = ? WHERE idMatch = ?;`;

    db.prepare(updateField).run(field, matchId);
}

/**
 * Change le gagnant d'un match dans la base de données.
 * @param {Database} db 
 * @param {int} matchId 
 * @param {string} winner 
 */
const updateMatchWinner = (db, matchId, winner) => {
    if (matchId <= 0 || isNaN(matchId)) {
        throw new Error(`ID de match invalide : ${matchId}`);
    }

    let matchDatas = getMatchDatas(db, matchId);
    if (!matchDatas) {
        throw new Error(`Le match avec l'ID ${matchId} n'existe pas.`);
    }

    // if (winner !== matchDatas.joueur1 && winner !== matchDatas.joueur2) {
    //     throw new Error(`Le gagnant spécifié (${winner}) n'est pas un des joueurs du match ${matchId}.`);
    // }

    if (
        matchDatas.statut === MatchStatus.NOT_PLAYED ||
        matchDatas.statut === MatchStatus.IN_PROGRESS
    ) {
        throw new Error(`Le match avec l'ID ${matchId} n'a pas encore terminé. Impossible de définir un gagnant.`);
    }

    let updateWinner = `UPDATE matchs SET winner = ? WHERE idMatch = ?;`;

    db.prepare(updateWinner).run(winner, matchId);
};

/**
 * Permet de récupérer les données d'un match à partir de son identifiant.
 * @param { Database } db Base de données où se situe le match
 * @param { int } matchId Identifiant du match
 * @returns { Object }
 */
const getMatchDatas = (db, matchId) => {
    if (matchId <= 0 || isNaN(matchId)) {
        throw new Error(`ID de match invalide : ${matchId}`);
    }

    let getStatus = `SELECT * FROM matchs WHERE idMatch = ?;`;

    let row = db.prepare(getStatus).get(matchId);

    if (row) {
        return row;
    } else {
        return null;
    }
};

/**
 * Met à jour le score d'un match dans la base de données.
 * @param { Database } db 
 * @param { int } matchId 
 * @param { Object } score 
 */
const updateMatchScore = (db, matchId, score) => {
    if (matchId <= 0 || isNaN(matchId)) {
        throw new Error(`ID de match invalide : ${matchId}`);
    }

    let matchDatas = getMatchDatas(db, matchId);
    if (!matchDatas) {
        throw new Error(`Le match avec l'ID ${matchId} n'existe pas.`);
    }

    let updateScore = `UPDATE matchs 
    SET player1Set1 = ?, player2Set1 = ?, 
        player1Set2 = ?, player2Set2 = ?, 
        player1Set3 = ?, player2Set3 = ? 
    WHERE idMatch = ?;`;

    db.prepare(updateScore).run(
        score.player1Set1, score.player2Set1,
        score.player1Set2, score.player2Set2,
        score.player1Set3, score.player2Set3,
        matchId
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

    let getInfos = `SELECT nomTournoi, dateTournoi, nombreTerrains, status, databaseName FROM ${MAIN_DB_TOURNAMENTS_TABLE} WHERE idTournoi = ?;`;

    let mainDb = getMainDatabase();
    let tournamentInfo = mainDb.prepare(getInfos).get(idTournoi);

    let tournamentDb = loadDatabase(tournamentInfo.databaseName);

    return {
        tournamentInfos: { ...tournamentInfo },
        matchs: tournamentDb.prepare(`SELECT * FROM matchs;`).all()
    };
}


module.exports = {
    getMainDatabase,
    createDatabase,
    loadDatabase,
    checkDatabaseExists,
    listDatabases,
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
    updateMatchWinner,
    updateTournamentDate,
    updateTournamentFields,
    updateTournamentName
}