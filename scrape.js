const puppeteer = require('puppeteer');
const fs = require('fs');

const EVENTS = [{
    url: 'https://www.vlr.gg/event/stats/2467/challengers-2025-north-america-ace-stage-3',
    region: 'americas',
    penalty: 1.0
  },
  {
    url: 'https://www.vlr.gg/event/stats/2457/challengers-2025-latam-north-ace-stage-2?exclude=31234.31235.31236.31237&min_rounds=0&agent=all',
    region: 'americas',
    penalty: 1.0
  },
  {
    url: 'https://www.vlr.gg/event/stats/2456/challengers-2025-latam-south-ace-stage-2?exclude=31230.31231.31232.31233&min_rounds=0&agent=all',
    region: 'americas',
    penalty: 1.0
  },
  {
    url: 'https://www.vlr.gg/event/stats/2497/challengers-2025-oceania-split-2?exclude=31924.31925.31926.31927.31928.31929&min_rounds=0&agent=all',
    region: 'apac',
    penalty: .90
  },
  {
    url: 'https://www.vlr.gg/event/stats/2468/challengers-2025-mena-resilience-north-africa-and-levant-split-2?exclude=&min_rounds=0&agent=all',
    region: 'emea',
    penalty: .90
  },
  {
    url: 'https://www.vlr.gg/event/stats/2470/challengers-2025-mena-resilience-gcc-pakistan-iraq-split-2?exclude=&min_rounds=0&agent=all',
    region: 'emea',
    penalty: .95
  },
  {
    url: 'https://www.vlr.gg/event/stats/2522/blooming-talents-league-2025-stage-3?exclude=&min_rounds=0&agent=all',
    region: 'emea',
    penalty: 1.0
  },
  {
    url: 'https://www.vlr.gg/event/stats/2311/challengers-2025-japan-split-3?exclude=&min_rounds=0&agent=all',
    region: 'apac',
    penalty: 1.0
  },
  {
    url: 'https://www.vlr.gg/event/stats/2454/challengers-2025-brazil-gamers-club-split-2?exclude=&min_rounds=0&agent=all',
    region: 'americas',
    penalty: 1.0
  },
  {
    url: 'https://www.vlr.gg/event/stats/2542/challengers-2025-france-revolution-split-3',
    region: 'emea',
    penalty: 1.0
  },
  {
    url: 'https://www.vlr.gg/event/stats/2524/challengers-2025-t-rkiye-birlik-split-3',
    region: 'emea',
    penalty: 1.0
  },
  {
    url: 'https://www.vlr.gg/event/stats/2523/challengers-2025-dach-evolution-split-3?exclude=&min_rounds=0&agent=all',
    region: 'emea',
    penalty: 1.0
  },
  {
    url: 'https://www.vlr.gg/event/stats/2540/challengers-2025-north-east-samsung-odyssey-split-3?exclude=32250.32251.32252.32253.32255.32256.32257.32258.32259.32260.32261.32336.32239.32240.32241.32242.32243.32244.32245.32246.32247.32248.32249&min_rounds=0&agent=all',
    region: 'emea',
    penalty: 1.0
  },
  {
    url: 'https://www.vlr.gg/event/stats/2547/challengers-2025-korea-wdg-stage-3',
    region: 'apac',
    penalty: .95
  },
  {
    url: 'https://www.vlr.gg/event/stats/2559/challengers-2025-southeast-asia-split-3',
    region: 'apac',
    penalty: .90
  },
  {
    url: 'https://www.vlr.gg/event/stats/2480/challengers-2025-spain-rising-split-3',
    region: 'emea',
    penalty: .90
  },
  {
    url: 'https://www.vlr.gg/event/stats/2381/game-changers-2025-north-america-stage-1?exclude=30450.30451.30452.30453.30418.30419.30420.30421.30422.30423.30424.30425.30426.30427.30428.30429.30430.30431.30432.30433.30434.30435.30436.30437.30438.30439.30440.30441.30442.30443.30444.30445.30446.30447.30448.30449.29907.29908.29909.29910.29872.29873.29874.29875.29876.29877.29878.29879.29880.29881.29882.29883.29884.29885.29886.29887.29888.29889.29890.29891.29892.29893.29894.29895.29896.29897.29898.29899.29900.29901.29902.29903&min_rounds=0&agent=all',
    region: 'americas',
    penalty: .85
  },
  {
    url: 'https://www.vlr.gg/event/stats/2481/game-changers-2025-emea-stage-2?exclude=&min_rounds=0&agent=all',
    region: 'emea',
    penalty: .85
  }
];

const TEST_MODE = false;
const TEST_LIMIT = 10;
let CURRENT_PENALTY = 1.0;

(async () => {
  const browser = await puppeteer.launch({
    headless: "new"
  });
  const page = await browser.newPage();

  const playerStatsMap = new Map();
  const profileCache = new Map();

  function scaled(val, min, max) {
    if (val <= min) return 40;
    if (val >= max) return 75;
    const norm = (val - min) / (max - min);
    const skew = 0.5 + 0.5 * Math.tanh((norm - 0.5) * 3);
    return Math.round(40 + skew * 40);
  }

  // 1) Scrape each event and accumulate stats
  for (const {
      url,
      region,
      penalty
    }
    of EVENTS) {
    await page.goto(url, {
      waitUntil: 'domcontentloaded'
    });

    const stageStats = await page.evaluate(() => {
      const rows = document.querySelectorAll('table.wf-table.mod-stats.mod-scroll tbody tr');
      const players = [];
      const seen = new Set();

      for (const row of rows) {
        const cols = row.querySelectorAll('td');
        if (!cols.length) continue;

        const rounds = parseInt(cols[2]?.innerText || "0", 10);
        if (rounds < 50) continue;

        const anchor = row.querySelector('a[href^="/player/"]');
        const profilePath = anchor?.getAttribute('href') || "";
        const name = anchor?.querySelector('.text-of')?.innerText.trim() || "Unknown";
        if (seen.has(profilePath)) continue;
        seen.add(profilePath);

        const rating = parseFloat(cols[3]?.innerText) || 1.0;
        const acs = parseFloat(cols[4]?.innerText) || 200;
        const adr = parseFloat(cols[7]?.innerText) || 120;
        const apr = parseFloat(cols[9]?.innerText) || 0.1;
        const fkpr = parseFloat(cols[10]?.innerText) || 0.1;
        const fdpr = parseFloat(cols[11]?.innerText) || 0.1;
        const hsPercent = parseFloat(cols[12]?.innerText.replace('%', '')) || 0;
        const [succ, att] = (cols[13]?.innerText || '0/1').split('/');
        const clutchSuccess = parseInt(succ, 10) || 0;
        const clutchAttempts = parseInt(att, 10) || 1;

        players.push({
          name,
          profilePath,
          rating,
          acs,
          adr,
          hsPercent,
          clutchSuccess,
          clutchAttempts,
          totalFK: fkpr * rounds,
          totalFD: fdpr * rounds,
          totalAssists: apr * rounds,
          totalRounds: rounds
        });
      }

      return players;
    });

    // Accumulate into the map, tagging each entry with the event's region
    for (const p of stageStats) {
      if (!playerStatsMap.has(p.profilePath)) {
        playerStatsMap.set(p.profilePath, {
          name: p.name,
          region: region,
          rating: 0,
          acs: 0,
          adr: 0,
          hsPercent: 0,
          clutchSuccess: 0,
          clutchAttempts: 0,
          totalFK: 0,
          totalFD: 0,
          totalAssists: 0,
          totalRounds: 0,
          count: 0
        });
      }
      const e = playerStatsMap.get(p.profilePath);
      e.rating += p.rating;
      e.acs += p.acs;
      e.adr += p.adr;
      e.hsPercent += p.hsPercent;
      e.clutchSuccess += p.clutchSuccess;
      e.clutchAttempts += p.clutchAttempts;
      e.totalFK += p.totalFK;
      e.totalFD += p.totalFD;
      e.totalAssists += p.totalAssists;
      e.totalRounds += p.totalRounds;
      e.count += 1;
    }
    CURRENT_PENALTY = penalty;
  }

  // 2) Build enriched player objects
  const enriched = [];
  let idCounter = 1467;

  for (const [profilePath, stats] of playerStatsMap.entries()) {
    if (TEST_MODE && enriched.length >= TEST_LIMIT) break;

    const avgRating = stats.rating / stats.count;
    const avgAcs = stats.acs / stats.count;
    const avgAdr = stats.adr / stats.count;
    const avgHsPct = stats.hsPercent / stats.count;
    const fkpr = stats.totalFK / (stats.totalRounds || 1);
    const apr = stats.totalAssists / (stats.totalRounds || 1);
    const clutchRatio = stats.clutchSuccess / (stats.clutchAttempts || 1);

    const clutchComposite =
      clutchRatio * 0.5 +
      (avgHsPct / 100) * 0.3 +
      (avgRating / 2) * 0.2;

    const aggressionRatio =
      (fkpr / ((stats.totalFD / (stats.totalRounds || 1)) || 1)) * 0.5 +
      (avgAdr / 170) * 0.25 +
      (avgAcs / 280) * 0.25;

    const supportFactor = apr;
    const hsComposite = (avgHsPct / 100) * 0.55 + (avgRating / 1.3) * 0.3 + fkpr * 0.15;
    const penalty = CURRENT_PENALTY || 1.0;

    // Fetch country flag & avatar once per player
    let flag, image;
    if (profileCache.has(profilePath)) {
      ({
        flag,
        image
      } = profileCache.get(profilePath));
    } else {
      const fullUrl = `https://www.vlr.gg${profilePath}`;
      await page.goto(fullUrl, {
        waitUntil: 'domcontentloaded'
      });
      await new Promise(res => setTimeout(res, 500));
      const res = await page.evaluate(() => {
        const div = Array.from(document.querySelectorAll('.ge-text-light'))
          .find(d => d.querySelector('i.flag'));
        const country = div?.innerText.trim() || 'United';
        const norm = country
          .split(/\s+/)
          .map(w => w[0] + w.slice(1).toLowerCase())
          .join('_');
        const src = document
          .querySelector('.wf-avatar.mod-player img')
          ?.src || '';
        return {
          flag: norm,
          image: src.includes('sil.png') ? null : src
        };
      });
      flag = res.flag;
      image = res.image;
      profileCache.set(profilePath, res);
    }

    const player = {
      id: idCounter++,
      teamId: 0,
      age: Math.floor(Math.random() * 5) + 18, // Random age between 18-22
      name: stats.name,
      country: flag,
      region: stats.region,
      position: 'flex',
      image: image || 'https://images.vexels.com/media/users/3/258727/isolated/preview/52384117691bc668437dd96d33da85bf-hard-boiled-egg-food.png',
      playablePositions: ['sentinel', 'duelist', 'controller', 'initiator', 'flex'],
      potential: scaled(avgRating * penalty, 0.8, 1.35),
      developmentSpeed: 4,
      aim: scaled(avgAcs * penalty, 150, 280),
      clutch: scaled(clutchComposite * penalty, 0.1, 0.5) - Math.floor(Math.random() * 10) + 1,
      hs: scaled(hsComposite * penalty, 0.2, 0.6),
      movement: scaled(avgAdr * penalty, 90, 170),
      support: scaled(supportFactor * penalty, 0.05, 0.35),
      aggression: scaled(aggressionRatio * penalty, 0.5, 2.0),
      roles: [],
      inTeamLineup: false,
      isActive: 1,
      contracts: [],
      pastRatings: [{
        season: 0,
        aim: scaled(avgAcs * 0.8 * penalty, 150, 280),
        clutch: scaled(clutchComposite * 0.9 * penalty, 0.1, 0.5),
        hs: scaled(hsComposite * 0.95 * penalty, 0.2, 0.6),
        movement: scaled(avgAdr * 0.9 * penalty, 90, 170),
        support: scaled(supportFactor * 0.7 * penalty, 0.05, 0.35),
        aggression: scaled(aggressionRatio * 0.9 * penalty, 0.5, 2.0)
      }],
      contractDemands: {
        salary: 60,
        seasons: 2
      }
    };

    // enforce a sane support cap
    // if (player.support > 70) player.support = 60;

    enriched.push(player);
  }

  await browser.close();
  fs.writeFileSync('event_players.json', JSON.stringify(enriched, null, 2));
  console.log('✅ Finished: Saved enriched players to event_players.json');
})();
