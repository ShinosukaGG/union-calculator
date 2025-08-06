// === CONFIG ===
const SUPABASE_URL = "https://bvvvlqbtwqetltdcvioie.supabase.co/rest/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmxqYnR3cWVo0bHRkY3Zpb2llLCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg2MjA1OTg3LCJleHAiOjIwMzk4ODE1ODd9.4ccII6MjA20TU5OTgzM30.d-leDFpzc6uxDvq47_FCOFqh0ztaL11oozm-z6T9N_M";

// Table names
const TESTER_TABLE = "leaderboard_full_0208";
const YAPPER0_TABLE = "yaps_season_zero";
const YAPPER1_TABLE = "yaps_season_one";

// --- Allocation Constants for Testers (from your script!) ---
const testerLevelData = {
  10: { minXP: 1155, maxXP: 1500, users: 100, pool: 3750000 },
  9:  { minXP: 955,  maxXP: 1154, users: 390, pool: 3750000 },
  8:  { minXP: 805,  maxXP: 954,  users: 3090, pool: 3750000 },
  7:  { minXP: 650,  maxXP: 804,  users: 4250, pool: 3750000 },
  6:  { minXP: 500,  maxXP: 649,  users: 4510, pool: 3750000 },
  5:  { minXP: 400,  maxXP: 499,  users: 4544, pool: 3750000 },
  4:  { minXP: 300,  maxXP: 399,  users: 2720, pool: 4500000 },
};
const testerMultipliers = {
  ideal: [0.095, 0.075],
  bull:  [0.12, 0.11],
  superbull: [0.12, 0.17],
  gigabull: [0.17, 0.2]
};

// --- Allocation Constants for Yappers (from your script!) ---
const YAPPER0_POOL = 45000000;
const YAPPER1_POOL = 13500000;

// Multipliers for Yappers (same as above)
const yapperMultipliers = {
  ideal: [0.095, 0.075],
  bull:  [0.12, 0.11],
  superbull: [0.12, 0.17],
  gigabull: [0.17, 0.2]
};

// === HELPERS ===
function $(id) { return document.getElementById(id); }
function formatNum(n) {
  n = Number(n) || 0;
  if (n >= 1e6) return (n/1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n/1e3).toFixed(1) + "K";
  return n.toLocaleString();
}
function percent(val) {
  val = Number(val);
  return isNaN(val) ? "0%" : (val.toFixed(2) + "%");
}

// === DATA FETCHING ===
async function fetchUser(table, username) {
  const headers = {
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };
  const queries = [
    `display_name=ilike.${username}`,
    `username=ilike.${username}`,
    `display_name=ilike.%25${username}%25`,
    `username=ilike.%25${username}%25`
  ];
  for (const q of queries) {
    const url = `${SUPABASE_URL}/${table}?${q}`;
    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length) return data[0];
      }
    } catch (e) {}
  }
  return null;
}

// === ALLOCATION CALCULATIONS ===
function calcTesterAlloc(user) {
  if (!user) return { allocation: 0, multipliers: {} };
  let level = Number(user.level || user.Level || 0);
  let xp = Number(user.xp || user.XP || 0);

  if (level < 4 || !testerLevelData[level]) return { allocation: 0, multipliers: {} };

  const d = testerLevelData[level];
  let allocation = 0;

  if (level === 10) {
    allocation = 3750000;
  } else {
    const meanToken = d.pool / d.users;
    const xpScore = (xp - d.minXP) / (d.maxXP - d.minXP);
    allocation = Math.round(meanToken * (1 + xpScore));
  }

  // Apply multipliers (for demo, shows all cases)
  let multipliers = {};
  for (let key in testerMultipliers) {
    const m = testerMultipliers[key];
    multipliers[key] = [
      Math.round(allocation * m[0]),
      Math.round(allocation * m[1])
    ];
  }
  return { allocation, multipliers };
}

function calcYapperAlloc(user, pool = YAPPER0_POOL) {
  if (!user || user.mindshare == null) return { allocation: 0, multipliers: {} };
  let mindshare = parseFloat((user.mindshare + "").replace("%", "").trim()) || 0;
  let allocation = Math.round((mindshare / 100) * pool);

  // Apply multipliers (for demo, shows all cases)
  let multipliers = {};
  for (let key in yapperMultipliers) {
    const m = yapperMultipliers[key];
    multipliers[key] = [
      Math.round(allocation * m[0]),
      Math.round(allocation * m[1])
    ];
  }
  return { allocation, multipliers, mindshare };
}

// === MAIN HANDLER ===
$("search-form").onsubmit = async function(e) {
  e.preventDefault();
  const username = $("username-input").value.trim().replace(/^@/, "");
  if (!username) return;

  $("loading").style.display = "block";
  $("result-section").style.display = "none";

  // Fetch all 3
  const [tester, yapper0, yapper1] = await Promise.all([
    fetchUser(TESTER_TABLE, username),
    fetchUser(YAPPER0_TABLE, username),
    fetchUser(YAPPER1_TABLE, username)
  ]);

  // Calculate allocations
  const testerData = calcTesterAlloc(tester);
  const yapper0Data = calcYapperAlloc(yapper0, YAPPER0_POOL);
  const yapper1Data = calcYapperAlloc(yapper1, YAPPER1_POOL);

  // Total allocation
  const totalAlloc = testerData.allocation + yapper0Data.allocation + yapper1Data.allocation;
  $("total-alloc").innerText = formatNum(totalAlloc) + " $U";

  // Tester table
  $("tester-alloc").innerText = formatNum(testerData.allocation) + " $U";
  $("tester-info").innerText = tester
    ? `Level: ${tester.level}, XP: ${tester.xp}`
    : "Not found";
  $("tester-mults").innerHTML = Object.entries(testerData.multipliers).map(([k, v]) =>
    `<tr><td>${k}</td><td>${formatNum(v[0])} – ${formatNum(v[1])} $U</td></tr>`
  ).join("");

  // Yapper Season 0
  $("yapper0-alloc").innerText = formatNum(yapper0Data.allocation) + " $U";
  $("yapper0-info").innerText = yapper0
    ? `Mindshare: ${percent(yapper0.mindshare)}`
    : "Not found";
  $("yapper0-mults").innerHTML = Object.entries(yapper0Data.multipliers).map(([k, v]) =>
    `<tr><td>${k}</td><td>${formatNum(v[0])} – ${formatNum(v[1])} $U</td></tr>`
  ).join("");

  // Yapper Season 1
  $("yapper1-alloc").innerText = formatNum(yapper1Data.allocation) + " $U";
  $("yapper1-info").innerText = yapper1
    ? `Mindshare: ${percent(yapper1.mindshare)}`
    : "Not found";
  $("yapper1-mults").innerHTML = Object.entries(yapper1Data.multipliers).map(([k, v]) =>
    `<tr><td>${k}</td><td>${formatNum(v[0])} – ${formatNum(v[1])} $U</td></tr>`
  ).join("");

  // Set username and pfp ONCE at top
  $("user-username").innerText = "@" + (
    tester?.username || yapper0?.username || yapper1?.username || username
  );
  $("user-pfp").src = tester?.pfp || yapper0?.pfp || yapper1?.pfp || `https://unavatar.io/twitter/${username}`;

  $("loading").style.display = "none";
  $("result-section").style.display = "block";
};
