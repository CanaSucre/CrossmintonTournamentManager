// ------------------------ //
//         IMPORTS          //
// ------------------------ //
let { getBracketsMatchsOfCategory, getPoolScore, getTournamentDatas } = require('../managers/databaseManager');
let { orderPoolsStats, getMatchWinner } = require('../handler/scoreCalculator');

// ------------------- //
//     CONSTANTES      //
// ------------------- //

const DEBUT_GROUPE = 'group';
const DEBUT_WINNER = 'winner';

// Dans l'ordre de traitement par le programme
const TYPE_FINAL_MATCHS = [ 'finale', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64', '1/128' ];



// ------------------------ //
//        PROGRAMME         //
// ------------------------ //

function getIdMatchWinner(p) {
    let idMatch = p.split('°')[1];

    return idMatch;
}

function isGroup(player) {
    return player.toLowerCase().startsWith(DEBUT_GROUPE);
}

function isWinner(player) {
    return player.toLowerCase().startsWith(DEBUT_WINNER);
}

function isByeMatch(p1, p2) {
    return (isGroup(p1) && isWinner(p2)) || (isWinner(p1) && isGroup(p2));
}

let generateCategoryBracket = (idTournoi, category) => {
    let matchs = getBracketsMatchsOfCategory(idTournoi, category);

    let tableaux = {};

    let matchDebut = matchs.filter(m => m.round.toLowerCase() == TYPE_FINAL_MATCHS[0])[0];
    if (!matchDebut) {
        console.log(`Aucun match de type "${TYPE_FINAL_MATCHS[0]}" trouvé pour la catégorie "${category}" du tournoi ${idTournoi}.`);
        return;
    }


    checkMatch(tableaux, matchs, matchDebut, 0);

    
    for (let i = 0; i < TYPE_FINAL_MATCHS.length; i++) {
        let round = TYPE_FINAL_MATCHS[i];

        if (!tableaux[round]) break;

        let hasMatchWithoutBy = tableaux[round].some(m => m.player1 !== 'Bye' && m.player2 !== 'Bye');
        if (!hasMatchWithoutBy) {
            delete tableaux[round];
        }
    }

    return tableaux;
}

function checkMatch(tableau, listeMatchs, match, avancee) {
    let currentRoundIndex = TYPE_FINAL_MATCHS[avancee];
    if (!tableau[currentRoundIndex]) tableau[currentRoundIndex] = [];
    
    let nextRoundIndex = TYPE_FINAL_MATCHS[avancee + 1];
    if (!tableau[nextRoundIndex]) tableau[nextRoundIndex] = [];
    

    tableau[currentRoundIndex].push(match);

    if (isByeMatch(match.player1, match.player2)) {
        let player1 = match.player1;
        let player2 = match.player2;

        if (isGroup(player1)) {
            tableau[nextRoundIndex].push({
                player1: player1,
                player2: 'Bye',
                category: match.category,
                round: nextRoundIndex
            });

            let idMatch = getIdMatchWinner(player2);
            let matchDatas = listeMatchs.filter(m => m.idMatch == idMatch)[0];

            checkMatch(tableau, listeMatchs, matchDatas, avancee + 1);
        } else {
            let idMatch = getIdMatchWinner(player1);
            let matchDatas = listeMatchs.filter(m => m.idMatch == idMatch)[0];

            checkMatch(tableau, listeMatchs, matchDatas, avancee + 1);


            tableau[nextRoundIndex].push({
                player1: 'Bye',
                player2: player2,
                category: match.category,
                round: nextRoundIndex
            });
        }

        


        
    };

    if (isWinner(match.player1) && isWinner(match.player2)) {
        let idMatch1 = getIdMatchWinner(match.player1);
        let idMatch2 = getIdMatchWinner(match.player2);

        let matchDatas1 = listeMatchs.filter(m => m.idMatch == idMatch1)[0];
        let matchDatas2 = listeMatchs.filter(m => m.idMatch == idMatch2)[0];

        checkMatch(tableau, listeMatchs, matchDatas1, avancee + 1);
        checkMatch(tableau, listeMatchs, matchDatas2, avancee + 1);
    }

   
    if (isGroup(match.player1) && isGroup(match.player2)) {
        tableau[nextRoundIndex].push({
            player1: match.player1,
            player2: 'Bye',
            category: match.category,
            round: nextRoundIndex
        })

        tableau[nextRoundIndex].push({
            player1: 'Bye',
            player2: match.player2,
            category: match.category,
            round: nextRoundIndex
        })
    }

}



/**
 * Remplace les noms de joueurs tel que `Group 1 #2` ou `WINNER N°X` par le nom du joueur réel s'il est défini.
 * @param {string} dataType Provenance des données à remplacer (pour savoir leur forme et comment les traiter)
 * @param {object} datas Données
 */
let replaceTargetByName = (idTournoi, dataType, datas) => {
    let replacement;

    if (dataType === 'bracket') replacement = __replaceTargetByName_bracket(idTournoi, datas);

    return replacement;
}

function __replaceTargetByName_bracket(idTournoi, datas, nbPassage = 0) {
    
    if (nbPassage > 2) {
        return datas;
    }

    let poolIsFinished = (pool) => {
        let players = Object.keys(pool);
        let nbMatchsAJouer = players.length - 1; // Chaque joueur doit jouer contre tous les autres joueurs de la poule

        // Check que tous les joueurs ont fait leur nombre de matchs
        return players.every(p => pool[p].nbMatchPlayed == nbMatchsAJouer);
    }

    let poolsDatas = getPoolScore(idTournoi);
    orderPoolsStats(poolsDatas);

    let matchsDatas = getTournamentDatas(idTournoi)?.matchs;

    let rounds = Object.keys(datas).filter(r => TYPE_FINAL_MATCHS.includes(r)).sort((a, b) => TYPE_FINAL_MATCHS.indexOf(a) - TYPE_FINAL_MATCHS.indexOf(b));
    for (let round of rounds) {
        for (let i = 0; i < datas[round].length; i++) {
            let match = datas[round][i];

            if (isWinner(match.player1)) {
                let matchId = getIdMatchWinner(match.player1);
                let mDatas = matchsDatas.filter(m => m.idMatch == matchId)[0];

                if (mDatas.winner) match.player1 = mDatas.winner;
            }
            
            if (isGroup(match.player1)) {
                let poolName = match.player1.split('#')[0].split("Group ")[1].trim();
                let poolRank = parseInt(match.player1.split('#')[1].trim());

                

                let pDatas = poolsDatas[match.category][poolName];
                // Pas de remplacement si la poule n'est pas terminée, car on ne sait pas encore qui est le joueur à cette place
                if (poolIsFinished(pDatas)) {
                    let playerTargeted = Object.keys(pDatas).filter(p => pDatas[p].rank == poolRank)[0];
                    if (playerTargeted) match.player1 = playerTargeted;
                }

            }

            if (isWinner(match.player2)) {
                let matchId = getIdMatchWinner(match.player2);
                let mDatas = matchsDatas.filter(m => m.idMatch == matchId)[0];
                
                if (mDatas.winner) match.player2 = mDatas.winner;
            }
            
            if (isGroup(match.player2)) {
                let poolName = match.player2.split('#')[0].split("Group ")[1].trim();
                let poolRank = parseInt(match.player2.split('#')[1].trim());


                let pDatas = poolsDatas[match.category][poolName];
                // Pas de remplacement si la poule n'est pas terminée, car on ne sait pas encore qui est le joueur à cette place
                if (poolIsFinished(pDatas)) {
                    let playerTargeted = Object.keys(pDatas).filter(p => pDatas[p].rank == poolRank)[0];
                    if (playerTargeted) match.player2 = playerTargeted;
                }
            }

            datas[round][i] = match;
        }
    }

    return braketDatas = __replaceTargetByName_bracket(idTournoi, datas, nbPassage + 1);
}

module.exports = {
    generateCategoryBracket,
    replaceTargetByName
};