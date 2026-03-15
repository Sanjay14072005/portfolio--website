(function () {
  const username = "Sanjay_147";
  const CACHE_KEY = "leetcode_live_cache_v3";

  const userLabel = document.getElementById("leetcodeUserLabel");
  const easySolvedEl = document.getElementById("easySolved");
  const mediumSolvedEl = document.getElementById("mediumSolved");
  const hardSolvedEl = document.getElementById("hardSolved");
  const totalSolvedEl = document.getElementById("totalSolved");
  const heroSolvedCountEl = document.getElementById("heroSolvedCount");
  const maxStreakEl = document.getElementById("maxStreak");
  const heatmapEl = document.getElementById("leetcodeHeatmap");
  const statusEl = document.getElementById("leetcodeStatus");
  const rangeSelect = document.getElementById("leetcodeRangeSelect");

  if (!heatmapEl) return;
  if (userLabel) userLabel.textContent = username;

  let lastCalendar = {};
  let lastStreakFromApi = null;
  let selectedRange = "current";
  let statusMode = "live"; // live | cached | error

  const graphqlQuery = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        userCalendar {
          submissionCalendar
          streak
        }
      }
    }
  `;

  const graphqlPayload = {
    query: graphqlQuery,
    variables: { username }
  };

  const restEndpoint = `https://leetcode-api-faisalshohag.vercel.app/${username}`;
  const restFallbacks = [
    restEndpoint,
    `https://corsproxy.io/?${restEndpoint}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(restEndpoint)}`
  ];

  const graphqlFallbacks = [
    "https://leetcode.com/graphql/",
    "https://corsproxy.io/?https://leetcode.com/graphql/",
    "https://cors.isomorphic-git.org/https://leetcode.com/graphql/"
  ];

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function dateKeyUTC(year, month, day) {
    const y = String(year);
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getTodayUTC() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  function getCurrentRangeBounds() {
    const endDate = getTodayUTC();
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - 364);
    return { startDate, endDate };
  }

  function getRangeBoundsForSelection(selection) {
    if (selection && selection.startsWith("year-")) {
      const year = Number(selection.slice(5));
      if (Number.isFinite(year) && year > 0) {
        return {
          startDate: new Date(Date.UTC(year, 0, 1)),
          endDate: new Date(Date.UTC(year, 11, 31))
        };
      }
    }
    return getCurrentRangeBounds();
  }

  function fmtDate(date) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      timeZone: "UTC"
    });
  }

  function parseCalendar(raw) {
    if (!raw) return {};
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    if (typeof raw === "object") return raw;
    return {};
  }

  function normalizeCalendarMap(rawMap) {
    const source = parseCalendar(rawMap);
    const normalized = {};

    Object.entries(source).forEach(([key, value]) => {
      const count = toNumber(value);
      if (count === null) return;

      if (/^\d+$/.test(key)) {
        const dateObj = new Date(Number(key) * 1000);
        if (!Number.isNaN(dateObj.getTime())) {
          normalized[
            dateKeyUTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate())
          ] = count;
        }
        return;
      }

      const dateObj = new Date(key);
      if (!Number.isNaN(dateObj.getTime())) {
        normalized[
          dateKeyUTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate())
        ] = count;
      }
    });

    return normalized;
  }

  function difficultyArrayToSolved(arr) {
    if (!Array.isArray(arr)) return null;
    const map = {};
    arr.forEach((item) => {
      if (!item) return;
      map[String(item.difficulty || "").toLowerCase()] = toNumber(item.count) || 0;
    });

    if (map.easy === undefined || map.medium === undefined || map.hard === undefined) return null;
    return {
      easy: map.easy,
      medium: map.medium,
      hard: map.hard,
      total: map.all !== undefined ? map.all : map.easy + map.medium + map.hard
    };
  }

  function extractSolvedFromAny(data) {
    if (!data || typeof data !== "object") return null;

    const easy = toNumber(data.easySolved);
    const medium = toNumber(data.mediumSolved);
    const hard = toNumber(data.hardSolved);
    const total = toNumber(data.totalSolved);
    if (easy !== null && medium !== null && hard !== null) {
      return { easy, medium, hard, total: total !== null ? total : easy + medium + hard };
    }

    const direct = difficultyArrayToSolved(data.acSubmissionNum);
    if (direct) return direct;

    const nested = difficultyArrayToSolved(data.submitStatsGlobal && data.submitStatsGlobal.acSubmissionNum);
    if (nested) return nested;

    if (data.matchedUser) return extractSolvedFromAny(data.matchedUser);
    if (data.data) return extractSolvedFromAny(data.data);
    return null;
  }

  function extractCalendarFromAny(data) {
    if (!data || typeof data !== "object") return {};

    const candidates = [
      data.submissionCalendar,
      data.userCalendar && data.userCalendar.submissionCalendar,
      data.calendar,
      data.matchedUser && data.matchedUser.userCalendar && data.matchedUser.userCalendar.submissionCalendar,
      data.data &&
        data.data.matchedUser &&
        data.data.matchedUser.userCalendar &&
        data.data.matchedUser.userCalendar.submissionCalendar
    ];

    for (const c of candidates) {
      const normalized = normalizeCalendarMap(c);
      if (Object.keys(normalized).length) return normalized;
    }
    return {};
  }

  function extractMaxStreakFromAny(data) {
    if (!data || typeof data !== "object") return null;
    const candidates = [
      data.maxStreak,
      data.max_streak,
      data.userCalendar && data.userCalendar.maxStreak,
      data.userCalendar && data.userCalendar.streak,
      data.matchedUser && data.matchedUser.userCalendar && data.matchedUser.userCalendar.maxStreak,
      data.matchedUser && data.matchedUser.userCalendar && data.matchedUser.userCalendar.streak
    ];

    for (const c of candidates) {
      const n = toNumber(c);
      if (n !== null && n >= 0) return n;
    }

    if (data.data) return extractMaxStreakFromAny(data.data);
    return null;
  }

  function getDisplayMonths(startDate, endDate) {
    const start = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
    const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1));

    const months = [];
    for (let cur = new Date(start); cur <= end; cur.setUTCMonth(cur.getUTCMonth() + 1)) {
      const year = cur.getUTCFullYear();
      const month = cur.getUTCMonth();
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const startWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
      const columns = Math.ceil((startWeekday + daysInMonth) / 7);
      months.push({
        year,
        month,
        label: cur.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
        daysInMonth,
        startWeekday,
        columns
      });
    }
    return months;
  }

  function getAvailablePastYears(calendarByDate) {
    const currentYear = getTodayUTC().getUTCFullYear();
    const years = new Set();

    Object.keys(calendarByDate || {}).forEach((key) => {
      const y = Number(String(key).slice(0, 4));
      if (Number.isFinite(y) && y < currentYear) years.add(y);
    });

    return Array.from(years).sort((a, b) => b - a);
  }

  function syncRangeSelect(calendarByDate) {
    if (!rangeSelect) return;
    const years = getAvailablePastYears(calendarByDate);
    const previous = selectedRange;

    rangeSelect.innerHTML = "";
    const currentOption = document.createElement("option");
    currentOption.value = "current";
    currentOption.textContent = "Current";
    rangeSelect.appendChild(currentOption);

    years.forEach((year) => {
      const option = document.createElement("option");
      option.value = `year-${year}`;
      option.textContent = String(year);
      rangeSelect.appendChild(option);
    });

    const validValues = ["current", ...years.map((y) => `year-${y}`)];
    selectedRange = validValues.includes(previous) ? previous : "current";
    rangeSelect.value = selectedRange;
  }

  function levelFromCount(count, maxCount) {
    if (!count) return 0;
    if (maxCount <= 1) return 4;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  function applySolvedCounts(solved) {
    const easy = Number((solved && solved.easy) || 0);
    const medium = Number((solved && solved.medium) || 0);
    const hard = Number((solved && solved.hard) || 0);
    const total = Number((solved && solved.total) || easy + medium + hard);

    if (easySolvedEl) easySolvedEl.textContent = String(easy);
    if (mediumSolvedEl) mediumSolvedEl.textContent = String(medium);
    if (hardSolvedEl) hardSolvedEl.textContent = String(hard);
    if (totalSolvedEl) totalSolvedEl.textContent = String(total);
    if (heroSolvedCountEl) heroSolvedCountEl.textContent = String(total);
  }

  function computeMaxStreak(calendarByDate, startDate, endDate) {
    let maxStreak = 0;
    let current = 0;

    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = dateKeyUTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      const solved = Number(calendarByDate[key]) || 0;
      if (solved > 0) {
        current += 1;
        if (current > maxStreak) maxStreak = current;
      } else {
        current = 0;
      }
    }
    return maxStreak;
  }

  function applyStreak(calendarByDate, startDate, endDate) {
    const computed = computeMaxStreak(calendarByDate || {}, startDate, endDate);
    const best =
      selectedRange === "current" &&
      typeof lastStreakFromApi === "number" &&
      Number.isFinite(lastStreakFromApi)
        ? Math.max(lastStreakFromApi, computed)
        : computed;
    if (maxStreakEl) maxStreakEl.textContent = String(best);
  }

  function calculateSizing(months) {
    const width = heatmapEl.clientWidth || heatmapEl.parentElement.clientWidth || 900;
    const monthGap = width < 520 ? 5 : 8;
    const cellGap = width < 520 ? 2 : 3;

    const totalCols = months.reduce((sum, m) => sum + m.columns, 0);
    const internalGaps = months.reduce((sum, m) => sum + (m.columns - 1) * cellGap, 0);
    const monthGaps = (months.length - 1) * monthGap;

    const rawCell = (width - internalGaps - monthGaps) / totalCols;
    const cellSize = Math.max(3, Math.floor(rawCell));

    return { cellSize, cellGap, monthGap };
  }

  function selectionLabel() {
    if (selectedRange === "current") return "Current";
    return selectedRange.replace("year-", "");
  }

  function updateStatusLine(startDate, endDate) {
    if (!statusEl) return;

    if (statusMode === "live") {
      statusEl.textContent = "";
      return;
    }

    if (statusMode === "cached") {
      statusEl.textContent = "Live fetch failed now. Showing cached data.";
      return;
    }

    statusEl.textContent = "Unable to load live LeetCode data right now (network/CORS).";
  }

  function renderHeatmap(calendarByDate) {
    heatmapEl.innerHTML = "";

    const bounds = getRangeBoundsForSelection(selectedRange);
    const startDate = bounds.startDate;
    const endDate = bounds.endDate;
    const months = getDisplayMonths(startDate, endDate);
    const { cellSize, cellGap, monthGap } = calculateSizing(months);
    heatmapEl.style.setProperty("--cell-size", `${cellSize}px`);
    heatmapEl.style.setProperty("--cell-gap", `${cellGap}px`);
    heatmapEl.style.setProperty("--month-gap", `${monthGap}px`);

    const maxCount = Math.max(1, ...Object.values(calendarByDate || {}));

    months.forEach((m) => {
      const block = document.createElement("div");
      block.className = "month-block";

      const label = document.createElement("span");
      label.className = "month-label";
      label.textContent = m.label;

      const grid = document.createElement("div");
      grid.className = "month-grid";

      const slots = Array(m.columns * 7).fill(null);
      for (let day = 1; day <= m.daysInMonth; day += 1) {
        const currentDate = new Date(Date.UTC(m.year, m.month, day));
        if (currentDate < startDate || currentDate > endDate) continue;
        const slotIndex = m.startWeekday + (day - 1);
        slots[slotIndex] = dateKeyUTC(m.year, m.month, day);
      }

      slots.forEach((dateKey) => {
        const cell = document.createElement("div");
        cell.className = "heat-cell";

        if (!dateKey) {
          cell.classList.add("heat-void");
        } else {
          const count = Number(calendarByDate[dateKey]) || 0;
          const lvl = levelFromCount(count, maxCount);
          cell.classList.add(`lvl-${lvl}`);
          cell.title = `${dateKey}: ${count} submissions`;
        }

        grid.appendChild(cell);
      });

      block.append(label, grid);
      heatmapEl.appendChild(block);
    });

    applyStreak(calendarByDate || {}, startDate, endDate);
    updateStatusLine(startDate, endDate);
  }

  async function fetchRest(url) {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`REST failed ${res.status}`);
    const data = await res.json();
    const solved = extractSolvedFromAny(data);
    if (!solved) throw new Error("REST solved fields missing");
    return {
      solved,
      calendar: extractCalendarFromAny(data),
      maxStreak: extractMaxStreakFromAny(data)
    };
  }

  async function fetchGraphql(url) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(graphqlPayload)
    });
    if (!res.ok) throw new Error(`GraphQL failed ${res.status}`);
    const data = await res.json();
    const solved = extractSolvedFromAny(data);
    if (!solved) throw new Error("GraphQL solved fields missing");
    return {
      solved,
      calendar: extractCalendarFromAny(data),
      maxStreak: extractMaxStreakFromAny(data)
    };
  }

  function saveCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  function readCache() {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    } catch {
      return null;
    }
  }

  async function fetchLiveData() {
    for (const url of graphqlFallbacks) {
      try {
        return await fetchGraphql(url);
      } catch {
        // fallback
      }
    }

    for (const url of restFallbacks) {
      try {
        return await fetchRest(url);
      } catch {
        // fallback
      }
    }

    throw new Error("All live endpoints failed");
  }

  function bindRangeSelect() {
    if (!rangeSelect) return;
    rangeSelect.addEventListener("change", () => {
      selectedRange = rangeSelect.value || "current";
      renderHeatmap(lastCalendar || {});
    });
  }

  async function init() {
    bindRangeSelect();

    try {
      const live = await fetchLiveData();
      lastCalendar = live.calendar || {};
      lastStreakFromApi = toNumber(live.maxStreak);
      statusMode = "live";
      applySolvedCounts(live.solved);
      syncRangeSelect(lastCalendar);
      renderHeatmap(lastCalendar);
      saveCache(live);
      return;
    } catch {
      const cached = readCache();
      if (cached && cached.solved) {
        lastCalendar = cached.calendar || {};
        lastStreakFromApi = toNumber(cached.maxStreak);
        statusMode = "cached";
        applySolvedCounts(cached.solved);
        syncRangeSelect(lastCalendar);
        renderHeatmap(lastCalendar);
        return;
      }

      lastCalendar = {};
      lastStreakFromApi = null;
      statusMode = "error";
      syncRangeSelect(lastCalendar);
      renderHeatmap({});
    }
  }

  window.addEventListener("resize", () => {
    renderHeatmap(lastCalendar || {});
  });

  init();
})();
