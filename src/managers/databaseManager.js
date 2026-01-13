// ------------------------ //
//         IMPORTS          //
// ------------------------ //
const Database = require('better-sqlite3');
const fs = require("fs");

const { MatchStatus } = require('../enums/MatchStatues');

// ------------------------ //
//        CONSTANTES        //
// ------------------------ //
const FOLDER_DB_NAME = "databases";
const MAIN_DB_NAME = "main.db";

const MAIN_DB_TOURNAMENTS_TABLE = "tournois";

// matchId, round, category, player1, player2
const NB_ELEMENTS_IN_MATCH_CSV = 5;

// ------------------------ //
//        PROGRAMME         //
// ------------------------ //


// --------------------- ALL DATABASE --------------------- //


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
        console.log(`La base de données principale a été créée sous le nom ${MAIN_DB_NAME}.`);
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
        databaseName TEXT NOT NULL
    );`;

    db.prepare(requeteTableTournois).run();
}


/**
 * Enregistre un nouveau tournoi dans la base de données principale.
 * @param {string} tournamentName 
 * @param {string} tournamentDate 
 * @param {int} numberOfCourts 
 * @param {string} databaseName 
 */
const registerNewTournament = (tournamentName, tournamentDate, numberOfCourts, databaseName) => {
    if (checkDatabaseExists(databaseName)) {
       throw new Error(`Une base de données existe déjà sous le nom ${databaseName}.`);
    }
 
    let insertTournament = `INSERT INTO ${MAIN_DB_TOURNAMENTS_TABLE} 
    (nomTournoi, dateTournoi, nombreTerrains, databaseName) 
    VALUES (?, ?, ?, ?);`;

    let mainDb = getMainDatabase();
    console.log(mainDb);
    mainDb.prepare(insertTournament).run(tournamentName, tournamentDate, numberOfCourts, databaseName);

    let db = createDatabase(databaseName);
    initializeTournamentDatabase(db);
};

/**
 * Récupère la liste des tournois enregistrés dans la base de données principale.
 * @returns { Array }
 */
const getTournamentList = () => {
    let mainDb = getMainDatabase();

    let getTourneys = `SELECT * FROM ${MAIN_DB_TOURNAMENTS_TABLE};`;
    
    return mainDb.prepare(getTourneys).all();
}


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

        set1Joueur1 INTEGER,
        set1Joueur2 INTEGER,
        set2Joueur1 INTEGER,
        set2Joueur2 INTEGER,
        set3Joueur1 INTEGER,
        set3Joueur2 INTEGER,

        statut TEXT NOT NULL DEFAULT '${MatchStatus.NOT_PLAYED}'
    );`;

    db.prepare(requeteTableMatchs).run();
};

/**
 * Enregistre des matchs dans une base de données de tournoi. La liste provient d'un fichier CSV.
 * @param { Database } db 
 * @param { Array<Array<string>> } matchs 
 */
const registerMatchs = (db, matchs) => {
    
    for (let i = 0; i < matchs.length; i++) {
        let match = matchs[i];

        if (match.length != NB_ELEMENTS_IN_MATCH_CSV) continue;
        
        let insertMatch = `INSERT INTO matchs 
        (idMatch, round, category, joueur1, joueur2) 
        VALUES (?, ?, ?, ?, ?);`;

        db.prepare(insertMatch).run(
            match[0], // idMatch
            match[1], // round
            match[2], // category
            match[3], // player1
            match[4]  // player2
        );
    }
}

/**
 * Change le statut d'un match dans la base de données.
 * @param { Database } db 
 * @param { int } matchId 
 * @param { MatchStatus } status 
 */
const updateMatchStatus = (db, matchId, status) => {
    if (!Object.values(MatchStatus).includes(status)) {
        throw new Error(`Statut de match invalide : ${status}`);
    }

    let updateStatus = `UPDATE matchs SET statut = ? WHERE idMatch = ?;`;

    db.prepare(updateStatus).run(status, matchId);
};

/**
 * Récupère le statut d'un match dans la base de données.
 * @param { Database } db 
 * @param { int } matchId 
 * @returns { MatchStatus }
 */
const getMatchStatus = (db, matchId) => {
    let getStatus = `SELECT statut FROM matchs WHERE idMatch = ?;`;

    let row = db.prepare(getStatus).get(matchId);

    if (row) {
        return row.statut;
    } else {
        throw new Error(`Aucun match trouvé avec l'ID ${matchId}.`);
    }
};

/**
 * Met à jour le score d'un match dans la base de données.
 * @param { Database } db 
 * @param { int } matchId 
 * @param { Object } score 
 */
const updateMatchScore = (db, matchId, score) => {
    let updateScore = `UPDATE matchs 
    SET set1Joueur1 = ?, set1Joueur2 = ?, 
        set2Joueur1 = ?, set2Joueur2 = ?, 
        set3Joueur1 = ?, set3Joueur2 = ? 
    WHERE idMatch = ?;`;

    db.prepare(updateScore).run(
        score.set1.player1, score.set1.player2,
        score.set2.player1, score.set2.player2,
        score.set3.player1, score.set3.player2,
        matchId
    );
};

/**
 * Récupère le score d'un match dans la base de données.
 * @param { Database } db 
 * @param { int } matchId 
 * @returns { Object }
 */
const getMatchScore = (db, matchId) => {
    let getScore = `SELECT 
        set1Joueur1, set1Joueur2, 
        set2Joueur1, set2Joueur2, 
        set3Joueur1, set3Joueur2 
    FROM matchs WHERE idMatch = ?;`;

    let row = db.prepare(getScore).get(matchId);
    
    if (row) {
        return {
            set1: { player1: row.set1Joueur1, player2: row.set1Joueur2 },
            set2: { player1: row.set2Joueur1, player2: row.set2Joueur2 },
            set3: { player1: row.set3Joueur1, player2: row.set3Joueur2 }
        };
    } else {
        throw new Error(`Aucun match trouvé avec l'ID ${matchId}.`);
    }
};
        

module.exports = {
    getMainDatabase,
    createDatabase,
    loadDatabase,
    checkDatabaseExists,
    listDatabases,
    registerNewTournament,
    registerMatchs,
    updateMatchStatus,
    getMatchStatus,
    updateMatchScore,
    getMatchScore,
    getTournamentList
}