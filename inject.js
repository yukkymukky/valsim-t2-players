(async () => {
  // 0. Fetch players data from GitHub
  const res = await fetch("https://raw.githubusercontent.com/yukkymukky/valsim-t2-players/refs/heads/main/event_players.json");
  if (!res.ok) {
    alert("Failed to fetch players data.");
    return;
  }
  const players = await res.json();

  // 1. Find ValSim-* DBs
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
  valSimDbs.forEach((db, idx) =>
    console.log(`${idx + 1}. ${db.name}`)
  );

  // 2. Prompt which DBs to edit
  const input = prompt(
    `Enter the numbers of the databases you want to inject players into (e.g., 1,3,4):`
  );

  if (!input) return;

  const selectedIndices = input
    .split(",")
    .map(str => parseInt(str.trim(), 10) - 1)
    .filter(i => i >= 0 && i < valSimDbs.length);

  // 3. For each selected DB, open it and write players
  for (const i of selectedIndices) {
    const DB_NAME = valSimDbs[i].name;
    console.log(`🛠 Injecting into DB: ${DB_NAME}`);

    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });

    const tx = db.transaction("players", "readwrite");
    const store = tx.objectStore("players");

    players.forEach(player => store.put(player));

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    console.log(`✅ ${DB_NAME}: injected ${players.length} players`);
  }

  alert("✅ Players injected! Reloading to see changes.");
  location.reload();
})();
