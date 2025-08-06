const SUPABASE_URL = "https://bvvvlqbtwqetltdcvioie.supabase.co/rest/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmxqYnR3cWVo0bHRkY3Zpb2llLCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg2MjA1OTg3LCJleHAiOjIwMzk4ODE1ODd9.4ccII6MjA20TU5OTgzM30.d-leDFpzc6uxDvq47_FCOFqh0ztaL11oozm-z6T9N_M";

// -- Tester allocation pools (replace as needed) --
const levelData = {
  10: { minXP: 1155, maxXP: 1500, users: 100, pool: 3750000 },
  9: { minXP: 955, maxXP: 1154, users: 400, pool: 3750000 },
  8: { minXP: 850, maxXP: 954, users: 3090, pool: 22500000 },
  7: { minXP: 700, maxXP: 849, users: 4510, pool: 22500000 },
  6: { minXP: 495, maxXP: 699, users: 4510, pool: 24750000 },
  5: { minXP: 450, maxXP: 494, users: 27270, pool: 45000000 },
  4: { minXP: 150, maxXP: 299, users: 27270, pool: 45000000 }
};

const yapperPools = [4500000, 3000000]; // S0, S1

document.getElementById('search-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim().replace(/^@/, "");
  if (!username) return;

  document.getElementById('form-error').textContent = "";
  document.getElementById('user-section').classList.add('hidden');
  document.getElementById('total-section').classList.add('hidden');
  document.getElementById('allocations-section').classList.add('hidden');
  document.getElementById('share-section').classList.add('hidden');

  // Fetch all data in parallel
  const [tester, yap0, yap1] = await Promise.all([
    fetchUserFromTable('leaderboard_full_0208', username),
    fetchUserFromTable('yaps_season_zero', username),
    fetchUserFromTable('yaps_season_one', username)
  ]);

  if (!tester && !yap0 && !yap1) {
    document.getElementById('form-error').textContent = "User not found in any leaderboard.";
    return;
  }

  // Show user
  const pfp = tester?.pfp || `https://unavatar.io/twitter/${username}`;
  document.getElementById('user-pfp').src = pfp;
  document.getElementById('user-username').textContent = '@' + username;
  document.getElementById('user-section').classList.remove('hidden');

  // --- Tester allocation
  let testerAlloc = 0;
  let testerTableHtml = "";
  if (tester && tester.level && tester.xp) {
    const { allocation, level, xp } = calcTesterAllocation(tester.level, tester.xp);
    testerAlloc = allocation;
    testerTableHtml = `
      <table>
        <tr><th>Level</th><td>${level}</td></tr>
        <tr><th>XP</th><td>${xp}</td></tr>
        <tr><th>Allocation</th><td>${formatNum(allocation)} $U</td></tr>
      </table>
    `;
  } else {
    testerTableHtml = `<span style="color:#ff8888;">No eligible tester data.</span>`;
  }
  document.getElementById('tester-allocation').innerHTML = testerTableHtml;

  // --- Yapper S0 allocation
  let yap0Alloc = 0;
  let yap0TableHtml = "";
  if (yap0 && yap0.mindshare) {
    yap0Alloc = calcYapperAllocation(yap0.mindshare, 0);
    yap0TableHtml = `
      <table>
        <tr><th>Mindshare</th><td>${yap0.mindshare}%</td></tr>
        <tr><th>Allocation</th><td>${formatNum(yap0Alloc)} $U</td></tr>
      </table>
    `;
  } else {
    yap0TableHtml = `<span style="color:#ff8888;">No Yapper S0 data.</span>`;
  }
  document.getElementById('yapper0-allocation').innerHTML = yap0TableHtml;

  // --- Yapper S1 allocation
  let yap1Alloc = 0;
  let yap1TableHtml = "";
  if (yap1 && yap1.mindshare) {
    yap1Alloc = calcYapperAllocation(yap1.mindshare, 1);
    yap1TableHtml = `
      <table>
        <tr><th>Mindshare</th><td>${yap1.mindshare}%</td></tr>
        <tr><th>Allocation</th><td>${formatNum(yap1Alloc)} $U</td></tr>
      </table>
    `;
  } else {
    yap1TableHtml = `<span style="color:#ff8888;">No Yapper S1 data.</span>`;
  }
  document.getElementById('yapper1-allocation').innerHTML = yap1TableHtml;

  // --- Total Allocation
  const total = testerAlloc + yap0Alloc + yap1Alloc;
  document.getElementById('total-allocation').textContent = formatNum(total) + " $U";
  document.getElementById('total-section').classList.remove('hidden');
  document.getElementById('allocations-section').classList.remove('hidden');
  document.getElementById('share-section').classList.remove('hidden');
});

// ---- Helper functions

async function fetchUserFromTable(table, username) {
  const headers = {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };
  const queries = [
    `display_name=ilike.${username}`,
    `username=ilike.${username}`,
    `display_name=ilike.*${username}*`,
    `username=ilike.*${username}*`
  ];
  for (const query of queries) {
    const url = `${SUPABASE_URL}/${table}?${query}`;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.length) return data[0];
    }
  }
  return null;
}

function calcTesterAllocation(level, xp) {
  level = Number(level);
  xp = Number(xp);
  const d = levelData[level];
  if (!d || xp < d.minXP || xp > d.maxXP) return {allocation: 0, level, xp};
  if (level === 10) return {allocation: 3750000, level, xp};
  const meanToken = d.pool / d.users;
  const xpScore = (xp - d.minXP) / (d.maxXP - d.minXP);
  const allocation = Math.round(meanToken * (1 + xpScore));
  return {allocation, level, xp};
}

function calcYapperAllocation(mindshare, seasonIdx) {
  mindshare = parseFloat((mindshare + '').replace("%","")) || 0;
  const pool = yapperPools[seasonIdx];
  return Math.round(pool * mindshare / 100);
}

function formatNum(n) {
  n = Number(n);
  if(n >= 1e6) return (n/1e6).toFixed(2).replace(/\.00$/, '')+'M';
  if(n >= 1e3) return (n/1e3).toFixed(1).replace(/\.0$/, '')+'K';
  return n;
}
