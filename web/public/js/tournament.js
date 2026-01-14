// Récupère le l'ID du tournoi à partir de l'URL : /tournament/:id
const tournamentId = window.location.pathname.split('/').pop();

const socket = io(`/tournament/${tournamentId}`);


socket.on("load", (data) => {
    loadTournamentDatas(data);
});


/**
 * Compte le nombre de matchs joués dans une liste de matchs
 * @param {Array<Object>} matchs 
 * @returns {Integer}
 */
function countPlayedMatches(matchs) {
    let count = 0;

    matchs.forEach(match => {
        if (match.statut === "completed") {
            count++;
        }
    });

    return count;
};


/**
 * Charge les données du tournoi dans la page
 * @param {Object} datas Données du tournoi
 */
function loadTournamentDatas(datas) {
    let title = document.getElementById("tournamentName");
    title.innerText = datas.tournamentInfos.nomTournoi;

    loadActionBarButtons(datas);
    loadStatBar(datas);
    loadMatchesList(datas);
}


/**
 * Charge les boutons de la barre d'action en fonction de l'état du tournoi
 * @param {Object} datas Données du tournoi
 */
function loadActionBarButtons(datas) {
    let actionBarBtn = document.getElementById("actionBarBtn");
    actionBarBtn.innerHTML = "";

    actionBarBtn.innerHTML += `<button type="button" class="btn btn-secondary col-3"><i class="bi bi-gear-fill"></i> Paramètres</button>`
    actionBarBtn.innerHTML += `<button type="button" class="btn btn-primary col-3"><i class="bi bi-upload"></i> Charger matchs</button>`

    // Le bouton est activé que s'il n'y a pas de live en cours sur un autre tournoi et si le tournoi est en cours
    let buttonDisabled = datas.tournamentInfos.status !== "Ongoing" || datas.liveEnabled ? "disabled": "";
    if (datas.isLive) {
        actionBarBtn.innerHTML += `<button type="button" class="btn btn-danger col-3"><i class="bi bi-wifi"></i> Stop LiveScore</button>`;
    } else {
        actionBarBtn.innerHTML += `<button type="button" class="btn btn-success col-3" ${buttonDisabled}><i class="bi bi-wifi"></i> Start LiveScore</button>`;
    }

    switch (datas.tournamentInfos.status) {
        case "Upcoming": {
            actionBarBtn.innerHTML += `<button type="button" class="btn btn-success col-2"><i class="bi bi-play-fill"></i> Démarrer</button>`;
            break;
        };

        case "Ongoing": {
            actionBarBtn.innerHTML += `<button type="button" class="btn btn-danger col-2"><i class="bi bi-stop-fill"></i> Terminer</button>`;
            break;
        };

        case "Completed": {
            actionBarBtn.innerHTML += `<button type="button" class="btn btn-secondary col-2" disabled><i class="bi bi-pause-fill"></i> Terminé</button>`;
            break;
        };
    };

    
}


/**
 * Retourne la liste des joueurs uniques du tournoi
 * @param {Object} datas Données du tournoi
 * @returns 
 */
function getPlayerList(datas) {
    let playersOne = datas.matchs.map(match => match.joueur1);
    let playersTwo = datas.matchs.map(match => match.joueur2);

    let allPlayers = playersOne.concat(playersTwo);

    let uniquePlayers = Array.from(new Set(allPlayers));

    return uniquePlayers;
}

/**
 * Charge la barre de statistiques du tournoi
 * @param {Object} datas Données du tournoi
 */
function loadStatBar(datas) {
    let statBarContent = document.getElementById("statBarContent");
    let totalMatches = datas.matchs.length;
    let playedMatches = countPlayedMatches(datas.matchs);

    let categories = new Set(datas.matchs.map(match => match.category));
    let totalCategories = categories.size;

    let amountPlayers = getPlayerList(datas).length;

    statBarContent.innerHTML = "";

    statBarContent.innerHTML = `
        <div class="statItem text-center p-2">
            <h3>${datas.tournamentInfos.nombreTerrains}</h3>
            <p class="m-0 p-0">terrains</p>
        </div>
        <div class="statItem text-center p-2">
            <h3>${amountPlayers}</h3>
            <p class="m-0 p-0">joueurs</p>
        </div>
        <div class="statItem text-center p-2">
            <h3>${totalCategories}</h3>
            <p class="m-0 p-0">catégories</p>
        </div>
        <div class="statItem text-center p-2">
            <h3>${playedMatches}/${totalMatches}</h3>
            <p class="m-0 p-0">matchs joués</p>
        </div>
    `;
}

/**
 * Affiche la liste des matchs du tournoi
 * @param {Object} datas Données du tournoi
 */
function loadMatchesList(datas) {
    let matchesList = document.getElementById("matchesListContent");

    let categories = new Set(datas.matchs.map(match => match.category));
    
    let categoriesColor = {};
    Array.from(categories).forEach((category, index) => categoriesColor[category] = index);


    datas.matchs.forEach(match => {
        matchesList.innerHTML += `
            <p class="matchEntrie colorMatch-${categoriesColor[match.category]} m-0 d-flex justify-content-between">
                <span>
                    <i class="bi bi-circle-fill ${getColorByStatus_match(match.statut)}"></i>
                    N°${match.idMatch} | ${match.category} - ${match.round} | ${match.joueur1} - ${match.joueur2}
                </span>

                ${match.statut === "completed" ? `<span class="px-2"><i class="bi bi-trophy-fill"></i> ${match.winner}</span>`:``}
            </p>

        `;
    });
}



/**
 * Récupère la couleur associée au statut d'un match.
 * @param {string} status 
 * @returns {string}
 */
function getColorByStatus_match(status) {
    switch (status) {
        case "not_played":
            return "text-danger";
        case "in_progress":
            return "text-warning";
        case "completed":
            return "text-success";
        default:
            return "black";
    }
}
