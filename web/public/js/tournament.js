// Récupère le l'ID du tournoi à partir de l'URL : /tournament/:id
const tournamentId = window.location.pathname.split('/').pop();
const socket = io(`/tournament/${tournamentId}`);

let currentFilterStatus = "all";
let currentFilterCategory = "all";
let currentSort = "num_match";

let tournamentDatas = {};

socket.once("load", (data) => {
    tournamentDatas = data;

    loadTournamentDatas();
});


document.getElementById("matchFilter_status").addEventListener("change", (event) => {
    currentFilterStatus = event.target.value;
    applyFiltersAndSorting();
});

document.getElementById("matchFilter_category").addEventListener("change", (event) => {
    currentFilterCategory = event.target.value;
    applyFiltersAndSorting();
});

document.getElementById("matchSort").addEventListener("change", (event) => {
    currentSort = event.target.value;
    applyFiltersAndSorting();
});


/**
 * Applique les filtres et le tri aux données du tournoi
 */
function applyFiltersAndSorting() {
    let categorieList = getCategoryList();
    let matchList = tournamentDatas.matchs;

    // Filtrer par statut
    if (currentFilterStatus !== "all") {
        matchList = matchList.filter(match => match.statut === currentFilterStatus);
    }

    // Filtrer par catégorie
    if (currentFilterCategory !== "all") {
        matchList = matchList.filter(match => categorieList.indexOf(match.category) == currentFilterCategory);
    }

    // Trier les matchs
    switch (currentSort) {
        case "num_match":
            matchList.sort((a, b) => a.idMatch - b.idMatch);
            break;
        
        case "categorie":
            matchList.sort((a, b) => {
                if (a.category < b.category) return -1;
                if (a.category > b.category) return 1;
                return 0;
            });
            break;
    }


    loadMatchesList(matchList);
}

/**
 * Compte le nombre de matchs joués dans une liste de matchs
 * @returns {Integer}
 */
function countPlayedMatches() {
    let count = 0;

    tournamentDatas.matchs.forEach(match => {
        if (match.statut === "completed") {
            count++;
        }
    });

    return count;
};


/**
 * Charge les données du tournoi dans la page
 */
function loadTournamentDatas() {
    let title = document.getElementById("tournamentName");
    title.innerText = tournamentDatas.tournamentInfos.nomTournoi;

    loadActionBarButtons(tournamentDatas);
    loadStatBar(tournamentDatas);
    loadMatchesList(tournamentDatas.matchs);


     // Remplir les options de filtre par catégorie
    let categoryFilterSelect = document.getElementById("matchFilter_category");
    let categories = getCategoryList();

    categories.forEach((category, index) => {
        let option = document.createElement("option");
        option.value = index;
        option.text = category;
        categoryFilterSelect.appendChild(option);
    });
}


/**
 * Charge les boutons de la barre d'action en fonction de l'état du tournoi
 */
function loadActionBarButtons() {
    let actionBarBtn = document.getElementById("actionBarBtn");
    actionBarBtn.innerHTML = "";

    actionBarBtn.innerHTML += `<button type="button" class="btn btn-secondary col-3"><i class="bi bi-gear-fill"></i> Paramètres</button>`
    actionBarBtn.innerHTML += `<button type="button" class="btn btn-primary col-3"><i class="bi bi-upload"></i> Charger matchs</button>`

    // Le bouton est activé que s'il n'y a pas de live en cours sur un autre tournoi et si le tournoi est en cours
    let buttonDisabled = tournamentDatas.tournamentInfos.status !== "Ongoing" || tournamentDatas.liveEnabled ? "disabled": "";
    if (tournamentDatas.isLive) {
        actionBarBtn.innerHTML += `<button type="button" class="btn btn-danger col-3"><i class="bi bi-wifi"></i> Stop LiveScore</button>`;
    } else {
        actionBarBtn.innerHTML += `<button type="button" class="btn btn-success col-3" ${buttonDisabled}><i class="bi bi-wifi"></i> Start LiveScore</button>`;
    }

    switch (tournamentDatas.tournamentInfos.status) {
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
 * @returns {Array}
 */
function getPlayerList() {
    let playersOne = tournamentDatas.matchs.map(match => match.joueur1);
    let playersTwo = tournamentDatas.matchs.map(match => match.joueur2);
    let allPlayers = playersOne.concat(playersTwo);

    let uniquePlayers = Array.from(new Set(allPlayers));

    return uniquePlayers;
}

/**
 * Retourne la liste des catégories uniques du tournoi
 * @returns {Array}
 */
function getCategoryList() {
    let categories = new Set(tournamentDatas.matchs.map(match => match.category));
    return Array.from(categories);
}

/**
 * Charge la barre de statistiques du tournoi
 * @param {Object} datas Données du tournoi
 */
function loadStatBar() {
    let statBarContent = document.getElementById("statBarContent");
    let totalMatches = tournamentDatas.matchs.length;
    let playedMatches = countPlayedMatches(tournamentDatas.matchs);

    let categories = new Set(tournamentDatas.matchs.map(match => match.category));
    let totalCategories = categories.size;

    let amountPlayers = getPlayerList().length;

    statBarContent.innerHTML = "";

    statBarContent.innerHTML = `
        <div class="statItem text-center p-2">
            <h3>${tournamentDatas.tournamentInfos.nombreTerrains}</h3>
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
function loadMatchesList(matchArray) {
    let matchesList = document.getElementById("matchesListContent");
    matchesList.innerHTML = "";
    
    let categoriesColor = {};
   getCategoryList().forEach((category, index) => categoriesColor[category] = index);


    matchArray.forEach(match => {
        matchesList.innerHTML += `
            <div class="matchEntrie m-0">
                <div class="d-flex justify-content-between colorMatch-${categoriesColor[match.category]}">
                    <span>
                        <i class="bi bi-circle-fill ${getColorByStatus_match(match.statut)}"></i>
                        N°${match.idMatch} | ${match.category} - ${match.round} | ${match.joueur1} - ${match.joueur2}
                    </span>
                    ${match.statut === "completed" ? `<span class="px-2"><i class="bi bi-trophy-fill"></i> ${match.winner}</span>`:``}
                </div>

                ${match.statut === "in_progress"  || match.statut === "completed" ? ` 
                <table>
                    <tr>
                        <th></th>
                        <th>Set 1</th>
                        <th>Set 2</th>
                        <th>Set 3</th>
                    </tr>
                    <tr>
                        <td>${match.winner === match.joueur1 ? `<i class="bi bi-trophy-fill"></i> ` : ""}${match.joueur1}</td>
                        <td>${match.set1Joueur1 ? match.set1Joueur1 : ''}</td>
                        <td>${match.set2Joueur1 ? match.set2Joueur1 : ''}</td>
                        <td>${match.set3Joueur1 ? match.set3Joueur1 : ''}</td>
                    </tr>
                    <tr>
                        <td>${match.winner === match.joueur2 ? `<i class="bi bi-trophy-fill"></i> ` : ""}${match.joueur2}</td>
                        <td>${match.set1Joueur2 ? match.set1Joueur2 : ''}</td>
                        <td>${match.set2Joueur2 ? match.set2Joueur2 : ''}</td>
                        <td>${match.set3Joueur2 ? match.set3Joueur2 : ''}</td>
                    </tr>
                </table>
                `: ""}
            </div>

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
