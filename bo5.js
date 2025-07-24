(async () => {
  if (!indexedDB.databases) {
    alert("Your browser does not support indexedDB.databases()");
    return;
  }

  const allDbs = await indexedDB.databases();
  const valSimDbs = allDbs.filter(db => db.name?.startsWith("ValSim-"));

  if (valSimDbs.length === 0) {
    alert("No ValSim- databases found.");
    return;
  }

  console.log("🧠 Found ValSim databases:");
  valSimDbs.forEach((db, idx) => {
    console.log(`${idx + 1}. ${db.name}`);
  });

  const input = prompt(`Enter the numbers of the databases you want to edit (e.g., 1,3,4):`);
  if (!input) return;

  const selectedIndices = input
    .split(",")
    .map(str => parseInt(str.trim(), 10) - 1)
    .filter(i => i >= 0 && i < valSimDbs.length);

  for (const i of selectedIndices) {
    const DB_NAME = valSimDbs[i].name;
    const TOURNAMENT_STORE = "tournaments";

    console.log(`🛠 Editing DB: ${DB_NAME}`);

    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME);
      request.onerror = reject;
      request.onsuccess = () => resolve(request.result);
    });

    const tx = db.transaction(TOURNAMENT_STORE, "readwrite");
    const store = tx.objectStore(TOURNAMENT_STORE);

    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      const tournaments = getAllRequest.result;

      tournaments.forEach(tournament => {
        const matches = (tournament.tournamentData?.match || []).slice(-2);
        let matchGames = tournament.tournamentData?.match_game || [];
        matches.forEach(match => {
          match.matchType = "Bo5";
          match.child_count = 5;

          matchGames = matchGames.filter(
            g => !(g.parent_id === match.id && g.stage_id === match.stage_id)
          );

          for (let i = 1; i <= 5; i++) {
            matchGames.push({
              number: i,
              stage_id: match.stage_id,
              parent_id: match.id,
              opponent1: {},
              opponent2: {}
            });
          }
        });

        tournament.tournamentData.match_game = matchGames;

        store.put(tournament);
      });

      console.log(`✅ ${DB_NAME} updated`);
    };

    await new Promise(resolve => (tx.oncomplete = resolve));
  }

  console.log("🎉 All selected databases updated.");
  alert("✅ Done! Reloading the page to see changes.");
  location.reload();
})();
