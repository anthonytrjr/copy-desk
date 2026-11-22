const STORAGE_KEY = "copyDesk.dataUrl";
const POLL_MS = 15000;

const stateEl = {
  balance: document.getElementById("balanceVal"),
  updated: document.getElementById("updatedAt"),
  chart: document.getElementById("balanceChart"),
  screen: document.getElementById("liveScreen"),
  screenFallback: document.getElementById("screenFallback"),
  heartbeats: document.getElementById("heartbeats"),
  whales: document.getElementById("whalesList"),
  positions: document.getElementById("positionsList"),
  activity: document.getElementById("activityList"),
  setupCard: document.getElementById("setupCard"),
  dataUrlInput: document.getElementById("dataUrlInput"),
  saveBtn: document.getElementById("saveDataUrl"),
  changeBtn: document.getElementById("changeDataUrl"),
  setupError: document.getElementById("setupError"),
  stubNote: document.getElementById("stubNote"),
  modeBadge: document.getElementById("modeBadge"),
};

function isLocalDesk() {
  return ["127.0.0.1", "localhost"].includes(location.hostname);
}

function getStoredDataUrl() {
  try {
    return (localStorage.getItem(STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

function showError(message) {
  stateEl.setupError.textContent = message;
  stateEl.setupError.classList.toggle("hidden", !message);
}

function saveDataUrl(raw) {
  const cleaned = (raw || "").trim();
  if (!cleaned) throw new Error("Paste a data link first.");
  let parsed;
  try {
    parsed = new URL(cleaned);
  } catch {
    throw new Error("That does not look like a URL.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("The data link must start with https://");
  }
  if (parsed.protocol === "http:" && !isLocalDesk()) {
    throw new Error("Use an https:// data link on the phone app.");
  }
  localStorage.setItem(STORAGE_KEY, cleaned);
}

function consumeHash() {
  const hash = location.hash.replace(/^#/, "");
  if (!hash) return;
  let url = "";
  if (hash.startsWith("data=")) {
    url = decodeURIComponent(hash.slice(5));
  } else if (/^https?:/i.test(hash)) {
    url = decodeURIComponent(hash);
  }
  if (!url) return;
  try {
    saveDataUrl(url);
    history.replaceState(null, "", location.pathname + location.search);
  } catch (err) {
    showSetup(true);
    showError(err.message);
  }
}

function showSetup(visible) {
  stateEl.setupCard.classList.toggle("hidden", !visible);
  if (visible) {
    stateEl.dataUrlInput.value = getStoredDataUrl();
    stateEl.dataUrlInput.focus();
  }
}

function fmtTime(iso) {
  if (!iso) return "--";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

async function parseSnapshot(res) {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Snapshot was not valid JSON.");
  }
  if (data && data.files && typeof data.files === "object") {
    const files = Object.values(data.files);
    const preferred = files.find((f) => f && /\.json$/i.test(f.filename || "")) || files[0];
    if (preferred && preferred.content) {
      return JSON.parse(preferred.content);
    }
    if (preferred && preferred.raw_url) {
      const rawRes = await fetch(preferred.raw_url, { cache: "no-store" });
      if (!rawRes.ok) throw new Error(`Snapshot raw HTTP ${rawRes.status}`);
      return rawRes.json();
    }
    throw new Error("Gist snapshot had no JSON file.");
  }
  return data;
}

function normalize(snapshot) {
  if (snapshot && snapshot.state) return snapshot;
  return {
    schema: "copy-desk-snapshot-v1",
    mode: (snapshot && snapshot.mode) || "PAPER",
    stub: !!(snapshot && snapshot.stub),
    source: (snapshot && snapshot.source) || "unknown",
    updated_at: snapshot && snapshot.updated_at,
    state: snapshot || {},
    whales: {
      whales: [],
      count: (snapshot && snapshot.whales_count) || 0,
      note: "No whale list in this snapshot.",
    },
    activity: { items: [] },
    screen_svg: snapshot && snapshot.screen_svg,
  };
}

async function loadLocalApis() {
  const [stateRes, whalesRes, actRes] = await Promise.all([
    fetch("/api/state", { cache: "no-store" }),
    fetch("/api/whales", { cache: "no-store" }),
    fetch("/api/activity", { cache: "no-store" }),
  ]);
  if (!stateRes.ok) throw new Error(`Local API HTTP ${stateRes.status}`);
  const state = await stateRes.json();
  const whales = whalesRes.ok ? await whalesRes.json() : { whales: [], note: "Whales API unavailable." };
  const activity = actRes.ok ? await actRes.json() : { items: [] };
  return {
    schema: "copy-desk-snapshot-v1",
    mode: "PAPER",
    stub: false,
    source: "paper_api",
    updated_at: state.updated_at,
    state,
    whales,
    activity,
    screen_url: `/api/screen.svg?t=${Date.now()}`,
  };
}

function setScreen(svgText, screenUrl) {
  if (screenUrl) {
    stateEl.screen.src = screenUrl;
    stateEl.screen.classList.remove("hidden");
    stateEl.screenFallback.classList.add("hidden");
    return;
  }
  if (svgText) {
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const previous = stateEl.screen.dataset.blobUrl;
    stateEl.screen.onload = () => {
      if (previous) URL.revokeObjectURL(previous);
    };
    stateEl.screen.dataset.blobUrl = url;
    stateEl.screen.src = url;
    stateEl.screen.classList.remove("hidden");
    stateEl.screenFallback.classList.add("hidden");
    return;
  }
  stateEl.screen.classList.add("hidden");
  stateEl.screenFallback.classList.remove("hidden");
  stateEl.screenFallback.textContent = "No screen in this snapshot (PAPER stub).";
}

function render(snap) {
  const state = snap.state || {};
  const mode = snap.mode || state.mode || "PAPER";
  stateEl.modeBadge.textContent = `${mode} MODE`;
  stateEl.stubNote.classList.toggle("hidden", !snap.stub);
  stateEl.balance.textContent = `$${Number(state.balance_usd || 0).toFixed(2)}`;
  const sourceLabel = snap.stub ? "stub" : (snap.source || "snapshot");
  stateEl.updated.textContent = `Updated ${fmtTime(snap.updated_at || state.updated_at)} · ${sourceLabel}`;
  window.drawBalanceChart(stateEl.chart, state.balance_history || [], state.starting_usd || 1000);

  setScreen(snap.screen_svg, snap.screen_url);

  stateEl.heartbeats.innerHTML = (state.heartbeats || [])
    .map((hb) => `<span class="pill ok">${hb.bot} · ${fmtTime(hb.ts)}</span>`)
    .join("") || `<span class="muted">Waiting for heartbeats...</span>`;

  const whales = snap.whales || {};
  const whaleRows = whales.whales || [];
  stateEl.whales.innerHTML = whaleRows.length
    ? whaleRows.map((w) => `<div class="list-item"><span>@${w.handle || w.user_id}</span><span>#${w.rank ?? "-"}</span></div>`).join("")
    : `<div class="muted">${whales.note || "No whales tracked yet."}</div>`;

  const posRows = state.open_positions || [];
  stateEl.positions.innerHTML = posRows.length
    ? posRows.map((p) => `<div class="list-item"><span>${p.mint}</span><span>$${Number(p.size_usd || 0).toFixed(2)}</span></div>`).join("")
    : `<div class="muted">No open paper positions.</div>`;

  const actRows = (snap.activity && snap.activity.items) || [];
  stateEl.activity.innerHTML = actRows.length
    ? actRows.map((a) => `<div class="list-item"><span>${a.title || a.kind}</span><span>${a.value || ""}</span></div>`).join("")
    : `<div class="muted">No activity yet (Step 4 skeleton).</div>`;
}

async function refresh() {
  try {
    const dataUrl = getStoredDataUrl();
    if (dataUrl) {
      showSetup(false);
      showError("");
      // Simple GET only: raw gist OPTIONS preflight returns 403.
      // A cache-busting query helps the browser cache; GitHub's raw CDN may still lag.
      const fetchUrl = new URL(dataUrl);
      fetchUrl.searchParams.set("_t", String(Date.now()));
      const res = await fetch(fetchUrl.toString());
      if (!res.ok) throw new Error(`Snapshot HTTP ${res.status}`);
      render(normalize(await parseSnapshot(res)));
      return;
    }
    if (isLocalDesk()) {
      showSetup(false);
      render(await loadLocalApis());
      return;
    }
    showSetup(true);
    stateEl.updated.textContent = "Add your secret data link to load the desk.";
  } catch (err) {
    stateEl.updated.textContent = `Poll error: ${err.message}`;
  }
}

stateEl.saveBtn.addEventListener("click", () => {
  try {
    saveDataUrl(stateEl.dataUrlInput.value);
    showError("");
    showSetup(false);
    refresh();
  } catch (err) {
    showError(err.message);
  }
});

stateEl.dataUrlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") stateEl.saveBtn.click();
});

stateEl.changeBtn.addEventListener("click", () => {
  showSetup(true);
  showError("");
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

consumeHash();
refresh();
setInterval(refresh, POLL_MS);
