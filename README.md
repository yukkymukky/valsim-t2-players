# ValSim IndexedDB Tools

This repository contains a set of utility scripts for modifying ValSim databases used in browser.

These tools allow you to:
- Inject T2 player data directly from GitHub
- Clean up duplicate players based on stats
- Convert playoff lower finasl t best-of-five (Bo5) format---

## 🧠 Table of Contents

- [Overview](#overview)
- [Scripts](#scripts)
  - [inject.js](#injectjs)
  - [remove-duplicates.js](#remove-duplicatesjs)
  - [bo5.js](#bo5js)
- [How to Run](#how-to-run)
- [Requirements](#requirements)
- [Webscraping](#webscraping)

## 🗂 Overview

All scripts are intended to be run in the browser console of a site that stores simulation data in **IndexedDB** databases with names starting with `ValSim-`.

These scripts **do not require any bundling or installation**—just copy, paste, and run them in the developer console.


## 📜 Scripts

### `inject.js`
Fetches the list of players in the `json` included in this repo and inserts them into the IndexedDB. 

T2 Players are included from the MAIN STAGE (no quals/relegation/promotion) of the following leagues:
1. NA Stage 3
2. LATAM North Stage 2
3. LATAM South Stage 2
4. Oceania Split 2
5. MENA Resilience North Africa and Levant Split 2
6. Mena Resilience GCC Pakistan Iraq Split 2
7. Blooming Talents League Stage 3
8. Japan Split 3
9. Brazil Gamers Club Split 2
10. France Revolution Split 3
11. Türkiye Birlik Split 3
12. Dach Evolution Split 3
13. North East Samsung Odyssey SPlit 3
14. Korea WDG Stage 3
15. Southeast Asia Split 3
16. Spain Risnig PSlit 3
17. NA GC Stage 1
18. EMEA GC Stage 2

- Source: [event_players.json](https://github.com/yukkymukky/valsim-t2-players/blob/main/event_players.json)

**WARNING**: THIS WILL CREATE DUPLICATE PLAYERS. YOU CAN GET RID OF DUPLICATE PLAYERS BY RUNNING THE `remove-duplicate.js` script.


### `remove-duplicates.js`
Scans each database for duplicate players based on **name + country**, and removes all but the highest-statted version (based on average of key stats).

- Stats considered: `aim`, `clutch`, `hs`, `movement`, `support`, `aggression`


### `bo5.js`
Updates the lower final matches in each selected tournament to be best-of-five (Bo5) format.

**NOTE**: YOU MUST SIM/PLAY ATLEAST **ONE** PLAYOFF MATCH BEFORE YOU INJECT THIS SCRIPT.

## ▶️ How to Run

### 1. Open Your Browser DevTools
- Navigate to the site using `ValSim-*` IndexedDB databases
- Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Opt+I` (Mac) to open Developer Tools
- Go to the **Console** tab

### 2. Paste and Run One of the Scripts

#### To inject players:
1. Open `inject.js` in this repo
2. Copy the entire script
3. Paste it in the browser console and press **Enter**
4. Follow the prompt to select target databases

#### To remove duplicates:
1. Open `remove-duplicates.js`
2. Copy the script into the console and press **Enter**
3. The script will clean all `ValSim-*` DBs automatically

#### To convert matches to Bo5:
1. Open `bo5.js`
2. Copy, paste into the console, and press **Enter**
3. Select databases to update via prompt

## Webscraping

`scrape.js` is the file I used to scrape the data for T2 players. You add/remove any league you want and scrape it on your own. 

Just install puppeteer, and you'll be good to go.

Limitations:
1. Inaccurate stat calculations
2. Unable to get player's real age
3. Will file players as flag International if thats their flag set on VLR, which kind of breaks them on ValSim since that isn't a real flag

## 🧼 Notes

- These scripts are **destructive**: data may be overwritten or deleted.
- Always back up your IndexedDB if needed (you can use the Application tab in DevTools).
