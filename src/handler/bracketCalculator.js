// ------------------------ //
//         IMPORTS          //
// ------------------------ //
let { getBracketsMatchsOfCategory } = require('../managers/databaseManager');

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
        })

        tableau[nextRoundIndex].push({
            player1: 'Bye',            
            player2: match.player2,
        })
    }

}


module.exports = {
    generateCategoryBracket,
};