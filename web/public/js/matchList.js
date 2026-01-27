const tournamentId = window.location.pathname.split('/')[2];

const socket = io(`/tournament/${tournamentId}/matchList`);


const FIELD_ICON = {
    1: "bi bi-1-circle",
    2: "bi bi-2-circle",
    3: "bi bi-3-circle",
    4: "bi bi-4-circle",
    5: "bi bi-5-circle",
    6: "bi bi-6-circle",
    7: "bi bi-7-circle",
    8: "bi bi-8-circle",
    9: "bi bi-9-circle",
}

const STATUS_COLOR = {
    "not_played": "text-danger",
    "in_progress": "text-warning",
    "completed": "text-success",
};


let tournamentInfos = {};
let tournamentMatchs = [];

socket.once('load', (datas) => {
    tournamentInfos = {
        ...datas.tournamentInfos
    };
    tournamentMatchs = datas.matchs;

    renderMatchList();
});

socket.on('updateMatch', (updatedMatch) => {
    const matchIndex = tournamentMatchs.findIndex(m => m.idMatch == updatedMatch.idMatch);

    if (matchIndex !== -1) {
        tournamentMatchs[matchIndex] = {
            ...tournamentMatchs[matchIndex],
            ...updatedMatch
        };
    } else {
        tournamentMatchs.push(updatedMatch);
    }

    renderMatchList();
})



function renderMatchList() {
    const matchListContainer = document.getElementById('matchListContainer');
    matchListContainer.innerHTML = '';


    for (let i = 0; i < tournamentMatchs.length; i++) {

        const match = tournamentMatchs[i];

        const icon = match.statut == "in_progress" ? FIELD_ICON[match.field] || "bi bi-circle-fill": "bi bi-circle-fill";

        matchListContainer.innerHTML += `
            <div class="matchEntrie">
                <div class="d-flex justify-content-between" id="match-${match.idMatch}">
                    <span>
                        <i class="${icon} ${STATUS_COLOR[match.statut]}"></i>
                        N°${match.idMatch} | ${match.category} - ${match.round} | ${match.joueur1} - ${match.joueur2}
                    </span>
                    ${match.statut === "completed" ? `<span><i class="bi bi-trophy-fill"></i> ${match.winner}</span>` : ``}
                </div>
            </div>
        `;
    }

};