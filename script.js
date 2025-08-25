// === CONFIG ===
const SUPABASE_APIKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmxxYnR3cWV0bHRkY3Zpb2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMjM4MzMsImV4cCI6MjA2OTU5OTgzM30.d-leDFpzc6uxDvq47_FC0Fqh0ztaL11Oozm-z6T9N_M';
const SUPABASE_URL = 'https://bvvlqbtwqetltdcvioie.supabase.co/rest/v1';

// ==== Brand Emojis for each case (replace with your own if needed) ====
const CASE_ICONS = [
  "https://em-content.zobj.net/source/apple/354/man-office-worker_1f468-200d-1f4bc.png", // Ideal
  "https://em-content.zobj.net/source/apple/354/man-office-worker_1f468-200d-1f4bc.png", // Bull
  "https://em-content.zobj.net/source/apple/354/man-office-worker_1f468-200d-1f4bc.png", // Super Bull
  "https://em-content.zobj.net/source/apple/354/man-office-worker_1f468-200d-1f4bc.png"  // Giga Bull
];

// ==== Allocation constants (levels, pools, XP, users) ====
const LEVELS = [
  { level: 10, label: "Top 100",   min: 1155, max: 20000, users: 100,   pool:  25_000_000 },
  { level: 9,  label: "Sr. Lt & Up", min: 955, max: 1154,  users: 440,   pool:  45_000_000 },
  { level: 8,  label: "Lieutenant",  min: 780, max: 954,   users: 3090,  pool:  85_000_000 },
  { level: 7,  label: "Junior Lt",   min: 630, max: 779,   users: 9570,  pool: 100_000_000 },
  { level: 6,  label: "Starshina",   min: 455, max: 629,   users: 45120, pool: 165_000_000 },
  { level: 5,  label: "Sr. Sgt",     min: 300, max: 454,   users: 23250, pool:  50_000_000 },
  { level: 4,  label: "Sgt",         min: 150, max: 299,   users: 27270, pool:  30_000_000 }
];

// ==== Yapper Pool Constants ====
const YAPPER_S0_POOL = 45_000_000; // 0.45% of 10B
const YAPPER_S1_POOL = 30_000_000; // 0.3% of 10B
const FDV_CASES = [
  { label: "Ideal Case", range: "$500M–$750M",    usd: [0.05, 0.075] },
  { label: "Bull Case",  range: "$750M–$1B",      usd: [0.075, 0.10] },
  { label: "Super Bull", range: "$1.2B–$1.7B",    usd: [0.12, 0.17] },
  { label: "Giga Bull",  range: "$1.7B–$2.5B",    usd: [0.17, 0.20] }
];

// ==== Display precision for mindshare ====
const MIND_MAX_DECIMALS = 8;

// ==== Confetti Setup ====
function launchConfetti(duration = 5000) {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = "block";
  const ctx = canvas.getContext("2d");
  const confetti = [];
  const colors = ["#A9ECFD", "#ffffff", "#86d6ee"];

  for (let i = 0; i < 160; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - 50,
      r: Math.random() * 7 + 5,
      d: Math.random() * 45 + 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 18 - 9,
      tiltAngleIncrement: Math.random() * 0.07 + 0.03,
      tiltAngle: 0
    });
  }

  let frame;
  function drawConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of confetti) {
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.d / 8);
      ctx.stroke();
    }
    updateConfetti();
    frame = requestAnimationFrame(drawConfetti);
  }

  function updateConfetti() {
    for (const p of confetti) {
      p.tiltAngle += p.tiltAngleIncrement;
      p.y += (Math.cos(p.d) + 3 + p.r / 3) * 0.75;
      p.x += Math.sin(0.02 * p.d);
      p.tilt = Math.sin(p.tiltAngle - (Math.PI / 2)) * 15;
      if (p.y > canvas.height) {
        p.x = Math.random() * canvas.width;
        p.y = -10;
      }
    }
  }

  drawConfetti();
  setTimeout(() => {
    cancelAnimationFrame(frame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = "none";
  }, duration);
}

// ==== Utilities ====
function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(0) + "K";
  return Number(num).toLocaleString();
}

function formatUsdRange(tokenAmount, [min, max]) {
  return `~$${Math.round(tokenAmount * min).toLocaleString()}–$${Math.round(tokenAmount * max).toLocaleString()}`;
}

// Show mindshare with many decimals, no forced rounding to 2dp
function formatMindshare(ms) {
  if (ms == null || ms === '') return '0';
  const n = Number(ms);
  if (Number.isNaN(n)) return String(ms);
  return n.toLocaleString(undefined, { maximumFractionDigits: MIND_MAX_DECIMALS });
}

// ==== Fetch: Leaderboard user (multi-strategy) ====
async function fetchUserData(username) {
  let user = null, url, response, users;
  // 1. display_name ilike (exact)
  url = `${SUPABASE_URL}/leaderboard_full_0208?display_name=ilike.${username}`;
  response = await fetch(url, { headers: { 'apikey': SUPABASE_APIKEY, 'Authorization': `Bearer ${SUPABASE_APIKEY}` } });
  if (response.ok) {
    users = await response.json();
    if (users && users.length > 0) {
      user = users.find(u => (u.display_name || '').toLowerCase() === username.toLowerCase()) || null;
    }
  }
  // 2. username ilike (exact)
  if (!user) {
    url = `${SUPABASE_URL}/leaderboard_full_0208?username=ilike.${username}`;
    response = await fetch(url, { headers: { 'apikey': SUPABASE_APIKEY, 'Authorization': `Bearer ${SUPABASE_APIKEY}` } });
    if (response.ok) {
      users = await response.json();
      if (users && users.length > 0) {
        user = users.find(u => (u.username || '').toLowerCase() === username.toLowerCase()) || null;
      }
    }
  }
  // 3. display_name ilike (partial)
  if (!user) {
    url = `${SUPABASE_URL}/leaderboard_full_0208?display_name=ilike.%${username}%`;
    response = await fetch(url, { headers: { 'apikey': SUPABASE_APIKEY, 'Authorization': `Bearer ${SUPABASE_APIKEY}` } });
    if (response.ok) {
      users = await response.json();
      if (users && users.length > 0) user = users[0];
    }
  }
  // 4. username ilike (partial)
  if (!user) {
    url = `${SUPABASE_URL}/leaderboard_full_0208?username=ilike.%${username}%`;
    response = await fetch(url, { headers: { 'apikey': SUPABASE_APIKEY, 'Authorization': `Bearer ${SUPABASE_APIKEY}` } });
    if (response.ok) {
      users = await response.json();
      if (users && users.length > 0) user = users[0];
    }
  }
  return user;
}

// ==== Fetch: Mindshare (S0: already percent; S1: fraction → ×100) ====
async function fetchMindshare(table, username) {
  let url = `${SUPABASE_URL}/${table}?username=eq.${encodeURIComponent(username)}`;
  let res = await fetch(url, { headers: { 'apikey': SUPABASE_APIKEY, 'Authorization': `Bearer ${SUPABASE_APIKEY}` } });
  let data = (res.ok) ? await res.json() : [];
  if (!data || data.length === 0) {
    url = `${SUPABASE_URL}/${table}?username=ilike.%25${encodeURIComponent(username)}%25`;
    res = await fetch(url, { headers: { 'apikey': SUPABASE_APIKEY, 'Authorization': `Bearer ${SUPABASE_APIKEY}` } });
    data = (res.ok) ? await res.json() : [];
  }
  if (data && data.length > 0) {
    let found = data.find(d => (d.username || '').toLowerCase() === username.toLowerCase());
    if (!found) found = data[0];

    let mindshareVal = null;
    if (found && found.jsonInput) {
      try {
        const json = typeof found.jsonInput === 'string' ? JSON.parse(found.jsonInput) : found.jsonInput;
        if (json.mindshare !== undefined && json.mindshare !== null) mindshareVal = json.mindshare;
      } catch (e) {}
    }
    // Top-level fallback
    if (mindshareVal == null && found.mindshare !== undefined && found.mindshare !== null) {
      mindshareVal = found.mindshare;
    }

    if (mindshareVal == null) return 0;

    // Normalize string
    if (typeof mindshareVal === 'string') mindshareVal = mindshareVal.replace('%', '').trim();
    const num = Number(String(mindshareVal).replace(',', '.'));
    if (Number.isNaN(num)) return 0;

    // IMPORTANT: S1 requires ×100 (stored as fraction), S0 is already percent
    if (table === 'yaps_season_1_public') {
      return num * 100; // keep full precision for display
    } else {
      return num;       // already percent, no ×100
    }
  }
  return 0;
}

// ==== TESTER ALLOCATION CALC ====
function calculateTesterAllocation(level, userXP) {
  if (Number(level) === 10) return 250_000; // Equal share per spec
  const lvl = LEVELS.find(l => l.level === Number(level));
  if (!lvl || !userXP || isNaN(userXP)) return 0;

  let XP_score = (userXP - lvl.min) / (lvl.max - lvl.min);
  XP_score = Math.max(0, Math.min(1, XP_score));

  // Linear scaling around avg: 0.5x at min → 1.5x at max
  const avg = lvl.pool / lvl.users;
  const userToken = ((XP_score * 1 + 0.5) * avg); // from 0.5*avg to 1.5*avg
  return Math.round(userToken);
}

// ==== YAPPER ALLOCATION (mindshare is percent value, e.g. 0.65 means 0.65%) ====
function calculateYapperAllocation(mindsharePercent, pool) {
  if (mindsharePercent == null || isNaN(Number(mindsharePercent))) return 0;
  return Math.round((Number(mindsharePercent) / 100) * pool);
}

// ==== MAIN ====
document.addEventListener('DOMContentLoaded', function () {
  // DOM
  const landingBox = document.getElementById('landing-box');
  const usernameForm = document.getElementById('username-form');
  const usernameInput = document.getElementById('username-input');
  const calcBtn = document.getElementById('calculate-btn');
  const resultSection = document.getElementById('result-section');
  const profilePfp = document.getElementById('profile-pfp');
  const profileUsername = document.getElementById('profile-username');
  const allocationAmount = document.getElementById('allocation-amount');
  const tweetBtn = document.getElementById('tweet-btn');
  const testerTable = document.getElementById('tester-table');
  const yapperS0Table = document.getElementById('yapper-s0-table');
  const yapperS1Table = document.getElementById('yapper-s1-table');

  // FORM
  usernameForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    let uname = usernameInput.value.trim().replace(/^@/, "");
    if (!uname) {
      usernameInput.classList.add('error');
      return;
    }
    calcBtn.disabled = true;
    calcBtn.innerText = "Calculating...";

    // Fetch user
    let user = await fetchUserData(uname);
    if (!user) {
      alert('User not found.');
      calcBtn.disabled = false;
      calcBtn.innerText = "Calculate Your Allocation";
      return;
    }

    const xusername = (user.username || user.display_name || uname);

    // PFP & meta
    let pfp = user.pfp;
    let xp = user.total_xp;
    let level = user.level;
    let title = user.title;
    if (user.jsonInput) {
      try {
        const json = typeof user.jsonInput === 'string' ? JSON.parse(user.jsonInput) : user.jsonInput;
        pfp = json.pfp || pfp;
        xp = json.total_xp || xp;
        level = json.level || level;
        title = json.title || title;
      } catch (e) {}
    }
    profilePfp.src = pfp || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";
    profileUsername.textContent = "@" + xusername;

    // Mindshare
    const mindshareS0 = await fetchMindshare('yaps_season_0_public', xusername); // already percent
    const mindshareS1 = await fetchMindshare('yaps_season_1_public', xusername);  // fraction → ×100 inside fetch

    // Allocations
    const testerAllocation = (level && xp) ? calculateTesterAllocation(Number(level), Number(xp)) : 0;
    const yapperAllocationS0 = calculateYapperAllocation(mindshareS0, YAPPER_S0_POOL);
    const yapperAllocationS1 = calculateYapperAllocation(mindshareS1, YAPPER_S1_POOL);
    const totalAllocation = testerAllocation + yapperAllocationS0 + yapperAllocationS1;

    // Render totals
    allocationAmount.innerHTML = `Your Union Allocation is <span style="color:#A9ECFD">${formatNumber(totalAllocation)}</span> $U`;
    allocationAmount.style.fontWeight = 'bold';

    // Tester Table
    testerTable.innerHTML = `
      <h2>Tester Allocation</h2>
      <div class="case-row"><span class="case-label">Level:</span> ${level ?? "-"} (${title ?? "—"})</div>
      <div class="case-row"><span class="case-label">XP:</span> ${xp ?? "-"}</div>
      <div class="case-row"><span class="case-label">Your Tester Allocation:</span>
        <span class="case-range">${formatNumber(testerAllocation)} $U</span>
      </div>
    `;

    // Yapper S0 Table (display full precision)
    yapperS0Table.innerHTML = `
      <h2>Season 0 Allocation</h2>
      <div class="case-row"><span class="case-label">Mindshare:</span> ${formatMindshare(mindshareS0)}%</div>
      <div class="case-row"><span class="case-label">Your S0 Yapper Allocation:</span>
        <span class="case-range">${formatNumber(yapperAllocationS0)} $U</span>
      </div>
      ${FDV_CASES.map((c, i) => `
      <div class="case-row">
        <img class="case-emoji" src="${CASE_ICONS[i]}" alt="">
        <span class="case-label">${c.label}</span>
        <span class="case-fdv">${c.range}</span>
        <span class="case-range">${formatUsdRange(yapperAllocationS0, c.usd)}</span>
      </div>`).join("")}
    `;

    // Yapper S1 Table (display full precision, after ×100 conversion)
    yapperS1Table.innerHTML = `
      <h2>Season 1 Allocation</h2>
      <div class="case-row"><span class="case-label">Mindshare:</span> ${formatMindshare(mindshareS1)}%</
