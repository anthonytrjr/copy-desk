(() => {
  const DATA_KEY = "copyDesk.dataUrl";
  const TOKEN_KEY = "copyDesk.appToken";
  let tradeFilterMode = "all";
  let tradeFilterState = "all";
  const BOT_COLORS = {
    watcher: "#64d2ff",
    vetter: "#ffd60a",
    sizer: "#bf5af2",
    executor: "#30d158",
    guard: "#ff6b9a"
  };
  const BOT_LABELS = {
    watcher: "Watcher",
    vetter: "Vetter",
    sizer: "Sizer",
    executor: "Executor",
    guard: "Guard"
  };
  const SETTINGS_GROUPS = [
    {
      name: "watcher",
      label: "Watcher",
      fields: [
        { key: "whales_top_n", label: "How many top whales to track", type: "number" },
        { key: "min_windows", label: "Minimum profitable windows", type: "number" },
        { key: "min_win_rate", label: "Minimum 7-day win rate %", type: "number" },
        { key: "min_trades_7d", label: "Minimum trades in 7 days", type: "number" },
        { key: "min_median_hold_min", label: "Minimum median hold (minutes)", type: "number" },
        { key: "max_top_coin_share", label: "Max share in one coin %", type: "number" },
        { key: "poll_s", label: "Watcher poll interval (seconds)", type: "number" },
        { key: "max_lag_s", label: "Max fill lag (seconds)", type: "number" },
        { key: "min_whale_buy_usd", label: "Minimum whale buy $", type: "number" },
        { key: "ignore_after_mcap_usd", label: "Ignore coins after this market cap $", type: "number" }
      ]
    },
    {
      name: "vetter",
      label: "Vetter",
      fields: [
        { key: "max_dev_pct", label: "Max dev wallet %", type: "number" },
        { key: "max_top10_pct", label: "Max top-10 holders %", type: "number" },
        { key: "min_lp_locked_pct", label: "Min LP locked/burned %", type: "number" },
        { key: "max_bundled", label: "Max bundled wallets", type: "number" },
        { key: "max_delegated_accounts", label: "Max delegated accounts", type: "number" },
        { key: "retries", label: "Audit retries", type: "number" },
        { key: "min_score", label: "Minimum score to pass (0–100)", type: "number" },
        { key: "alive_volume_h1", label: "Minimum 1-hour volume $", type: "number" },
        { key: "max_chase_pct", label: "Vetter chase penalty starts at +% (1h)", type: "number" },
        { key: "flow_sell_ratio", label: "Max sell/buy flow ratio", type: "number" },
        { key: "cluster_bonus", label: "Cluster bonus points", type: "number" }
      ]
    },
    {
      name: "social",
      label: "Social",
      fields: [
        { key: "social_weight", label: "Social score weight", type: "number" },
        { key: "social_max_per_h", label: "Max social mentions counted per hour", type: "number" },
        { key: "social_timeout_s", label: "Social lookup timeout (seconds)", type: "number" },
        { key: "shill_cut", label: "Shill ring cut (0–1)", type: "number" }
      ]
    },
    {
      name: "sizer",
      label: "Sizer",
      fields: [
        { key: "risk_per_trade_pct", label: "Risk per trade % of cash", type: "number" },
        { key: "stop_pct", label: "Stop loss % (shared with Guard)", type: "number" },
        { key: "one_whale_size", label: "Size % when 1 whale buys", type: "number" },
        { key: "two_whale_size", label: "Size % when 2 whales buy", type: "number" },
        { key: "full_whales", label: "Whales needed for full size", type: "number" },
        { key: "max_pool_pct", label: "Max % of the pool", type: "number" },
        { key: "min_ticket_usd", label: "Minimum ticket $", type: "number" },
        { key: "max_ticket_usd", label: "Maximum ticket $ (LIVE nights 1–3, then you raise it)", type: "number" },
        { key: "max_trades_night", label: "Max trades per night", type: "number" },
        { key: "max_open", label: "Max open positions", type: "number" }
      ]
    },
    {
      name: "executor",
      label: "Executor",
      fields: [
        { key: "dip_pct", label: "Wait for a dip of this %", type: "number" },
        { key: "dip_window_min", label: "Dip lookback window (minutes)", type: "number" },
        { key: "dip_wait_min", label: "Max minutes to wait for the dip", type: "number" },
        { key: "crash_pct", label: "Abort if it crashes this %", type: "number" },
        { key: "tp_x", label: "Take-profit multiple (e.g. 2.0x)", type: "number" },
        { key: "tp_sell_pct", label: "Sell this % at take profit", type: "number" },
        { key: "trail_pct", label: "Trailing stop %", type: "number" },
        { key: "recheck_liq_drop_pct", label: "Recheck if liquidity drops this %", type: "number" },
        { key: "recheck_price_up_pct", label: "Recheck if price has already run this %", type: "number" },
        { key: "quote_timeout_s", label: "Quote wait timeout (seconds)", type: "number" },
        { key: "verify_timeout_s", label: "Verify timeout (seconds; Step 12 default 30, Step 9 wrote 38)", type: "number" }
      ]
    },
    {
      name: "guard",
      label: "Guard",
      fields: [
        { key: "guard_poll_s", label: "Guard poll interval (seconds; spec name poll_s, stored as guard_poll_s so it does not clash with Watcher)", type: "number" },
        { key: "stop_pct", label: "Stop loss % (shared with Sizer)", type: "number" },
        { key: "timeout_h", label: "Max hold time (hours)", type: "number" },
        { key: "timeout_min_gain_pct", label: "Exit at timeout unless gain is at least this %", type: "number" },
        { key: "whale_exit_sell_pct", label: "Sell this % when the lead whale exits", type: "number" },
        { key: "whale_exit_min_whales", label: "Whales remaining before a whale-exit sell", type: "number" },
        { key: "night_loss_stop_pct", label: "Stop the night if book is down this %", type: "number" }
      ]
    },
    {
      name: "desk",
      label: "Desk",
      fields: [
        { key: "paper_start_cash", label: "PAPER starting cash $ (does not reset the open book)", type: "number" },
        { key: "night_start", label: "Night start time", type: "time" },
        { key: "lock_time", label: "Lock time", type: "time" },
        { key: "report_time", label: "Morning report time", type: "time" },
        { key: "notifier", label: "Push channel (telegram or webpush)", type: "select", options: ["telegram", "webpush"] },
        { key: "fomo_handle", label: "Your FOMO handle", type: "text" },
        { key: "withdraw_address", label: "Withdraw address (you set this; the desk never presses Confirm)", type: "secret" },
        { key: "rpc_url", label: "Solana RPC URL", type: "text" },
        { key: "push_rejects", label: "Also push rejected setups", type: "bool" },
        { key: "fee_pct", label: "PAPER fee % on large tickets", type: "number" },
        { key: "require_two_traders", label: "Require 2+ traders (your override)", type: "bool" },
        { key: "hard_chase_reject", label: "Hard-reject coins already up this much (your override)", type: "bool" },
        { key: "hard_chase_pct", label: "Hard chase reject threshold % (your 40% floor)", type: "number" },
        { key: "min_market_cap_usd", label: "Minimum market cap $ (your $15k floor)", type: "number" }
      ]
    }
  ];

  const FLOAT_STEPS = {
    fee_pct: "0.01",
    social_weight: "0.1",
    shill_cut: "0.1",
    flow_sell_ratio: "0.1",
    tp_x: "0.1",
    timeout_h: "0.25",
    risk_per_trade_pct: "0.1"
  };

  const state = {
    tab: "home",
    range: "LIVE",
    snap: null,
    lastBalanceStr: "",
    lastGoodUpdateAt: null,
    retryIn: 0,
    retryTimer: null,
    pollTimer: null,
    screenTimer: null,
    sseAbort: null,
    screenBlobUrl: null,
    screenActiveMint: null,
    screenZoom: 1,
    activeCoinMint: null,
    sellPct: 100
  };

  const $ = (id) => document.getElementById(id);

  function esc(val) {
    return String(val ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isHttpsUrl(url) {
    return typeof url === "string" && /^https:\/\//i.test(url);
  }

  function shortMint(mint) {
    const s = String(mint || "");
    return s.length > 12 ? `${s.slice(0, 4)}...${s.slice(-4)}` : s;
  }

  function fmtTime(iso) {
    if (!iso) return "--";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "--";
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
  }

  function fmtAgo(iso) {
    if (!iso) return "--";
    const ms = Date.now() - Date.parse(iso);
    if (!Number.isFinite(ms)) return "--";
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    return `${h}h ago`;
  }

  function fmtMoney(n) {
    const num = Number(n || 0);
    const sign = num < 0 ? "-" : "";
    return `${sign}$${Math.abs(num).toFixed(2)}`;
  }

  function fmtCompact(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return "--";
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  }

  function showToast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.add("hidden"), 2600);
  }

  function parseHashParams() {
    const raw = (window.location.hash || "").replace(/^#/, "");
    if (!raw) return {};
    const params = new URLSearchParams(raw);
    const data = params.get("data") || params.get("d");
    const token = params.get("t") || params.get("token");
    if (data) localStorage.setItem(DATA_KEY, data);
    if (token) localStorage.setItem(TOKEN_KEY, token);
    // Keep #d= / #data= and #t= in the address bar so Add to Home Screen
    // saves the full link. The fragment is never sent to a server.
    // localStorage remains the fallback when the fragment is absent.
    return { data, token };
  }

  function getAppToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function getDataUrl() {
    return localStorage.getItem(DATA_KEY) || "";
  }

  function isLocalHost() {
    const h = window.location.hostname;
    return h === "127.0.0.1" || h === "localhost" || h === "::1";
  }

  function activeMode() {
    if (getAppToken() && isLocalHost()) return "local";
    if (getDataUrl()) return "gist";
    if (getAppToken()) return "local";
    return "none";
  }

  function withCacheBust(url) {
    try {
      const u = new URL(url);
      u.searchParams.set("_t", String(Date.now()));
      return u.toString();
    } catch {
      return url;
    }
  }

  async function apiFetch(path, opts = {}) {
    const token = getAppToken();
    const headers = Object.assign({}, opts.headers || {});
    if (token) headers["X-App-Token"] = token;
    if (opts.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(path, Object.assign({}, opts, { headers, cache: "no-store" }));
    return res;
  }

  async function loadLocalSnapshot() {
    const range = encodeURIComponent(state.range);
    const [sRes, cRes, wRes, aRes, oRes, accRes, setRes] = await Promise.all([
      apiFetch("/api/state"),
      apiFetch(`/api/chart?range=${range}`),
      apiFetch("/api/whales"),
      apiFetch("/api/activity"),
      apiFetch("/api/orders"),
      apiFetch("/api/account"),
      apiFetch("/api/settings")
    ]);
    if (sRes.status === 401) throw new Error("Local desk token rejected (401)");
    if (!sRes.ok) throw new Error(`Local API HTTP ${sRes.status}`);
    const [st, chart, whales, activity, orders, account, settings] = await Promise.all([
      sRes.json(),
      cRes.ok ? cRes.json() : { range: state.range, points: [], marks: [] },
      wRes.ok ? wRes.json() : { whales: [], count: 0 },
      aRes.ok ? aRes.json() : { items: [] },
      oRes.ok ? oRes.json() : { items: [] },
      accRes.ok ? accRes.json() : { mode: "PAPER", cash: st.balance_usd || 36 },
      setRes.ok ? setRes.json() : { settings: {}, ranges: {} }
    ]);
    return {
      schema: "copy-desk-snapshot-v1",
      mode: st.mode || "PAPER",
      source: "local_api",
      updated_at: st.updated_at,
      state: st,
      chart,
      whales,
      activity,
      orders,
      account,
      settings,
      alerts: st.alerts || [],
      signup_url: st.signup_url || account.signup_url,
      fomo_profile_url: st.fomo_profile_url || account.fomo_profile_url
    };
  }

  async function loadGistSnapshot() {
    const url = getDataUrl();
    const res = await fetch(withCacheBust(url));
    if (!res.ok) throw new Error(`Snapshot HTTP ${res.status}`);
    const raw = await res.json();
    if (raw && raw.files && typeof raw.files === "object") {
      const files = Object.values(raw.files);
      const jsonFile = files.find((f) => f && /\.json$/i.test(f.filename || "")) || files[0];
      if (jsonFile && jsonFile.content) return JSON.parse(jsonFile.content);
      if (jsonFile && jsonFile.raw_url) {
        const rr = await fetch(withCacheBust(jsonFile.raw_url));
        if (!rr.ok) throw new Error(`Gist raw HTTP ${rr.status}`);
        return rr.json();
      }
    }
    return raw;
  }

  function renderOdometer(text) {
    const el = $("balance-odometer");
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const prev = state.lastBalanceStr;
    if (!prev || prev === text || reduced) {
      el.textContent = text;
      state.lastBalanceStr = text;
      return;
    }
    el.innerHTML = "";
    const chars = Array.from(text);
    const prevChars = Array.from(prev);
    let delayIdx = 0;
    chars.forEach((ch, idx) => {
      const span = document.createElement("span");
      span.className = "odo-char";
      const inner = document.createElement("span");
      inner.className = "odo-digit-inner";
      inner.textContent = ch;
      if (/[0-9]/.test(ch) && prevChars[idx] !== ch) {
        inner.classList.add("odo-roll");
        inner.style.animationDelay = `${delayIdx * 30}ms`;
        delayIdx += 1;
      }
      span.appendChild(inner);
      el.appendChild(span);
    });
    state.lastBalanceStr = text;
  }

  function filterChartPoints(points, range) {
    if (!Array.isArray(points) || !points.length) return [];
    const now = Date.now();
    const hours = range === "LIVE" || range === "1H" ? 1 : range === "4H" ? 4 : range === "1D" ? 24 : range === "1M" ? 24 * 30 : null;
    if (!hours) return points;
    const cutoff = now - hours * 3600 * 1000;
    const filtered = points.filter((p) => {
      const t = Date.parse(p.ts);
      return Number.isFinite(t) && t >= cutoff;
    });
    return filtered.length ? filtered : points;
  }

  function renderHome(snap) {
    const st = snap.state || {};
    const mode = snap.mode || st.mode || "PAPER";
    const isPaper = mode !== "LIVE";
    $("home-paper-pill").classList.toggle("hidden", !isPaper);
    $("account-mode-pill").classList.toggle("hidden", !isPaper);

    const bal = Number(st.balance_usd ?? 36);
    renderOdometer(fmtMoney(bal));

    const pct = Number(st.today_pct || 0);
    const pctEl = $("today-pct");
    pctEl.textContent = `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
    pctEl.className = `today-pct ${pct >= 0 ? "positive" : "negative"}`;

    const mult = Number(st.multiplier || 1);
    $("multiplier-pill").textContent = `${mult.toFixed(2)}x`;

    const chartDoc = snap.chart || {};
    const rawPts = Array.isArray(chartDoc.points) && chartDoc.points.length
      ? chartDoc.points
      : (st.balance_history || []);
    const pts = activeMode() === "local" ? rawPts : filterChartPoints(rawPts, state.range);
    const hasTrades = Boolean((snap.orders && snap.orders.items && snap.orders.items.length) || (st.open_positions && st.open_positions.length));
    $("chart-empty-hint").classList.toggle("hidden", pts.length > 1 || hasTrades);
    window.drawBalanceChart($("balance-chart"), pts, st.starting_usd || 36, chartDoc.marks || []);

    renderLiveScreenMeta(snap);
    renderBotCarousel(st.bots || []);
    renderHomePositions(st.open_positions || []);
    renderHomeActivity(snap);
  }

  function renderLiveScreenMeta(snap) {
    const st = snap.state || {};
    const frameTs = st.screen_frame_ts || (st.browser && st.browser.last_frame_ts) || snap.updated_at;
    const ageS = frameTs ? (Date.now() - Date.parse(frameTs)) / 1000 : 999;
    const isStub = Boolean((snap.screen && snap.screen.stub) || (st.browser && String(st.browser.status || "").includes("stub")));
    const isFresh = Number.isFinite(ageS) && ageS < 5 && activeMode() === "local" && !isStub;

    const dot = $("live-status-dot");
    const statusTxt = $("live-status-text");
    if (isFresh) {
      dot.className = "status-dot red";
      statusTxt.textContent = "Live · Bot's computer";
    } else {
      dot.className = "status-dot grey";
      statusTxt.textContent = `Last frame ${fmtTime(frameTs)}`;
    }
    $("screen-modal-status").innerHTML = `<span class="${dot.className}"></span><span>${esc(statusTxt.textContent)}</span>`;

    const holder = st.lane_holder || (st.browser && st.browser.holder) || "Idle";
    const laneChip = $("lane-holder-chip");
    laneChip.textContent = holder;
    const lower = holder.toLowerCase();
    const botKey = Object.keys(BOT_COLORS).find((k) => lower.includes(k));
    laneChip.style.color = botKey ? BOT_COLORS[botKey] : "#ffffff";
    $("screen-modal-lane").textContent = holder;
    $("screen-modal-lane").style.color = laneChip.style.color;

    const lastOrder = st.last_order || ((snap.orders && snap.orders.items && snap.orders.items[0]) || null);
    const loText = $("last-order-text");
    const loChecks = $("last-order-checks");
    if (lastOrder) {
      const action = lastOrder.side === "sell" ? "Sold" : "Bought";
      const label = lastOrder.symbol || shortMint(lastOrder.mint);
      const status = lastOrder.status || "verified";
      loText.textContent = `${action} ${label} · ${fmtMoney(lastOrder.fill_usd || lastOrder.usd)} · ${status}`;
      loText.className = "";
      const c = lastOrder.checks || {};
      loChecks.innerHTML = ["screen", "api", "chain"]
        .map((k) => `<span class="check-pill ${c[k] ? "ok" : ""}">${c[k] ? "✓" : "·"} ${k}</span>`)
        .join("");
      state.screenActiveMint = lastOrder.mint || null;
      if (isHttpsUrl(lastOrder.coin_url)) {
        $("screen-fomo-btn").href = lastOrder.coin_url;
        $("screen-fomo-btn").classList.remove("hidden");
      } else {
        $("screen-fomo-btn").classList.add("hidden");
      }
    } else {
      loText.textContent = "No orders yet";
      loText.className = "secondary-text";
      loChecks.innerHTML = "";
      state.screenActiveMint = null;
      $("screen-fomo-btn").classList.add("hidden");
    }

    if (activeMode() === "gist" && snap.screen_svg) {
      setScreenFromSvg(snap.screen_svg);
    }
  }

  function setScreenFromSvg(svgText) {
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    swapScreenImage(url);
  }

  async function refreshLocalScreen() {
    if (activeMode() !== "local") return;
    try {
      const res = await apiFetch(`/api/screen.jpg?_t=${Date.now()}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      swapScreenImage(url);
    } catch {
      // Keep last good frame without flashing.
    }
  }

  function swapScreenImage(newUrl) {
    const preload = new Image();
    preload.onload = () => {
      const prev = state.screenBlobUrl;
      state.screenBlobUrl = newUrl;
      $("live-screen-img").src = newUrl;
      $("screen-modal-img").src = newUrl;
      $("live-screen-img").classList.remove("hidden");
      $("live-screen-fallback").classList.add("hidden");
      if (prev && prev.startsWith("blob:")) {
        setTimeout(() => URL.revokeObjectURL(prev), 250);
      }
    };
    preload.onerror = () => {
      if (newUrl.startsWith("blob:")) URL.revokeObjectURL(newUrl);
    };
    preload.src = newUrl;
  }

  function renderBotCarousel(bots) {
    const running = bots.filter((b) => !b.paused).length;
    $("home-bots-title").textContent = `Bots · ${running} running`;
    const el = $("bots-carousel");
    el.innerHTML = bots.map((b) => {
      const color = BOT_COLORS[b.name] || "#ffffff";
      const d = b.details || {};
      let badge = b.paused ? "Paused" : "Running";
      let body = `<div class="secondary-text small-text">${esc(b.last_decision || "Idle")}</div>`;
      if (b.name === "watcher") {
        badge = `${d.whales_count ?? 0} whales`;
        const lf = d.latest_fill;
        body = lf
          ? `<div class="small-text">@${esc(lf.whale_id)} bought ${esc(shortMint(lf.mint))} · ${fmtMoney(lf.usd)} · ${esc(fmtAgo(lf.ts))}</div>`
          : `<div class="secondary-text small-text">${esc(b.last_decision || "Watching fills")}</div>`;
      } else if (b.name === "vetter") {
        badge = `${d.taken_apart ?? 0} taken apart`;
        const layers = Array.isArray(d.latest_layers) && d.latest_layers.length ? d.latest_layers : new Array(8).fill(null);
        const strips = layers.map((p) => `<span class="layer-strip ${p === true ? "pass" : p === false ? "fail" : ""}"></span>`).join("");
        const score = d.latest_score != null ? Math.round(d.latest_score) : "--";
        const scorePass = Number(d.latest_score) >= 70;
        body = `
          <div class="layer-strips">${strips}</div>
          <div class="vetter-row">
            <span class="secondary-text small-text">${esc(d.social_text || "Social: off")}</span>
            <span class="score-ring ${scorePass ? "pass" : ""}">${esc(score)}</span>
          </div>`;
      } else if (b.name === "sizer") {
        badge = "Sizing";
        body = `
          <div class="small-text">${fmtMoney(d.cash_usd || 36)} cash · ${esc(d.risk_per_trade_pct ?? 3)}% risk</div>
          <div class="secondary-text small-text">${esc(d.full_whales ?? 3)} whales = full size · 1 whale = ${esc(d.one_whale_size ?? 33)}%</div>`;
      } else if (b.name === "executor") {
        badge = `${d.trades_count ?? 0} trades`;
        body = `
          <div class="small-text">Waiting for a dip -${esc(d.dip_pct ?? 12)}%</div>
          <div class="secondary-text small-text">${esc(d.stage || "Idle")}</div>`;
      } else if (b.name === "guard") {
        badge = "Guarding";
        body = `
          <div class="guard-pills">
            <span class="guard-pill red">stop -${esc(d.stop_pct ?? 25)}%</span>
            <span class="guard-pill green">trail ${esc(d.trail_pct ?? 40)}%</span>
            <span class="guard-pill orange">whale out</span>
          </div>`;
      }
      return `
        <div class="bot-mini-card" data-bot="${esc(b.name)}">
          <div class="bot-head">
            <div class="bot-name-row">
              <span class="bot-color-dot" style="background:${color}"></span>
              <span>${esc(BOT_LABELS[b.name] || b.name)}</span>
            </div>
            <span class="mono-pill">${esc(badge)}</span>
          </div>
          ${body}
        </div>`;
    }).join("");
  }

  function renderHomePositions(positions) {
    const block = $("home-positions-block");
    const list = $("home-positions-list");
    if (!positions.length) {
      block.classList.add("hidden");
      list.innerHTML = "";
      return;
    }
    block.classList.remove("hidden");
    list.innerHTML = positions.map((p) => {
      const label = p.symbol || shortMint(p.mint);
      return `
        <div class="ios-row clickable" data-open-coin="${esc(p.mint)}">
          <div class="row-main">
            <div class="row-title">${esc(label)}</div>
            <div class="row-sub">Entry ${fmtMoney(p.size_usd)} · Guard active</div>
          </div>
          <div class="row-right">
            <span class="row-val">${fmtMoney(p.size_usd)}</span>
            ${isHttpsUrl(p.coin_url) ? `<a class="fomo-chip" href="${esc(p.coin_url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Open on FOMO</a>` : ""}
          </div>
        </div>`;
    }).join("");
  }


  function fmtHold(s) {
    if (s == null) return "";
    s = Math.max(0, Math.round(Number(s)));
    if (s < 60) return s + "s";
    const m = Math.floor(s / 60), rem = s % 60;
    if (m < 60) return rem ? `${m}m ${rem}s` : `${m}m`;
    const h = Math.floor(m / 60), mm = m % 60;
    return mm ? `${h}h ${mm}m` : `${h}h`;
  }
  function fmtTsTrade(ts) {
    if (!ts) return "—";
    const n = Number(ts);
    const d = Number.isFinite(n) && n > 1000000000 ? new Date(n > 1e12 ? n : n * 1000) : new Date(ts);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }
  function tradeRowHtml(row) {
    const mode = (row.mode || "PAPER").toUpperCase();
    const badge = `<span class="badge ${mode === "REAL" ? "real" : "paper"}">${mode === "REAL" ? "REAL" : "PAPER"}</span>`;
    const name = row.symbol || shortMint(row.mint) || "coin";
    const pnl = row.pnl_usd == null ? "" : `${Number(row.pnl_usd) >= 0 ? "+" : "-"}$${Math.abs(Number(row.pnl_usd)).toFixed(2)}` + (row.pnl_pct != null ? ` (${Number(row.pnl_pct) >= 0 ? "+" : ""}${Number(row.pnl_pct).toFixed(0)}%)` : "");
    const bits = [`buy ${fmtTsTrade(row.buy_at)}`];
    if (row.buy_price != null) bits[0] += ` @${Number(row.buy_price).toPrecision(4)}`;
    if (row.state === "closed") {
      let s = `sell ${fmtTsTrade(row.sell_at)}`;
      if (row.sell_price != null) s += ` @${Number(row.sell_price).toPrecision(4)}`;
      bits.push(s);
    }
    const held = fmtHold(row.hold_s);
    if (held) bits.push(`held ${held}`);
    if (row.exit_reason) bits.push(row.exit_reason);
    const val = row.state === "open" ? "open" : (pnl || "—");
    const valClass = (row.state === "closed" && row.pnl_usd != null) ? (Number(row.pnl_usd) >= 0 ? "positive" : "negative") : "";
    const mint = row.mint || "";
    return `
      <div class="ios-row ${mint ? "clickable" : ""}" ${mint ? `data-open-coin="${esc(mint)}"` : ""}>
        <div class="row-main">
          <div class="row-title">${badge}${esc(name)} <span class="secondary-text">${esc(row.state || "")}</span></div>
          <div class="row-sub">${esc(bits.join(" · "))}</div>
        </div>
        <div class="row-right">
          <span class="row-val ${valClass}">${esc(val)}</span>
          ${isHttpsUrl(row.coin_url) ? `<a class="fomo-chip" href="${esc(row.coin_url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Open on FOMO</a>` : ""}
        </div>
      </div>`;
  }
  function tradesFromSnap(snap) {
    const doc = (snap && snap.trades) || {};
    return doc.items || doc.rows || doc.trades || [];
  }
  function filteredTradeItems(items) {
    return (items || []).filter((row) => {
      if (tradeFilterMode !== "all" && (row.mode || "PAPER").toUpperCase() !== tradeFilterMode) return false;
      if (tradeFilterState !== "all" && (row.state || "") !== tradeFilterState) return false;
      return true;
    });
  }

  function activityRowHtml(item) {
    const kind = (item.kind || "").toLowerCase();
    const mint = item.mint || item.subtitle;
    const isTrade = kind === "bought" || kind === "sold" || kind === "stopped" || kind === "exited" || kind === "copied";
    const actionAttr = kind === "rejected"
      ? `data-open-audit="${esc(mint)}"`
      : (isTrade && mint ? `data-open-coin="${esc(mint)}"` : "");
    const title = item.title || item.kind || "Event";
    const sub = item.subtitle ? `${shortMint(item.subtitle)} · ${fmtAgo(item.ts)}` : fmtAgo(item.ts);
    const val = item.value || (kind === "rejected" ? "Skipped" : "");
    const valClass = val.startsWith("+") ? "positive" : val.startsWith("-") ? "negative" : "";
    return `
      <div class="ios-row ${actionAttr ? "clickable" : ""}" ${actionAttr}>
        <div class="row-main">
          <div class="row-title">${esc(title)}</div>
          <div class="row-sub">${esc(sub)}</div>
        </div>
        <div class="row-right">
          <span class="row-val ${valClass}">${esc(val)}</span>
          ${isHttpsUrl(item.coin_url) ? `<a class="fomo-chip" href="${esc(item.coin_url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Open on FOMO</a>` : ""}
        </div>
      </div>`;
  }

  function renderHomeActivity(snap) {
    const el = $("home-activity-list");
    const items = filteredTradeItems(tradesFromSnap(snap));
    if (!items.length) {
      el.innerHTML = `<div class="empty-box">Waiting for the first trade</div>`;
      return;
    }
    el.innerHTML = items.slice(0, 5).map(tradeRowHtml).join("");
  }

  function renderWhalesTab(snap) {
    const wdoc = snap.whales || {};
    const list = wdoc.whales || [];
    const st = snap.state || {};
    $("whales-count-pill").textContent = `${st.whales_online ?? list.length} online`;
    const el = $("whales-list");
    if (!list.length) {
      el.innerHTML = `<div class="empty-box">List builds at night start</div>`;
      return;
    }
    el.innerHTML = list.map((w) => {
      const handle = w.handle || w.user_id;
      const pnl = Number(w.pnl_7d || 0);
      const wr = w.win_rate != null ? `${Number(w.win_rate).toFixed(0)}% win` : "--";
      const lf = w.last_fill
        ? `${w.last_fill.side === "sell" ? "sold" : "bought"} ${shortMint(w.last_fill.mint)} · ${fmtAgo(w.last_fill.ts)}`
        : "No fill tonight";
      return `
        <div class="ios-row clickable" data-open-whale="${esc(w.user_id)}">
          <div class="row-main">
            <div class="row-title">#${esc(w.rank ?? "-")} @${esc(handle)}</div>
            <div class="row-sub">${esc(lf)} · ${esc(wr)}</div>
          </div>
          <div class="row-right" style="flex-direction:row;align-items:center;gap:10px;">
            <span class="row-val ${pnl >= 0 ? "positive" : "negative"}">${pnl >= 0 ? "+" : ""}${fmtMoney(pnl)}</span>
            <button class="switch ${w.muted ? "" : "on"}" type="button" data-mute-whale="${esc(w.user_id)}" data-muted="${w.muted ? "1" : "0"}" aria-label="Toggle mute" onclick="event.stopPropagation()">
              <span class="switch-knob"></span>
            </button>
          </div>
        </div>`;
    }).join("");
  }

  async function renderBotsTab(snap) {
    const bots = (snap.state && snap.state.bots) || [];
    const openPositions = (snap.state && snap.state.open_positions) || [];
    const container = $("bots-full-list");
    const decisionsByBot = {};
    if (activeMode() === "local") {
      const results = await Promise.all(
        bots.map(async (b) => {
          try {
            const r = await apiFetch(`/api/bots/${encodeURIComponent(b.name)}/decisions`);
            return r.ok ? [b.name, (await r.json()).decisions || []] : [b.name, []];
          } catch {
            return [b.name, []];
          }
        })
      );
      results.forEach(([k, v]) => { decisionsByBot[k] = v; });
    } else {
      const bd = snap.bots_decisions || {};
      bots.forEach((b) => {
        decisionsByBot[b.name] = (bd[b.name] && bd[b.name].decisions) || [];
      });
    }

    container.innerHTML = bots.map((b) => {
      const color = BOT_COLORS[b.name] || "#ffffff";
      const guardLocked = b.name === "guard" && openPositions.length > 0;
      const decs = decisionsByBot[b.name] || [];
      const decHtml = decs.length
        ? decs.slice(0, 20).map((d) => `
            <div class="kv-row">
              <div class="row-main">
                <div class="small-text">${esc(d.title)}</div>
                <div class="tertiary-text small-text">${esc(d.value || "")} · ${esc(fmtAgo(d.ts))}</div>
              </div>
              ${isHttpsUrl(d.coin_url) ? `<a class="fomo-chip" href="${esc(d.coin_url)}" target="_blank" rel="noopener noreferrer">Open on FOMO</a>` : ""}
            </div>`).join("")
        : `<div class="tertiary-text small-text">No decisions yet tonight</div>`;
      return `
        <div class="card">
          <div class="card-head-row">
            <div class="bot-name-row">
              <span class="bot-color-dot" style="background:${color}"></span>
              <span>${esc(BOT_LABELS[b.name] || b.name)}</span>
              <span class="mono-pill">${esc(b.today_count || 0)} today</span>
            </div>
            <button class="switch ${b.paused ? "" : "on"} ${guardLocked ? "locked" : ""}" type="button" data-toggle-bot="${esc(b.name)}" data-paused="${b.paused ? "1" : "0"}" aria-label="Pause or resume ${esc(b.name)}">
              <span class="switch-knob"></span>
            </button>
          </div>
          <div class="secondary-text small-text" style="margin-bottom:8px;">
            ${b.paused ? "Paused" : "Active"} · heartbeat ${esc(fmtAgo(b.heartbeat))}${guardLocked ? " · locked while position open" : ""}
          </div>
          <div>${decHtml}</div>
        </div>`;
    }).join("");
  }

  function renderActivityTab(snap) {
    const items = filteredTradeItems(tradesFromSnap(snap));
    $("activity-count-pill").textContent = String(items.length);
    const el = $("activity-full-list");
    if (!items.length) {
      el.innerHTML = `<div class="empty-box">No trades match these filters</div>`;
      return;
    }
    el.innerHTML = items.map(tradeRowHtml).join("");
  }

  function renderAccountTab(snap) {
    const acc = snap.account || {};
    const st = snap.state || {};
    const mode = snap.mode || acc.mode || "PAPER";
    $("mode-paper-btn").classList.toggle("active", mode !== "LIVE");
    $("mode-live-btn").classList.toggle("active", mode === "LIVE");
    $("account-cash").textContent = fmtMoney(acc.cash ?? st.paper_cash_usd ?? st.balance_usd ?? 36);
    const gate = snap.live_gate || acc.live_gate || {};
    const gateReasons = gate.reasons || [];
    $("account-gate-summary").textContent = gate.ready
      ? "Gate ready · type LIVE to flip"
      : `Locked (${gateReasons.length}): ${gateReasons[0] || "gate not met"}`;
    $("account-gate-summary").className = gate.ready ? "green-text small-text" : "tertiary-text small-text";

    const profEl = $("account-profile-link");
    if (isHttpsUrl(acc.fomo_profile_url || snap.fomo_profile_url)) {
      const url = acc.fomo_profile_url || snap.fomo_profile_url;
      profEl.innerHTML = `<a class="link-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">@${esc(acc.fomo_handle || "profile")}</a>`;
    } else {
      profEl.textContent = "Set fomo_handle first";
    }

    const push = acc.push || {};
    const bits = [];
    bits.push(push.telegram_connected ? "Telegram connected" : (push.telegram_token_set ? "Telegram: tap /start in bot" : "Telegram: waiting for token"));
    if (push.webpush_subs > 0) bits.push(`Web push (${push.webpush_subs})`);
    $("push-status-text").textContent = bits.join(" · ");

    const settingsDoc = snap.settings || {};
    const cfg = settingsDoc.settings || {};
    const ranges = settingsDoc.ranges || {};
    if (cfg.copy_picks_freq) $("copy-picks-freq").value = cfg.copy_picks_freq;
    if (cfg.copy_picks_time) $("copy-picks-time").value = cfg.copy_picks_time;

    const readOnly = activeMode() !== "local";
    $("settings-mode-note").textContent = readOnly ? "Read-only via gist" : "Saved live to desk";
    $("conn-source-label").textContent = activeMode() === "local" ? "Local API (APP_TOKEN)" : "Secret gist snapshot";

    const pendingSuggestions = settingsDoc.pending_suggestions || acc.pending_suggestions || cfg.pending_suggestions || [];
    $("suggestions-count-pill").textContent = String(pendingSuggestions.length);
    const sugEl = $("pending-suggestions-list");
    if (!pendingSuggestions.length) {
      sugEl.innerHTML = `<div class="empty-box">No pending suggestions</div>`;
    } else {
      sugEl.innerHTML = pendingSuggestions.map((s) => {
        const valLine = s.kind === "mute_whale"
          ? `Mute @${esc(s.handle || s.whale_id)}`
          : `${esc(s.key)}: ${esc(s.current_value)} → ${esc(s.suggested_value)}`;
        return `
          <div class="setting-item">
            <div class="setting-top">
              <div>
                <div class="small-text">${esc(s.label || valLine)}</div>
                <div class="tertiary-text small-text">${esc(valLine)} · ${esc(s.reason || "")}</div>
              </div>
              <div class="row-btns">
                <button class="pill-btn" type="button" data-approve-suggestion="${esc(s.id)}" ${readOnly ? "disabled" : ""}>Approve</button>
                <button class="pill-btn secondary" type="button" data-dismiss-suggestion="${esc(s.id)}" ${readOnly ? "disabled" : ""}>Dismiss</button>
              </div>
            </div>
          </div>`;
      }).join("");
    }

    const groupsEl = $("settings-groups");
    const withdrawSet = !!(cfg.withdraw_address || (snap.account && snap.account.withdraw_address_set));
    groupsEl.innerHTML = SETTINGS_GROUPS.map((g) => {
      const itemsHtml = (g.fields || []).map((field) => {
        const key = field.key;
        const val = cfg[key];
        const r = ranges[key] || { min: 0, max: 100 };
        const step = FLOAT_STEPS[key] || (Number(r.max) >= 100000 ? "1000" : Number(r.max) <= 5 ? "0.1" : "1");
        if (field.type === "number") {
          return `
            <div class="setting-item">
              <div class="setting-top">
                <div>
                  <div class="small-text">${esc(field.label)}</div>
                  <div class="tertiary-text small-text">${esc(key)} · ${esc(r.min)} – ${esc(r.max)}</div>
                </div>
                <input class="num-input" type="number" step="${step}" min="${esc(r.min)}" max="${esc(r.max)}" value="${esc(val ?? "")}" data-setting-num="${esc(key)}" ${readOnly ? "disabled" : ""} />
              </div>
              <input class="setting-range" type="range" step="${step}" min="${esc(r.min)}" max="${esc(r.max)}" value="${esc(val ?? r.min)}" data-setting-range="${esc(key)}" ${readOnly ? "disabled" : ""} />
            </div>`;
        }
        if (field.type === "time") {
          return `
            <div class="setting-item">
              <div class="setting-top">
                <div>
                  <div class="small-text">${esc(field.label)}</div>
                  <div class="tertiary-text small-text">${esc(key)} · HH:MM</div>
                </div>
                <input class="time-input" type="time" value="${esc(val || "")}" data-setting-text="${esc(key)}" ${readOnly ? "disabled" : ""} />
              </div>
            </div>`;
        }
        if (field.type === "select") {
          const opts = (field.options || []).map((o) => `<option value="${esc(o)}" ${String(val) === o ? "selected" : ""}>${esc(o)}</option>`).join("");
          return `
            <div class="setting-item">
              <div class="setting-top">
                <div>
                  <div class="small-text">${esc(field.label)}</div>
                  <div class="tertiary-text small-text">${esc(key)}</div>
                </div>
                <select class="select-input" data-setting-text="${esc(key)}" ${readOnly ? "disabled" : ""}>${opts}</select>
              </div>
            </div>`;
        }
        if (field.type === "bool") {
          const on = val === true || val === "true" || val === 1 || val === "1";
          return `
            <div class="setting-item">
              <div class="setting-top">
                <div>
                  <div class="small-text">${esc(field.label)}</div>
                  <div class="tertiary-text small-text">${esc(key)}</div>
                </div>
                <button class="switch ${on ? "on" : ""}" type="button" data-setting-bool="${esc(key)}" data-on="${on ? "1" : "0"}" ${readOnly ? "disabled" : ""} aria-label="${esc(field.label)}">
                  <span class="switch-knob"></span>
                </button>
              </div>
            </div>`;
        }
        if (field.type === "secret") {
          const shown = readOnly ? (withdrawSet ? "Set" : "Not set") : (val || "");
          return `
            <div class="setting-item">
              <div class="setting-top">
                <div>
                  <div class="small-text">${esc(field.label)}</div>
                  <div class="tertiary-text small-text">${esc(key)}${readOnly ? " · hidden on the phone snapshot" : ""}</div>
                </div>
                <input class="text-input" type="${readOnly ? "text" : "password"}" autocomplete="off" value="${esc(shown)}" data-setting-secret="${esc(key)}" ${readOnly ? "disabled" : ""} placeholder="${readOnly ? "" : "Paste address"}" />
              </div>
            </div>`;
        }
        return `
          <div class="setting-item">
            <div class="setting-top">
              <div>
                <div class="small-text">${esc(field.label)}</div>
                <div class="tertiary-text small-text">${esc(key)}</div>
              </div>
              <input class="text-input" type="text" value="${esc(val ?? "")}" data-setting-text="${esc(key)}" ${readOnly ? "disabled" : ""} />
            </div>
          </div>`;
      }).join("");
      return `
        <div class="settings-group">
          <div class="settings-group-title">${esc(g.label)}</div>
          ${itemsHtml}
        </div>`;
    }).join("");
  }

  async function openCoinModal(mint) {
    if (!mint) return;
    state.activeCoinMint = mint;
    let doc = null;
    if (activeMode() === "local") {
      try {
        const res = await apiFetch(`/api/coin/${encodeURIComponent(mint)}`);
        if (res.ok) doc = await res.json();
      } catch {
        doc = null;
      }
    } else if (state.snap && state.snap.coins && state.snap.coins[mint]) {
      doc = state.snap.coins[mint];
    }
    doc = doc || { mint, mode: "PAPER", candles: [], whales: [], audit_summary: { passed: 0, total: 0 } };

    const isPaper = (doc.mode || "PAPER") !== "LIVE";
    $("coin-paper-pill").classList.toggle("hidden", !isPaper);
    $("coin-title").textContent = doc.symbol || doc.name || shortMint(mint);
    $("coin-subtitle").textContent = `${shortMint(mint)} · Solana`;
    const audSum = doc.audit_summary || {};
    $("coin-shield-btn").textContent = `${audSum.passed ?? 0}/${audSum.total || 8}`;
    $("coin-shield-btn").onclick = () => {
      $("coin-modal").classList.add("hidden");
      openAuditModal(mint);
    };

    $("coin-price").textContent = doc.price_usd ? `$${Number(doc.price_usd).toPrecision(5)}` : "--";
    const pos = doc.position;
    if (pos && pos.entry_price && doc.price_usd) {
      const pct = ((Number(doc.price_usd) - Number(pos.entry_price)) / Number(pos.entry_price)) * 100;
      $("coin-delta").textContent = `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(2)}% since entry`;
      $("coin-delta").className = `coin-delta ${pct >= 0 ? "positive" : "negative"}`;
    } else {
      $("coin-delta").textContent = doc.note || "No entry yet";
      $("coin-delta").className = "coin-delta secondary-text";
    }

    const candles = doc.candles || [];
    $("coin-chart-empty").classList.toggle("hidden", candles.length > 0);
    window.drawCoinCandles($("coin-chart"), candles, pos, doc.stop_price, doc.whales || []);

    const latestCandle = candles.length ? candles[candles.length - 1] : null;
    $("coin-mcap").textContent = doc.market_cap ? fmtCompact(doc.market_cap) : "--";
    $("coin-liq").textContent = latestCandle && latestCandle.volume_m5 ? fmtCompact(latestCandle.volume_m5) : "--";
    $("coin-holders").textContent = doc.holders != null ? String(doc.holders) : "--";

    const posCard = $("coin-position-card");
    if (pos) {
      posCard.classList.remove("hidden");
      posCard.innerHTML = `<div class="kv-row"><span>Your position · ${fmtMoney(pos.size_usd)} in · Executor</span><span class="mono-pill">Stop ${doc.stop_price ? `$${Number(doc.stop_price).toPrecision(4)}` : "--"}</span></div>`;
      $("coin-sell-btn").classList.remove("hidden");
    } else {
      posCard.classList.add("hidden");
      $("coin-sell-btn").classList.add("hidden");
    }
    $("sell-sheet").classList.add("hidden");

    const fomoBtn = $("coin-fomo-btn");
    if (isHttpsUrl(doc.coin_url)) {
      fomoBtn.href = doc.coin_url;
      fomoBtn.classList.remove("hidden");
    } else {
      fomoBtn.classList.add("hidden");
    }
    $("coin-modal").classList.remove("hidden");
  }

  async function openAuditModal(mint) {
    if (!mint) return;
    let doc = null;
    if (activeMode() === "local") {
      try {
        const res = await apiFetch(`/api/audit/${encodeURIComponent(mint)}`);
        if (res.ok) doc = await res.json();
      } catch {
        doc = null;
      }
    } else if (state.snap && state.snap.audits && state.snap.audits[mint]) {
      doc = state.snap.audits[mint];
    }
    doc = doc || { mint, layers: [], whales: [], social: "Social: off" };
    $("audit-title").textContent = `Audit · ${shortMint(mint)}`;
    const link = $("audit-fomo-link");
    if (isHttpsUrl(doc.coin_url)) {
      link.href = doc.coin_url;
      link.classList.remove("hidden");
    } else {
      link.classList.add("hidden");
    }

    const layers = doc.layers || [];
    const discsEl = $("audit-discs");
    const slots = new Array(8).fill(null).map((_, idx) => layers[idx] || { n: idx + 1, name: `Layer ${idx + 1}`, pass: null, value: "--" });
    discsEl.innerHTML = slots.map((l, idx) => {
      const cls = l.pass === true ? "pass" : l.pass === false ? "fail" : "";
      const sym = l.pass === true ? "✓" : l.pass === false ? "✕" : String(idx + 1);
      return `<div class="audit-disc ${cls}">${sym}</div>`;
    }).join("");

    $("audit-layers-list").innerHTML = layers.length
      ? layers.map((l) => `
          <div class="ios-row">
            <div class="row-main">
              <div class="row-title">${esc(l.name)}</div>
              <div class="row-sub">${esc(l.source || "audit")}</div>
            </div>
            <div class="row-right">
              <span class="row-val ${l.pass ? "positive" : "negative"}">${l.pass ? "✓" : "✕"} ${esc(l.value || "--")}</span>
            </div>
          </div>`).join("")
      : `<div class="empty-box">No 8-layer audit recorded for ${esc(shortMint(mint))} yet</div>`;

    const whales = doc.whales || [];
    $("audit-whales-row").innerHTML = `<span>Whales</span><span class="secondary-text">${whales.length ? whales.map((w) => `@${esc(w.handle)}`).join(" ") : "None recorded"}</span>`;
    $("audit-social-row").innerHTML = `<span>Social</span><span class="secondary-text">${esc(doc.social || "Social: off")}</span>`;
    $("audit-modal").classList.remove("hidden");
  }

  function openWhaleModal(userId) {
    const whales = (state.snap && state.snap.whales && state.snap.whales.whales) || [];
    const w = whales.find((x) => String(x.user_id) === String(userId));
    if (!w) return;
    $("whale-modal-title").textContent = `@${w.handle || w.user_id}`;
    const link = $("whale-profile-link");
    if (isHttpsUrl(w.profile_url)) {
      link.href = w.profile_url;
      link.classList.remove("hidden");
    } else {
      link.classList.add("hidden");
    }
    const fills = w.fills || [];
    $("whale-fills-list").innerHTML = fills.length
      ? fills.slice(0, 20).map((f) => `
          <div class="ios-row">
            <div class="row-main">
              <div class="row-title">${esc(f.side || "buy")} ${esc(shortMint(f.mint))}</div>
              <div class="row-sub">${fmtMoney(f.usd)} · ${esc(fmtAgo(f.ts))}</div>
            </div>
            <div class="row-right">
              ${isHttpsUrl(f.coin_url) ? `<a class="fomo-chip" href="${esc(f.coin_url)}" target="_blank" rel="noopener noreferrer">Open on FOMO</a>` : ""}
            </div>
          </div>`).join("")
      : `<div class="empty-box">No recorded fills for this whale yet</div>`;
    $("whale-modal").classList.remove("hidden");
  }

  function runSearch(query) {
    const q = (query || "").trim().toLowerCase();
    const out = $("search-results");
    if (!q || !state.snap) {
      out.innerHTML = "";
      return;
    }
    const matches = [];
    const coins = state.snap.coins || {};
    Object.values(coins).forEach((c) => {
      const hay = `${c.mint || ""} ${c.symbol || ""} ${c.name || ""}`.toLowerCase();
      if (hay.includes(q)) matches.push({ kind: "coin", title: c.symbol || shortMint(c.mint), sub: shortMint(c.mint), mint: c.mint });
    });
    const whales = (state.snap.whales && state.snap.whales.whales) || [];
    whales.forEach((w) => {
      const hay = `${w.handle || ""} ${w.user_id || ""}`.toLowerCase();
      if (hay.includes(q)) matches.push({ kind: "whale", title: `@${w.handle || w.user_id}`, sub: "Whale", user_id: w.user_id });
    });
    const acts = (state.snap.activity && state.snap.activity.items) || [];
    acts.forEach((a) => {
      const hay = `${a.title || ""} ${a.subtitle || ""}`.toLowerCase();
      if (hay.includes(q) && matches.length < 8) {
        matches.push({ kind: "activity", title: a.title || "Activity", sub: shortMint(a.subtitle), mint: a.subtitle });
      }
    });
    out.innerHTML = matches.length
      ? matches.slice(0, 8).map((m) => `
          <div class="ios-row clickable" style="background:var(--card);border-radius:12px;" ${m.mint ? `data-open-coin="${esc(m.mint)}"` : `data-open-whale="${esc(m.user_id)}"`}>
            <div class="row-main"><div class="row-title">${esc(m.title)}</div><div class="row-sub">${esc(m.sub)}</div></div>
          </div>`).join("")
      : `<div class="secondary-text small-text">No matches in current desk data</div>`;
  }

  function switchTab(tab) {
    state.tab = tab;
    ["home", "whales", "bots", "activity", "account"].forEach((name) => {
      $(`tab-${name}`).classList.toggle("hidden", name !== tab);
    });
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });
    if (state.snap) {
      if (tab === "home") renderHome(state.snap);
      if (tab === "whales") renderWhalesTab(state.snap);
      if (tab === "bots") renderBotsTab(state.snap);
      if (tab === "activity") renderActivityTab(state.snap);
      if (tab === "account") renderAccountTab(state.snap);
    }
  }

  function setErrorBanner(show) {
    const el = $("error-banner");
    if (!show) {
      el.classList.add("hidden");
      clearInterval(state.retryTimer);
      return;
    }
    const lastStr = state.lastGoodUpdateAt ? fmtTime(state.lastGoodUpdateAt) : "--";
    el.textContent = `Desk offline - retrying in ${state.retryIn}s - last update ${lastStr}`;
    el.classList.remove("hidden");
  }

  async function refreshAll() {
    const mode = activeMode();
    if (mode === "none") {
      $("loading-view").classList.add("hidden");
      $("setup-panel").classList.remove("hidden");
      return;
    }
    $("setup-panel").classList.add("hidden");
    try {
      const snap = mode === "local" ? await loadLocalSnapshot() : await loadGistSnapshot();
      state.snap = snap;
      state.lastGoodUpdateAt = snap.updated_at || new Date().toISOString();
      state.retryIn = 0;
      setErrorBanner(false);
      $("loading-view").classList.add("hidden");
      const alerts = snap.alerts || (snap.state && snap.state.alerts) || [];
      $("bell-dot").classList.toggle("hidden", alerts.length === 0);
      switchTab(state.tab);
      if (mode === "local") await refreshLocalScreen();
    } catch {
      if (!state.snap) {
        $("loading-view").classList.add("hidden");
      }
      state.retryIn = activeMode() === "local" ? 5 : 15;
      setErrorBanner(true);
      clearInterval(state.retryTimer);
      state.retryTimer = setInterval(() => {
        if (state.retryIn > 1) {
          state.retryIn -= 1;
          setErrorBanner(true);
        }
      }, 1000);
    }
  }

  function startSseStream() {
    if (activeMode() !== "local") return;
    if (state.sseAbort) state.sseAbort.abort();
    const ctrl = new AbortController();
    state.sseAbort = ctrl;
    (async () => {
      try {
        const res = await apiFetch("/api/stream", { signal: ctrl.signal });
        if (!res.ok || !res.body) return;
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          if (buf.includes("\n\n")) {
            const parts = buf.split("\n\n");
            buf = parts.pop() || "";
            if (parts.some((chunk) => chunk.includes("event:"))) {
              refreshAll();
            }
          }
        }
      } catch {
        // Reconnected by periodic polling if closed.
      }
    })();
  }

  function startLoops() {
    clearInterval(state.pollTimer);
    clearInterval(state.screenTimer);
    const mode = activeMode();
    if (mode === "local") {
      state.pollTimer = setInterval(refreshAll, 5000);
      state.screenTimer = setInterval(refreshLocalScreen, 1000);
      startSseStream();
    } else if (mode === "gist") {
      state.pollTimer = setInterval(refreshAll, 15000);
    }
  }

  async function saveSetting(key, value) {
    if (activeMode() !== "local") {
      showToast("Read-only via gist — edit on local desk or Telegram");
      return;
    }
    const res = await apiFetch("/api/settings", {
      method: "POST",
      body: JSON.stringify({ [key]: value })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || "Setting rejected");
      return;
    }
    showToast(`Saved ${key}`);
    refreshAll();
  }

  function bindEvents() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
    $("nav-avatar").addEventListener("click", () => switchTab("account"));
    $("home-see-bots").addEventListener("click", () => switchTab("bots"));
    $("home-see-activity").addEventListener("click", () => switchTab("activity"));
    const tradeFilters = $("trade-filters");
    if (tradeFilters) {
      tradeFilters.addEventListener("click", (e) => {
        const btn = e.target.closest("button.chip");
        if (!btn) return;
        if (btn.dataset.filterMode) {
          tradeFilterMode = btn.dataset.filterMode;
          tradeFilters.querySelectorAll("[data-filter-mode]").forEach((b) => b.classList.toggle("is-on", b === btn));
        }
        if (btn.dataset.filterState) {
          tradeFilterState = btn.dataset.filterState;
          tradeFilters.querySelectorAll("[data-filter-state]").forEach((b) => b.classList.toggle("is-on", b === btn));
        }
        if (state.snap) renderActivityTab(state.snap);
        if (state.snap) renderHomeActivity(state.snap);
      });
    }
    $("bots-settings-shortcut").addEventListener("click", () => switchTab("account"));

    $("nav-search-btn").addEventListener("click", () => {
      $("search-drawer").classList.toggle("hidden");
      if (!$("search-drawer").classList.contains("hidden")) $("search-input").focus();
    });
    $("search-clear").addEventListener("click", () => {
      $("search-input").value = "";
      $("search-results").innerHTML = "";
      $("search-drawer").classList.add("hidden");
    });
    $("search-input").addEventListener("input", (e) => runSearch(e.target.value));

    $("nav-bell-btn").addEventListener("click", () => {
      const alerts = (state.snap && (state.snap.alerts || (state.snap.state && state.snap.state.alerts))) || [];
      $("alerts-list").innerHTML = alerts.length
        ? alerts.map((a) => `
            <div class="ios-row">
              <div class="row-main"><div class="row-title">${esc(a.title || a.level || "Alert")}</div><div class="row-sub">${esc(a.reason || "")} · ${esc(fmtAgo(a.ts))}</div></div>
            </div>`).join("")
        : `<div class="empty-box">No alerts tonight</div>`;
      $("alerts-modal").classList.remove("hidden");
    });
    $("alerts-close").addEventListener("click", () => $("alerts-modal").classList.add("hidden"));

    document.querySelectorAll(".range-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.range = btn.dataset.range;
        document.querySelectorAll(".range-btn").forEach((b) => b.classList.toggle("active", b === btn));
        refreshAll();
      });
    });

    const openLiveModal = () => {
      state.screenZoom = 1;
      $("screen-modal-img").style.transform = "scale(1)";
      $("screen-modal").classList.remove("hidden");
    };
    $("live-screen-card").addEventListener("click", openLiveModal);
    $("watch-grok-btn").addEventListener("click", openLiveModal);
    $("screen-close").addEventListener("click", () => $("screen-modal").classList.add("hidden"));
    $("zoom-in-btn").addEventListener("click", () => {
      state.screenZoom = Math.min(3, +(state.screenZoom + 0.5).toFixed(1));
      $("screen-modal-img").style.transform = `scale(${state.screenZoom})`;
    });
    $("zoom-out-btn").addEventListener("click", () => {
      state.screenZoom = Math.max(1, +(state.screenZoom - 0.5).toFixed(1));
      $("screen-modal-img").style.transform = `scale(${state.screenZoom})`;
    });
    $("zoom-reset-btn").addEventListener("click", () => {
      state.screenZoom = 1;
      $("screen-modal-img").style.transform = "scale(1)";
    });

    $("coin-close").addEventListener("click", () => $("coin-modal").classList.add("hidden"));
    $("audit-close").addEventListener("click", () => $("audit-modal").classList.add("hidden"));
    $("whale-close").addEventListener("click", () => $("whale-modal").classList.add("hidden"));
    $("live-close").addEventListener("click", () => $("live-modal").classList.add("hidden"));

    $("coin-sell-btn").addEventListener("click", () => {
      $("sell-sheet").classList.toggle("hidden");
    });
    document.querySelectorAll(".pct-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.sellPct = Number(btn.dataset.pct || 100);
        document.querySelectorAll(".pct-btn").forEach((b) => b.classList.toggle("active", b === btn));
        $("confirm-sell-btn").textContent = `Confirm sell ${state.sellPct}%`;
      });
    });
    $("confirm-sell-btn").addEventListener("click", async () => {
      if (activeMode() !== "local") {
        showToast("Read-only via gist — sell from local desk or Telegram");
        return;
      }
      if (!state.activeCoinMint) return;
      const res = await apiFetch(`/api/sell/${encodeURIComponent(state.activeCoinMint)}`, {
        method: "POST",
        body: JSON.stringify({ pct: state.sellPct, confirm: true })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Sell refused");
        return;
      }
      showToast(`Sold ${state.sellPct}%`);
      $("coin-modal").classList.add("hidden");
      refreshAll();
    });

    function renderLiveGateModal() {
      const gate = (state.snap && (state.snap.live_gate || (state.snap.account && state.snap.account.live_gate))) || {};
      const checks = gate.checks || {};
      const rows = [
        ["full_paper_night", "At least 1 full PAPER night in db"],
        ["step15_passed", "Step 15 acceptance (11 checks) passed"],
        ["fomo_quote_loaded_verified", "FOMO Buy quote_loaded verified"],
        ["fomo_done_after_trade_verified", "FOMO done_after_trade verified"],
        ["whales_approved", "Vetted whales approved by you"],
        ["live_ticket_cap_ok", "First 3 LIVE nights max_ticket_usd <= $50"],
      ];
      $("live-gate-list").innerHTML = rows.map(([k, label]) => {
        const ok = !!checks[k];
        return `<div class="ios-row"><span class="small-text">${esc(label)}</span><span class="small-text ${ok ? "green-text" : "red-text"}">${ok ? "Pass" : "Locked"}</span></div>`;
      }).join("");
    }
    $("mode-live-btn").addEventListener("click", () => {
      renderLiveGateModal();
      $("live-confirm-input").value = "";
      $("live-refusal-msg").classList.add("hidden");
      $("live-modal").classList.remove("hidden");
    });
    $("live-submit-btn").addEventListener("click", async () => {
      const val = $("live-confirm-input").value.trim();
      if (val !== "LIVE") {
        $("live-refusal-msg").textContent = "Type LIVE exactly to continue.";
        $("live-refusal-msg").classList.remove("hidden");
        return;
      }
      if (activeMode() !== "local") {
        $("live-refusal-msg").textContent = "LIVE stays off. Flip it yourself in Step 13.";
        $("live-refusal-msg").classList.remove("hidden");
        return;
      }
      const res = await apiFetch("/api/mode", {
        method: "POST",
        body: JSON.stringify({ mode: "LIVE", confirm: "LIVE", from_account: true })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok && data.mode === "LIVE") {
        $("live-modal").classList.add("hidden");
        showToast("Switched to LIVE");
        refreshAll();
        return;
      }
      $("live-refusal-msg").textContent = data.message || "gate not met";
      $("live-refusal-msg").classList.remove("hidden");
    });

    $("invite-friend-btn").addEventListener("click", async () => {
      const url = (state.snap && (state.snap.signup_url || (state.snap.account && state.snap.account.signup_url))) || "";
      if (!isHttpsUrl(url)) {
        showToast("Invite link unavailable");
        return;
      }
      if (navigator.share) {
        try {
          await navigator.share({ title: "FOMO Copy Desk", url });
          return;
        } catch {
          // User canceled or unsupported; fall back to copy.
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        showToast("Link copied");
      } catch {
        showToast("Copy unavailable");
      }
    });

    function urlB64ToUint8Array(base64String) {
      const pad = "=".repeat((4 - (base64String.length % 4)) % 4);
      const b64 = (base64String + pad).replace(/-/g, "+").replace(/_/g, "/");
      const raw = atob(b64);
      const out = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
      return out;
    }

    $("enable-push-btn").addEventListener("click", async () => {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        showToast("Telegram pushes active once bot token + /start are set");
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        showToast("Browser notifications denied — Telegram will still push");
        return;
      }
      if (activeMode() !== "local") {
        showToast("Allowed on device · subscribe via local desk or use Telegram");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const vRes = await apiFetch("/api/push/vapid");
        const vData = await vRes.json().catch(() => ({}));
        if (!vRes.ok || !vData.public_key || !reg.pushManager) {
          showToast("Push manager unavailable here — Telegram pushes active");
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(vData.public_key)
        });
        const saveRes = await apiFetch("/api/push", {
          method: "POST",
          body: JSON.stringify({ subscription: sub.toJSON() })
        });
        showToast(saveRes.ok ? "Web push enabled" : "Could not save push subscription");
        refreshAll();
      } catch {
        showToast("Home-screen PWA required for Web Push — Telegram active");
      }
    });

    $("test-push-btn").addEventListener("click", async () => {
      if (activeMode() !== "local") {
        showToast("Test push runs from local desk or Telegram");
        return;
      }
      const res = await apiFetch("/api/push/test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      showToast(data.message || "Test push checked");
    });

    $("copy-picks-freq").addEventListener("change", (e) => saveSetting("copy_picks_freq", e.target.value));
    $("copy-picks-time").addEventListener("change", (e) => saveSetting("copy_picks_time", e.target.value));

    $("setup-save").addEventListener("click", () => {
      const raw = $("setup-input").value.trim();
      if (!raw) return;
      if (/^https?:\/\//i.test(raw)) {
        localStorage.setItem(DATA_KEY, raw);
      } else {
        localStorage.setItem(TOKEN_KEY, raw);
      }
      $("setup-input").value = "";
      startLoops();
      refreshAll();
    });

    $("change-link-btn").addEventListener("click", () => {
      $("setup-panel").classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.body.addEventListener("click", async (e) => {
      const coinTarget = e.target.closest("[data-open-coin]");
      if (coinTarget) {
        openCoinModal(coinTarget.dataset.openCoin);
        return;
      }
      const auditTarget = e.target.closest("[data-open-audit]");
      if (auditTarget) {
        openAuditModal(auditTarget.dataset.openAudit);
        return;
      }
      const approveSug = e.target.closest("[data-approve-suggestion]");
      if (approveSug) {
        if (activeMode() !== "local") {
          showToast("Read-only via gist");
          return;
        }
        const sid = approveSug.dataset.approveSuggestion;
        const res = await apiFetch(`/api/suggestions/${encodeURIComponent(sid)}/approve`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        showToast(res.ok ? "Suggestion approved (who=me)" : (data.error || "Could not approve"));
        refreshAll();
        return;
      }
      const dismissSug = e.target.closest("[data-dismiss-suggestion]");
      if (dismissSug) {
        if (activeMode() !== "local") {
          showToast("Read-only via gist");
          return;
        }
        const sid = dismissSug.dataset.dismissSuggestion;
        const res = await apiFetch(`/api/suggestions/${encodeURIComponent(sid)}/dismiss`, { method: "POST" });
        showToast(res.ok ? "Suggestion dismissed" : "Could not dismiss");
        refreshAll();
        return;
      }
      const whaleTarget = e.target.closest("[data-open-whale]");
      if (whaleTarget) {
        openWhaleModal(whaleTarget.dataset.openWhale);
        return;
      }
      const muteBtn = e.target.closest("[data-mute-whale]");
      if (muteBtn) {
        if (activeMode() !== "local") {
          showToast("Read-only via gist — mute via local desk or Telegram");
          return;
        }
        const wid = muteBtn.dataset.muteWhale;
        const currentlyMuted = muteBtn.dataset.muted === "1";
        await apiFetch(`/api/whales/${encodeURIComponent(wid)}/${currentlyMuted ? "unmute" : "mute"}`, { method: "POST" });
        refreshAll();
        return;
      }
      const botBtn = e.target.closest("[data-toggle-bot]");
      if (botBtn) {
        if (activeMode() !== "local") {
          showToast("Read-only via gist — pause via local desk or Telegram");
          return;
        }
        const name = botBtn.dataset.toggleBot;
        const paused = botBtn.dataset.paused === "1";
        const res = await apiFetch(`/api/bots/${encodeURIComponent(name)}/${paused ? "resume" : "pause"}`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) showToast(data.error || "Action refused");
        refreshAll();
      }
    });

    document.body.addEventListener("input", (e) => {
      const r = e.target.closest("[data-setting-range]");
      if (r) {
        const key = r.dataset.settingRange;
        const num = document.querySelector(`[data-setting-num="${CSS.escape(key)}"]`);
        if (num) num.value = r.value;
      }
    });

    document.body.addEventListener("change", (e) => {
      const r = e.target.closest("[data-setting-range]");
      if (r) {
        saveSetting(r.dataset.settingRange, Number(r.value));
        return;
      }
      const n = e.target.closest("[data-setting-num]");
      if (n) {
        const key = n.dataset.settingNum;
        const slider = document.querySelector(`[data-setting-range="${CSS.escape(key)}"]`);
        if (slider) slider.value = n.value;
        saveSetting(key, Number(n.value));
        return;
      }
      const t = e.target.closest("[data-setting-text]");
      if (t) {
        saveSetting(t.dataset.settingText, t.value);
        return;
      }
      const s = e.target.closest("[data-setting-secret]");
      if (s) {
        saveSetting(s.dataset.settingSecret, s.value);
      }
    });

    document.body.addEventListener("click", (e) => {
      const sw = e.target.closest("[data-setting-bool]");
      if (!sw) return;
      if (sw.disabled) return;
      e.preventDefault();
      const next = sw.dataset.on !== "1";
      sw.dataset.on = next ? "1" : "0";
      sw.classList.toggle("on", next);
      saveSetting(sw.dataset.settingBool, next);
    });
  }

  function registerSw() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  }

  parseHashParams();
  bindEvents();
  registerSw();
  startLoops();
  refreshAll();
})();
