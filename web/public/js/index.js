const socket = io("/index");


socket.on("load", (data) => {

    if (data.tournaments?.length > 0) {
        loadTournaments(data.tournaments, data.tournamentLive);
    }

});


/**
 * Charge les tournois dans l'interface.
 * @param {Array} tournaments 
 */
function loadTournaments(tournaments, tournamentLive) {
    let container = document.getElementById("tournamentList");

    // Supprime les tournois déjà affichés
    container.innerHTML = "";
   
    let container2Tournaments;

    for (let i = 0; i < tournaments.length; i++) {

        // Création d'une nouvelle ligne tous les 2 tournois
        if (i % 2 == 0) {
            if (container2Tournaments) {
                container.appendChild(container2Tournaments)
            };

            container2Tournaments = document.createElement("div");
            container2Tournaments.classList.add("row", "justify-content-around", "my-4");
        }


        let tournament = tournaments[i];

        // Lien de redirection
        let linkElt = document.createElement("a");
        linkElt.href = `/tournament/${tournament.idTournoi}`;
        linkElt.classList.add("text-decoration-none", "col-5", "text-white");
        
        // Bloc d'infos du tournoi
        let tournamentElt = document.createElement("article");
        tournamentElt.classList.add(`p-3`);

        let isTournamentLive = tournamentLive && tournament.idTournoi == tournamentLive;
        console.log(tournamentLive)
     
        tournamentElt.innerHTML = `
            <div class="d-flex justify-content-between">
                <h4>${tournament.nomTournoi}</h4>
                <div class="d-flex justify-content-around">
                    ${isTournamentLive ? `<p class="badge bg-danger mx-3"><i class="bi bi-wifi"></i> LIVE</p>` : ''}
                    <i class="bi bi-circle-fill ${getColorByStatus(tournament.status)}"></i>
                    <p class="mx-2 ${getColorByStatus(tournament.status)}">${tournament.status}</p>
                </div>
            </div>

            <p class="col-12">Date : ${tournament.dateTournoi}</p>
        `

        // Ajout du tournoi au lien et du lien au container
        linkElt.appendChild(tournamentElt);
        container2Tournaments.appendChild(linkElt);
    }

    // Ajout du dernier container pour les 2 derniers qui ne sont pas ajoutés automatiquement
    container.appendChild(container2Tournaments);
}

/**
 * Récupère la couleur associée au statut du tournoi.
 * @param {string} status 
 * @returns {string}
 */
function getColorByStatus(status) {
    switch (status) {
        case "Upcoming":
            return "text-warning";
        case "Ongoing":
            return "text-success";
        case "Completed":
            return "text-danger";
        default:
            return "black";
    }
}




document.getElementById('ajoutForm').addEventListener('submit', function (event) {
    event.preventDefault(); // empêche l'envoi classique

    if (!document.getElementById('nom').value || !document.getElementById('date').value || !document.getElementById('nombreTerrains').value) {
        afficherErreurFormulaire("Veuillez remplir tous les champs.");
        return;
    }

    const data = {
      nom: document.getElementById('nom').value,
      date: document.getElementById('date').value,
      terrains: document.getElementById('nombreTerrains').value,
    };

    document.getElementById('nom').value = '';
    document.getElementById('date').value = '';
    document.getElementById('nombreTerrains').value = '';

    masquerErreur();

    socket.emit('createTournament', data);

    const modal = bootstrap.Modal.getInstance(document.getElementById('ajoutModal'));
    modal.hide();
});


/**
 * Affiche une erreur dans le formulaire d'ajout de tournoi.
 * @param {string} message 
 */
function afficherErreurFormulaire(message) {
  const errorDiv = document.getElementById('formError');
  errorDiv.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> ${message}`;
  errorDiv.classList.remove('d-none');
}

/**
 * Masque l'erreur dans le formulaire d'ajout de tournoi.
 */
function masquerErreur() {
  const errorDiv = document.getElementById('formError');
  errorDiv.classList.add('d-none');
}