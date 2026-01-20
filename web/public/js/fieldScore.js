const currentNamespace = window.location.pathname;

// Se connecte au bon namespace automatiquement
const socket = io(currentNamespace);

socket.on("update", (datas) => {
	if (datas) {
		if (document.getElementById("tableau").classList.contains("hidden")) {
			document.getElementById("tableau").classList.remove("animationOff");
			document.getElementById("tableau").classList.remove("hidden");
		}

		document.getElementById("matchInfos").innerHTML = `${datas.round} - ${datas.category} | ${datas.duration ? datas.duration : "00:00"}`

		document.getElementById("p1").innerHTML = `${datas.server1 == '1' ? "𒊹 " : ""}${datas.joueur1.replaceAll('/', "<br>")}`;
		document.getElementById("p1-s1").innerHTML = datas.player1Set1;
		document.getElementById("p1-s2").innerHTML = datas.player1Set2;
		document.getElementById("p1-s3").innerHTML = datas.player1Set3;

		document.getElementById("p2").innerHTML = `${datas.server2 == '1' ? "𒊹 " : ""}${datas.joueur2.replaceAll('/', "<br>")}`;
		document.getElementById("p2-s1").innerHTML = datas.player2Set1;
		document.getElementById("p2-s2").innerHTML = datas.player2Set2;
		document.getElementById("p2-s3").innerHTML = datas.player2Set3;

		if (datas.winner) {

			setTimeout(() => {
				document.getElementById("tableau").classList.toggle("animationOff");
				setTimeout(() => {
					document.getElementById("tableau").classList.toggle("hidden");
				}, 5000)
			}, 20000);
		}
	}
});