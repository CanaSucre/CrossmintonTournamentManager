// ------------------------ //
//         IMPORTS          //
// ------------------------ //
const { MatchStatus } = require('../enums/MatchStatus');

// ------------------------ //
//     INITIALISATIONS      //
// ------------------------ //




// ------------------------ //
//        PROGRAMME         //
// ------------------------ //

const getSetWinner = (player1Score, player2Score) => {
  if (player1Score == '' || player2Score == '') {
    // Set pas encore joué
    return null;
  }

  if (player1Score < 16 && player2Score < 16) {
    // Aucun des 2 joueurs n'a assez de point pour gagner le set
    return null;
  }
  
  
  let delta = Math.abs(player1Score - player2Score); // Différence de points entre les 2 joueurs

  // Le joueur a plus de 16 points, a plus de points que sont adversaire et a au moins 2 points d'écart
  if (player1Score >= 16 && player1Score > player2Score && delta >= 2) {
    return 1;
  } else if (player2Score >= 16 && player2Score > player1Score && delta >= 2) {
    return 2;
  } else {
    return null; // Si pas toutes ces conditions, set non fini
  }
}

const getMatchWinner = (data) => {
  let player1SetsWon = 0;
  let player2SetsWon = 0;

  for (let i = 1; i <= 3; i++) {
    let player1Score = data[`player1Set${i}`];
    let player2Score = data[`player2Set${i}`];

    let setWinner = getSetWinner(player1Score, player2Score);
    if (setWinner === 1) {
      player1SetsWon++;
    } else if (setWinner === 2) {
      player2SetsWon++;
    }
  }

  if (player1SetsWon == 2) {
    return data.player1;
  } else if (player2SetsWon == 2) {
    return data.player2;
  } else {
    return null; // Match non terminé
  }

}


/**
 * Renvoie les différentes statistiques de tous les joueurs à partir des données de ses matchs (nbMatchGagnes, setAverage, pointAverage).
 * @param {*} data - Les données du match.
 * @returns {Object} - Un objet contenant les moyennes des scores.
 */
const calculateAverages = (data) => {

  let playerStats = {};

  for (let i = 0; i < data.length; i++) {
    let match = data[i];

    let { player1, player2, player1Set1, player1Set2, player1Set3, player2Set1, player2Set2, player2Set3, statut, round, category } = match;

    let cleP1 = `${player1}_${round}_${category}`;
    let cleP2 = `${player2}_${round}_${category}`;

    // Initialisation des statistiques pour chaque joueur si elles n'existent pas encore
    if (!playerStats[cleP1]) playerStats[cleP1] = initStats(player1, round, category);
    if (!playerStats[cleP2]) playerStats[cleP2] = initStats(player2, round, category);

    if (statut !== MatchStatus.COMPLETED) continue; // Si le match n'est pas terminé, on ne calcule pas les stats
    playerStats[cleP1].nbMatchPlayed++;
    playerStats[cleP2].nbMatchPlayed++;


    let winner = getMatchWinner(match);
    if (winner === player1) playerStats[cleP1].nbMatchWon++;
    else if (winner === player2) playerStats[cleP2].nbMatchWon++;

    
    for (let i = 1; i <= 3; i++) {
      let player1Score = match[`player1Set${i}`];
      let player2Score = match[`player2Set${i}`];

      if (player1Score !== '' && player2Score !== '') {
        playerStats[cleP1].nbSetsPlayed++;
        playerStats[cleP2].nbSetsPlayed++;
      }

      let setWinner = getSetWinner(player1Score, player2Score);
      if (setWinner === 1) playerStats[cleP1].nbSetsWon++;
      else if (setWinner == 2)  playerStats[cleP2].nbSetsWon++;
    }

    let nbPointsPlayed = 
        parseInt(player1Set1) + parseInt(player1Set2) + parseInt(player1Set3 == '' ? 0 : parseInt(player1Set3))
        + parseInt(player2Set1) + parseInt(player2Set2) + parseInt(player2Set3 == '' ? 0 : parseInt(player2Set3));
    
    playerStats[cleP1].nbPointsWon += (parseInt(player1Set1) + parseInt(player1Set2) + parseInt(player1Set3 == '' ? 0 : parseInt(player1Set3)));
    playerStats[cleP2].nbPointsWon += (parseInt(player2Set1) + parseInt(player2Set2) + parseInt(player2Set3 == '' ? 0 : parseInt(player2Set3)));

    playerStats[cleP1].nbPointsPlayed += nbPointsPlayed;
    playerStats[cleP2].nbPointsPlayed += nbPointsPlayed;
  }

  return playerStats;

}


const initStats = (name, round, category) => {
  return {
    nbMatchPlayed: 0,
    nbMatchWon: 0,
    nbSetsPlayed: 0,
    nbSetsWon: 0,
    nbPointsPlayed: 0,
    nbPointsWon: 0,
    name: name,
    round: round,
    category: category
  };
}


module.exports = {
  calculateAverages,
  getSetWinner,
  getMatchWinner,
  initStats
};