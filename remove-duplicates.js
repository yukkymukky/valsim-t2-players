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

  console.log("🧹 Checking for duplicates to delete (lower stat avg)...");

  for (const dbInfo of valSimDbs) {
    const dbName = dbInfo.name;
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });

    const tx = db.transaction("players", "readwrite");
    const store = tx.objectStore("players");

    const comboMap = new Map();
    const request = store.openCursor();

    await new Promise((resolve, reject) => {
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          const player = cursor.value;
          const key = `${player.name.toLowerCase()}|${player.country?.toLowerCase()}`;
          if (!comboMap.has(key)) comboMap.set(key, []);
          comboMap.get(key).push(player);
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });

    const toDelete = [];

    for (const [key, group] of comboMap.entries()) {
      if (group.length <= 1) continue;

      const avgStat = (p) => {
        const keys = ["aim", "clutch", "hs", "movement", "support", "aggression"];
        const sum = keys.reduce((acc, k) => acc + (p[k] ?? 0), 0);
        return sum / keys.length;
      };

      const sorted = group.slice().sort((a, b) => avgStat(b) - avgStat(a));
      const [best, ...rest] = sorted;
      rest.forEach(p => toDelete.push(p.id));
    }

    await Promise.all(toDelete.map(id => {
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }));

    if (toDelete.length === 0) {
      console.log(`✅ ${dbName}: No duplicates found.`);
    } else {
      console.warn(`🗑️ ${dbName}: Deleted ${toDelete.length} duplicate(s):`);
      toDelete.forEach(id => console.log(`- Deleted player with ID ${id}`));
    }

    await new Promise(resolve => (tx.oncomplete = resolve));
  }

  alert("✅ Duplicate cleanup done! See console for results.");
})();
