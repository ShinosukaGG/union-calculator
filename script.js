// === CONFIG ===
const SUPABASE_APIKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmxxYnR3cWV0bHRkY3Zpb2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMjM4MzMsImV4cCI6MjA2OTU5OTgzM30.d-leDFpzc6uxDvq47_FC0Fqh0ztaL11Oozm-z6T9N_M';
const SUPABASE_URL = 'https://bvvlqbtwqetltdcvioie.supabase.co/rest/v1';

// ===== Brand Emojis for each case (replace with URLs if needed) ====
const CASE_ICONS = [
  "https://em-content.zobj.net/source/apple/354/man-office-worker_1f468-200d-1f4bc.png", // Ideal
  "https://em-content.zobj.net/source/apple/354/man-office-worker_1f468-200d-1f4bc.png", // Bull
  "https://em-content.zobj.net/source/apple/354/man-office-worker_1f468-200d-1f4bc.png", // Super Bull
  "https://em-content.zobj.net/source/apple/354/man-office-worker_1f468-200d-1f4bc.png"  // Giga Bull
];

// ==== Allocation constants (levels, pools, XP, users) ====
const LEVELS = [
  { level: 10, label: "Top 100", min: 1155, max: 20000, users: 100, pool: 25000000 },
  { level: 9,  label: "Sr. Lt & Up", min: 955, max: 1154, users: 440, pool: 45000000 },
  { level: 8,  label: "Lieutenant", min: 780, max: 954, users: 3090, pool: 85000000 },
  { level: 7,  label: "Junior Lt", min: 630, max: 779, users: 9570, pool: 100000000 },
  { level: 6,  label: "Starshina", min: 455, max: 629, users: 45120, pool: 165000000 },
  { level: 5,  label: "Sr. Sgt", min: 300, max: 454, users: 23250, pool: 50000000 },
  { level: 4,  label: "Sgt", min: 150, max: 299, users: 27270, pool: 30000000 }
];

// ==== Yapper Pool Constants ====
const YAPPER_S0_POOL = 45000000;
const YAPPER_S1_POOL = 30000000;
const FDV_CASES = [
  { label: "Ideal Case", range: "$500M–$750M", usd: [0.05, 0.075] },
  { label: "Bull Case", range: "$750M–$1B", usd: [0.075, 0.10] },
  { label: "Super Bull", range: "$1.2B–$1.7B", usd: [0.12, 0.17] },
  { label: "Giga Bull", range: "$1.7B–$2.5B", usd: [0.17, 0.20] }
];

// ==== Confetti Setup ====
function launchConfetti(duration = 4000) {
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

// ==== Utility: Format number ====
function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(0) + "K";
  return num.toLocaleString();
}

// ==== Utility: Format $ Range ====
function formatUsdRange(tokenAmount, [min, max]) {
  return `~$${Math.round(tokenAmount * min).toLocaleString()}–$${Math.round(tokenAmount * max).toLocaleString()}`;
}

// ==== Fetch Functions ====

// Search user in leaderboard (multiple strategies)
async function fetchUserData(username) {
  let user = null, url, response, users;
  // 1. display_name ilike (exact)
  url = `${SUPABASE_URL}/leaderboard_full_0208?display_name=ilike.${username}`;
  response = await fetch(url, { headers: { 'apikey': SUPABASE_APIKEY } });
  if (response.ok) {
    users = await response.json();
    if (users && users.length > 0) {
      user = users.find(u => (u.display_name || '').toLowerCase() === username.toLowerCase()) || null;
    }
  }
  // 2. username ilike (exact)
  if (!user) {
    url = `${SUPABASE_URL}/leaderboard_full_0208?username=ilike.${username}`;
    response = await fetch(url, { headers: { 'apikey': SUPABASE_APIKEY } });
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
    response = await fetch(url, { headers: { 'apikey': SUPABASE_APIKEY } });
    if (response.ok) {
      users = await response.json();
      if (users && users.length > 0) user = users[0];
    }
  }
  // 4. username ilike (partial)
  if (!user) {
    url = `${SUPABASE_URL}/leaderboard_full_0208?username=ilike.%${username}%`;
    response = await fetch(url, { headers: { 'apikey': SUPABASE_APIKEY } });
    if (response.ok) {
      users = await response.json();
      if (users && users.length > 0) user = users[0];
    }
  }
  return user;
}

// Mindshare from yapper S0/S1
// Mindshare from yapper S0/S1
async function fetchMindshare(table, username) {
  let url = `${SUPABASE_URL}/${table}?username=eq.${encodeURIComponent(username)}`;
  let res = await fetch(url, { headers: { 'apikey': SUPABASE_APIKEY } });
  let data = (res.ok) ? await res.json() : [];
  if (!data || data.length === 0) {
    url = `${SUPABASE_URL}/${table}?username=ilike.%25${encodeURIComponent(username)}%25`;
    res = await fetch(url, { headers: { 'apikey': SUPABASE_APIKEY } });
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
    if (typeof mindshareVal === 'string') mindshareVal = mindshareVal.replace('%', '').trim();
    if (mindshareVal !== null && !isNaN(mindshareVal)) {
      let num = parseFloat(mindshareVal);
      // DO NOT multiply by 100!
      return num.toFixed(2);
    } else if (mindshareVal !== null) {
      let num = parseFloat(String(mindshareVal).replace(',', '.'));
      if (!isNaN(num)) return num.toFixed(2);
    }
  }
  return '0.00';
}

// ==== TESTER ALLOCATION CALC ====
function calculateTesterAllocation(level, userXP) {
  if (level == 10) return 250000; // Equal share
  const lvl = LEVELS.find(l => l.level === level);
  if (!lvl || !userXP || isNaN(userXP)) return 0;
  let XP_score = (userXP - lvl.min) / (lvl.max - lvl.min);
  XP_score = Math.max(0, Math.min(1, XP_score));
  // Linear scaling (min gets 0.5x avg, max gets 1.5x avg, sum checks out)
  const avg = lvl.pool / lvl.users;
  const userToken = ((XP_score * 1 + 0.5) * avg); // Scales from 0.5x to 1.5x avg
  return Math.round(userToken);
}

// ==== YAPPER ALLOCATION ====
function calculateYapperAllocation(mindshare, pool) {
  if (!mindshare || isNaN(Number(mindshare))) return 0;
  return Math.round((parseFloat(mindshare) / 100) * pool);
}

// ==== Main Event ====
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
  const confettiCanvas = document.getElementById('confetti-canvas');

  // === MAIN FORM EVENT ===
  usernameForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    let uname = usernameInput.value.trim().replace(/^@/, "");
    if (!uname) {
      usernameInput.classList.add('error');
      return;
    }
    calcBtn.disabled = true;
    calcBtn.innerText = "Calculating...";
    // Fetch data
    let user = await fetchUserData(uname);
    if (!user) {
      alert('User not found.');
      calcBtn.disabled = false;
      calcBtn.innerText = "Calculate Your Allocation";
      return;
    }
    // Username/Display
    const xusername = (user.username || user.display_name || uname);
    // PFP
    let pfp = user.pfp;
    if (user.jsonInput) {
      try {
        const json = typeof user.jsonInput === 'string' ? JSON.parse(user.jsonInput) : user.jsonInput;
        pfp = json.pfp || pfp;
      } catch (e) {}
    }
    profilePfp.src = pfp || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";
    profileUsername.textContent = "@" + xusername;
    // XP, Level, Title
    let xp = user.total_xp;
    let level = user.level;
    let title = user.title;
    if (user.jsonInput) {
      try {
        const json = typeof user.jsonInput === 'string' ? JSON.parse(user.jsonInput) : user.jsonInput;
        xp = json.total_xp || xp;
        level = json.level || level;
        title = json.title || title;
      } catch (e) {}
    }
    // Mindshare (Yapper S0, S1)
    const mindshareS0 = await fetchMindshare('yaps_season_zero', xusername);
    const mindshareS1 = await fetchMindshare('yaps_season_one', xusername);

    // Allocations
    let testerAllocation = (level && xp) ? calculateTesterAllocation(Number(level), Number(xp)) : 0;
    let yapperAllocationS0 = calculateYapperAllocation(mindshareS0, YAPPER_S0_POOL);
    let yapperAllocationS1 = calculateYapperAllocation(mindshareS1, YAPPER_S1_POOL);
    let totalAllocation = testerAllocation + yapperAllocationS0 + yapperAllocationS1;

    // === Render
    allocationAmount.innerHTML = `Your Union Allocation is <span style="color:#A9ECFD">${formatNumber(totalAllocation)}</span> $U`;
    // Show allocation amount nicely
    allocationAmount.style.fontWeight = 'bold';

    // === Tweet Btn logic ===
    tweetBtn.onclick = function() {
      const tweet = `Just calculated my Tester + Yapper allocation for @union_build 🎊

My allocation: ${formatNumber(totalAllocation)} $U 💰
At the bull case FDV this can be life changing.

Go Calculate Yours: union-calculator.vercel.app

#UnionAllocation`;
      const tweetIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
      window.open(tweetIntent, "_blank");
    };

    // Tester Table
    testerTable.innerHTML = `
      <h2>Tester Allocation</h2>
      <div class="case-row"><span class="case-label">Level:</span> ${level || "-"} (${title || "—"})</div>
      <div class="case-row"><span class="case-label">XP:</span> ${xp || "-"} </div>
      <div class="case-row"><span class="case-label">Your Tester Allocation:</span>
        <span class="case-range">${formatNumber(testerAllocation)} $U</span>
      </div>
    `;

    // Yapper S0 Table
    yapperS0Table.innerHTML = `
      <h2>Season 0 Allocation</h2>
      <div class="case-row"><span class="case-label">Mindshare:</span> ${mindshareS0 || "0"}%</div>
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

    // Yapper S1 Table
    yapperS1Table.innerHTML = `
      <h2>Season 1 Allocation</h2>
      <div class="case-row"><span class="case-label">Mindshare:</span> ${mindshareS1 || "0"}%</div>
      <div class="case-row"><span class="case-label">Your S1 Yapper Allocation:</span>
        <span class="case-range">${formatNumber(yapperAllocationS1)} $U</span>
      </div>
      ${FDV_CASES.map((c, i) => `
      <div class="case-row">
        <img class="case-emoji" src="${CASE_ICONS[i]}" alt="">
        <span class="case-label">${c.label}</span>
        <span class="case-fdv">${c.range}</span>
        <span class="case-range">${formatUsdRange(yapperAllocationS1, c.usd)}</span>
      </div>`).join("")}
    `;

    // Show/hide views
    landingBox.style.display = 'none';
    resultSection.style.display = 'flex';

    // Launch confetti for 5 seconds!
    launchConfetti(5000);

    // Reset button
    calcBtn.disabled = false;
    calcBtn.innerText = "Calculate Your Allocation";
  });

  // Remove error class on focus
  usernameInput.addEventListener('focus', () => {
    usernameInput.classList.remove('error');
  });

  // Responsive confetti canvas resize
  window.addEventListener('resize', () => {
    const canvas = document.getElementById("confetti-canvas");
    if (canvas && canvas.style.display !== "none") {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  });
});
