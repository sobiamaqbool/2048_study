// study_runner.js — v=2997 (oddball + demographics, same-person check)

console.log("study_runner loaded v=2997");

// ====== DRIVE UPLOAD CONFIG ======
var DRIVE_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyhmhAt0jVTSKWAeRJv296Rkg01tdcm2d_UAQq51JQT0aKQ1Cnn1s386xBlQMTYz5VL/exec";
function driveEnabled() {
  return typeof DRIVE_WEBAPP_URL === "string" && DRIVE_WEBAPP_URL.startsWith("http");
}

// ====== PARTICIPANT LABEL (P01, P02, …) ======
function participantLabel() {
  let label = localStorage.getItem("participant_label");
  if (!label) {
    let count = parseInt(localStorage.getItem("participant_counter") || "0", 10) + 1;
    localStorage.setItem("participant_counter", count);
    label = "P" + String(count).padStart(2, "0");
    localStorage.setItem("participant_label", label);
  }
  return label;
}

const PARTICIPANT_ID = participantLabel();
console.log("Participant ID:", PARTICIPANT_ID);

// ====== ANON + SESSION ======
function stableParticipantId() {
  const uid = localStorage.getItem("anon_link_google_uid");
  return uid ? `google:${uid}` : `anon:${anonId()}`;
}

function anonId() {
  const k = "study_anon_id";
  let id = localStorage.getItem(k);
  if (!id) {
    id = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) + "-" + Date.now().toString(36);
    localStorage.setItem(k, id);
  }
  return id;
}

function randSessionId() {
  return (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) + "-" + Date.now().toString(36);
}

function tsPrecise(){
  var d=new Date();
  function p(n){ return String(n).padStart(2,"0"); }
  var ms=String(d.getMilliseconds()).padStart(3,"0");
  return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+"_"+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+ms;
}

// --- Remove a column from a CSV by name (handles quoted cells) ---
function csvStripColumn(csv, colName){
  if (!csv) return csv;
  const lines = csv.split(/\r?\n/);
  if (!lines.length) return csv;

  const split = (s) => {
    const out = []; let cur = ""; let inq = false;
    for (let i=0;i<s.length;i++){
      const ch=s[i];
      if (ch === '"'){
        if (inq && s[i+1] === '"'){ cur += '"'; i++; }
        else { inq = !inq; }
      } else if (ch === ',' && !inq){
        out.push(cur); cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  };
  const join = (arr) => arr.map(v => {
    v = (v==null) ? "" : String(v);
    const need = /[",\n]/.test(v);
    return need ? `"${v.replace(/"/g,'""')}"` : v;
  }).join(',');

  const header = split(lines[0]);
  const idx = header.indexOf(colName);
  if (idx === -1) return csv;

  header.splice(idx,1);
  const out = [join(header)];
  for (let i=1;i<lines.length;i++){
    if (lines[i] === "") { out.push(""); continue; }
    const cells = split(lines[i]);
    if (cells.length > idx) cells.splice(idx,1);
    out.push(join(cells));
  }
  return out.join('\n');
}

// ====== UPLOAD TO DRIVE ======
function postToDrive(files, extra){
  if (!driveEnabled()) return;
  try {
    const payload = {
      participant_id: stableParticipantId(),
      participant_label: participantLabel(),
      session_id: (extra && extra.session_id) ? extra.session_id : randSessionId(),
      files: files || {},
      make_zip: false
    };
    fetch(DRIVE_WEBAPP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(console.error);
  } catch (e) { console.warn("Drive upload skipped:", e); }
}

// ====== OVERLAY + STYLES ======
document.addEventListener("DOMContentLoaded", function () {
  var s = document.createElement("style");
  s.textContent = [
    ".game-message { pointer-events: none !important; }",

    /* Theme */
    ":root{--th:#402F1D;--th95:rgba(64,47,29,.95);--thBorder:#2F2114;--thHover:#5A4029;--thShadow:rgba(64,47,29,.4);--thText:#fff;}",

    /* Overlay */
    "#study-overlay{background:rgba(64,47,29,.88)!important;backdrop-filter:blur(6px);color:#fff!important;display:none;position:fixed;inset:0;z-index:100000;place-items:center;padding:24px;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.45);}",
    "#study-title{font:800 24px/1.2 system-ui;letter-spacing:.2px;}",
    "#study-body{font:500 14px/1.4 system-ui;opacity:.95;margin-top:6px;}",
    "#study-box{max-width:480px;width:90%;}",

    "#study-form{margin:0;padding:0;max-width:none;width:auto;display:flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:0;}",
    "#study-form .q{margin:8px 0 10px;}",
    "#study-form label{display:block;font:600 15px system-ui;margin-bottom:6px;color:var(--thText);}",

    /* Uniform classic fields: age + all dropdowns */
"/* Uniform classic fields: age */" +
"#study-form input[type=number]{" +      // ⬅ select removed here
"  width:100%;" +
"  height:40px;" +
"  padding:8px 10px;" +
"  border-radius:8px;" +
"  border:1px solid #D3C5B6;" +
"  background:#F7F3EE;" +
"  color:#1C1917;" +
"  font:500 14px system-ui;" +
"  box-sizing:border-box;" +
"  -webkit-appearance:none;" +
"  appearance:none;" +
"}",

"/* Simpler styling for dropdowns (let Android control colors) */" +
"#study-form select{" +
"  width:100%;" +
"  height:40px;" +
"  padding:8px 10px;" +
"  border-radius:8px;" +
"  border:1px solid #D3C5B6;" +
"  box-sizing:border-box;" +
"}",


"@media (max-width: 768px){" +
"  #study-form select{" +
"    -webkit-appearance: menulist;" +
"    appearance: auto;" +
"    background:#FFFFFF;" +
"    color:#000000;" +
"  }" +
"}",

"#study-form input[type=number]:focus, #study-form select:focus{" +
"  outline:none;" +
"  border-color:#F4E1C1;" +
"  box-shadow:0 0 0 2px rgba(244,225,193,.4);" +
"}",


    "#study-submit{margin-top:8px;width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--thBorder);background:var(--th);color:var(--thText);font:700 14px system-ui;cursor:pointer;}",
    "#study-submit:hover{background:var(--thHover);}",

    /* Badges */
    "#study-timer{display:none;}",
    "#study-goal{display:none;pointer-events:none;}",
    ".game-container{position:relative;}",
    "#study-goal.anchored, #study-timer.anchored{position:absolute; top:-36px; z-index:1000; font:600 13px system-ui; background:var(--th); color:var(--thText); border:1px solid var(--thBorder); border-radius:10px; padding:6px 10px; box-shadow:0 6px 18px var(--thShadow);}",
    "#study-goal.anchored{ left:8px; }",
    "#study-timer.anchored{ right:8px; }",
    "#study-goal.pulse{animation:goalPulse .9s ease-out 1;}",
    "@keyframes goalPulse{0%{transform:scale(0.92);box-shadow:0 0 0 0 rgba(217,203,184,.5);}70%{transform:scale(1);box-shadow:0 0 0 12px rgba(217,203,184,0);}100%{transform:scale(1);box-shadow:none;}}",

    /* Cards */
    "#yn-card{display:flex;flex-direction:column;gap:16px;align-items:center;width:340px;max-width:90%;padding:22px 24px;background:#4B3826;border:1px solid #2F2114;border-radius:14px;box-shadow:0 16px 40px rgba(0,0,0,.35);}",
    "#yn-card.demo-card{align-items:stretch;width:420px;max-width:90%;padding:16px 20px;}",
    "#yn-title{font:800 20px/1.2 system-ui;color:#fff;text-align:center;margin-bottom:4px;}",
    "#yn-sub{font:500 13px/1.4 system-ui;color:#f3eee8;opacity:.95;text-align:center;margin-bottom:10px;}",
    "#yn-actions{display:flex;flex-direction:row;justify-content:space-between;gap:12px;width:100%;}",
    ".yn-btn{width:50%;text-align:center;padding:12px 14px;border-radius:12px;cursor:pointer;border:1px solid #D3C5B6;background:#F7F3EE;color:#1C1917;font:700 14px system-ui;box-shadow:0 3px 10px rgba(0,0,0,.12);transition:transform .06s.ease, background .15s;}",
    ".yn-btn:hover{background:#E8DFD6;}",
    ".yn-btn:active{transform:translateY(1px);}",
    ".yn-kbd{font:700 12px system-ui;background:#cab69e;color:#1C1917;border-radius:8px;padding:2px 6px;margin-left:6px;}",
    /* Demographics dropdowns (Age card) */
"#yn-card .radio-group label{" +
"  display:flex;" +
"  align-items:center;" +
"  gap:8px;" +
"  margin-bottom:4px;" +
"  color:#f3eee8;" +
"  font:500 13px system-ui;" +
"}",
"#yn-card .radio-group input[type=radio]{" +
"  accent-color:#F4E1C1;" +
"}",
"#yn-card.demo-card{" +
"  max-height:90vh;" +
"  overflow:visible;" +
"}",


/* Padding around questions so they don't touch bottom */
"#yn-card.demo-card .q{" +
"  margin-bottom:12px;" +
"}",


    "#demo-submit.yn-btn{background:#FCFAF7;color:#1B1A18;width:100%;padding:12px 14px;border-radius:10px;border:1px solid #D9CBB8;font:700 14px system-ui;}",
    "#demo-submit.yn-btn:hover{background:#F2EEEA;}",

    "#study-overlay{z-index:100000!important;pointer-events:auto!important;}",
    /* Allow scrolling inside the overlay on all devices */
    "#study-overlay{" +
    "  overflow-y:auto;" +
    "  -webkit-overflow-scrolling:touch;" +   /* mobile smooth scroll */
    "}",

  ].join("");
  document.head.appendChild(s);
});

// ========================== MAIN ==========================
;(function () {
  var L = window.StudyLogger;
  // init context – participant_id will be set in boot
  L.setContext({ mode_id: "init" });
  var Tests = window.TestsUI;

  // ---------- Overlay helpers ----------
  var overlay = document.getElementById("study-overlay");
  var titleEl = document.getElementById("study-title");
  var bodyEl  = document.getElementById("study-body");
  var boxEl   = document.getElementById("study-box");

  function show(t, s){
    if (titleEl) titleEl.textContent = t || "";
    if (bodyEl)  bodyEl.textContent  = s || "";
    if (overlay) overlay.style.display = "grid";
    if (boxEl)   boxEl.style.display = (t || s) ? "" : "none";
  }
  function hide(){
    if (overlay) overlay.style.display = "none";
    if (boxEl)   boxEl.style.display = "";
  }

  // ==== AUTH CHOICE (Google or Guest) ====
  const ENABLE_GOOGLE_LOGIN = true;
  const REQUIRE_EMAIL_IN_LOGS = false;

  function ensureHost_() {
    let host = document.getElementById("study-form");
    if (!host) {
      host = document.createElement("div");
      host.id = "study-form";
      (document.getElementById("study-overlay") || document.body).appendChild(host);
    }
    return host;
  }

  const optionalGoogleSignIn = window.optionalGoogleSignIn || (async () => {
    throw new Error("Google sign-in not configured.");
  });

  function askAuthChoicePersistent() {
    if (!ENABLE_GOOGLE_LOGIN) return Promise.resolve({ choice: "guest" });

    if (localStorage.getItem("anon_link_google_uid")) {
      return Promise.resolve({
        choice: "google",
        data: {
          google_uid: localStorage.getItem("anon_link_google_uid"),
          displayName: localStorage.getItem("google_displayName") || null,
          email: localStorage.getItem("google_email") || null
        }
      });
    }

    return new Promise((resolve) => {
      const host = ensureHost_();
      host.innerHTML = `
        <div id="yn-card">
          <div id="yn-title">How would you like to continue?</div>
          <div id="yn-actions" style="width:100%">
            <button class="yn-btn" id="btn-google">Sign in with Google</button>
            <button class="yn-btn" id="btn-guest">Play as Guest</button>
          </div>
          <div id="yn-msg" style="font:600 12px system-ui;opacity:.9;margin-top:8px;"></div>
        </div>
      `;
      show("", "");

      const $msg = host.querySelector("#yn-msg");
      const setMsg = (t) => { $msg.textContent = t || ""; };

      const finish = (choice, data) => {
        try { host.remove(); } catch(_) {}
        hide();
        resolve({ choice, data: data || null });
      };

      document.getElementById("btn-guest").onclick = () => {
        try { window.StudyLogger?.logTest?.("init", "auth_choice", "flow", "guest"); } catch(_){}
        finish("guest");
      };

      document.getElementById("btn-google").onclick = async () => {
        setMsg("Opening Google…");
        try {
          const info = await optionalGoogleSignIn();
          if (info && info.google_uid) {
            localStorage.setItem("anon_link_google_uid", info.google_uid);
            if (info.displayName) localStorage.setItem("google_displayName", info.displayName);
            if (REQUIRE_EMAIL_IN_LOGS && info.email) localStorage.setItem("google_email", info.email);
          }
          try { window.StudyLogger?.logTest?.("init", "auth_choice", "flow", "google"); } catch(_){}
          finish("google", info);
        } catch (e) {
          console.warn("Google sign-in failed:", e);
          setMsg("Sign-in failed. You can try again or Play as Guest.");
        }
      };
    });
  }

  // ==== DEMOGRAPHICS (form before study) ====
  function askDemographics() {
  return new Promise(function (resolve) {
    var mid = "demographics";

    try {
      if (L && typeof L.setContext === "function") {
        L.setContext({ participant_id: stableParticipantId(), mode_id: mid });
      }
      if (L && typeof L.newSession === "function") {
        L.newSession(mid);
      }
    } catch (e) {
      console.warn("Demographics: could not start logger session:", e);
    }

    const host = ensureHost_();
    host.innerHTML = `
      <div id="yn-card" class="demo-card">
        <div id="yn-title">Before we start</div>
        <div id="yn-sub">Please answer a few short questions.</div>

        <div class="q">
          <label>Age</label>
          <input id="demo-age" type="number" min="10" max="100" style="width:100%">
        </div>

        <div class="q">
          <label>Gender</label>
          <div class="radio-group" id="demo-gender-group">
            <label><input type="radio" name="demo-gender" value="female"> Female</label>
            <label><input type="radio" name="demo-gender" value="male"> Male</label>
            <label><input type="radio" name="demo-gender" value="other"> Other</label>
          </div>
        </div>

        <div class="q">
          <label>Highest education level</label>
          <div class="radio-group" id="demo-edu-group">
            <label><input type="radio" name="demo-edu" value="school"> School / College</label>
            <label><input type="radio" name="demo-edu" value="bachelors"> Bachelor</label>
            <label><input type="radio" name="demo-edu" value="masters"> Master</label>
            <label><input type="radio" name="demo-edu" value="phd"> PhD</label>
          </div>
        </div>

        <div class="q">
          <label>How often do you play video / mobile games?</label>
          <div class="radio-group" id="demo-games-group">
            <label><input type="radio" name="demo-games" value="never"> Almost never</label>
            <label><input type="radio" name="demo-games" value="monthly"> A few times per month</label>
            <label><input type="radio" name="demo-games" value="weekly"> 1–3 times per week</label>
            <label><input type="radio" name="demo-games" value="daily"> Most days</label>
          </div>
        </div>

        <div class="q">
          <label>Vision</label>
          <div class="radio-group" id="demo-vision-group">
            <label><input type="radio" name="demo-vision" value="normal"> Normal vision</label>
            <label><input type="radio" name="demo-vision" value="glasses_contacts"> Glasses / contacts</label>
            <label><input type="radio" name="demo-vision" value="vision_disorder"> Known vision disorder</label>
          </div>
        </div>

        <div class="q">
          <label>Handedness</label>
          <div class="radio-group" id="demo-hand-group">
            <label><input type="radio" name="demo-hand" value="right"> Right-handed</label>
            <label><input type="radio" name="demo-hand" value="left"> Left-handed</label>
          </div>
        </div>

        <button id="demo-submit" class="yn-btn" style="width:100%;margin-top:6px;">
          Continue
        </button>

        <div id="demo-error" style="color:#ffb3b3;font:600 13px system-ui;text-align:center;margin-top:6px;display:none;">
          Please answer all questions.
        </div>
      </div>
    `;

    show("", "");

    document.getElementById("demo-submit").onclick = function () {
      const age = document.getElementById("demo-age").value;

      const gEl = document.querySelector('input[name="demo-gender"]:checked');
      const eEl = document.querySelector('input[name="demo-edu"]:checked');
      const gaEl = document.querySelector('input[name="demo-games"]:checked');
      const vEl = document.querySelector('input[name="demo-vision"]:checked');
      const hEl = document.querySelector('input[name="demo-hand"]:checked');

      const gender = gEl && gEl.value;
      const edu    = eEl && eEl.value;
      const games  = gaEl && gaEl.value;
      const vision = vEl && vEl.value;
      const hand   = hEl && hEl.value;

      if (!age || !gender || !edu || !games || !vision || !hand) {
        const e = document.getElementById("demo-error");
        e.style.display = "block";
        return;
      }

      try {
        if (L && typeof L.logTest === "function") {
          L.logTest(mid, "age",        "profile", age);
          L.logTest(mid, "gender",     "profile", gender);
          L.logTest(mid, "education",  "profile", edu);
          L.logTest(mid, "games",      "profile", games);
          L.logTest(mid, "vision",     "profile", vision);
          L.logTest(mid, "handedness", "profile", hand);
        }
      } catch (e) {
        console.warn("Demographics logging failed:", e);
      }

      // export demographics to Drive
      try {
        if (L && typeof L.testRowsForExport === "function" &&
            typeof L.toCSVTests === "function") {

          var rows = L.testRowsForExport().filter(function (r) {
            return r.mode_id === mid;
          });

          if (rows && rows.length) {
            var csv = L.toCSVTests(rows);
            csv = csvStripColumn(csv, "participant_id");

            var metaObj = {
              study_id: "study",
              block_id: mid,
              app_version: "v2995+demographics",
              ts: new Date().toISOString(),
              userAgent: navigator.userAgent
            };

            postToDrive(
              { "tests.csv": csv, "meta.json": metaObj },
              { session_id: "S_" + tsPrecise() + "_" + mid }
            );
          }
        }
      } catch (e) {
        console.warn("Drive upload (demographics) failed:", e);
      }

      hide();
      try {
        localStorage.setItem("demographics_done", "1");
      } catch (e) {
        console.warn("could not set demographics_done", e);
      }

      host.innerHTML = "";
      resolve();
    };
  });
}


  // ==== SAME PERSON OR NEW PERSON? ====
  function ensureDemographicsOnce() {
    return new Promise(function (resolve) {
      var already = false;
      try {
        already = localStorage.getItem("demographics_done") === "1";
      } catch (e) {
        console.warn("cannot read demographics_done", e);
      }

      // First-time visitor → just show the form
      if (!already) {
        askDemographics().then(resolve);
        return;
      }

      // Returning on same browser → ask if same person
      const host = ensureHost_();
      host.innerHTML = `
        <div id="yn-card" class="demo-card">
          <div id="yn-title">Is this the same person as before?</div>
          <div id="yn-sub">If someone new is playing, we will ask the short questions again.</div>
          <div id="yn-actions">
            <button class="yn-btn" id="same-person">Same person</button>
            <button class="yn-btn" id="new-person">New person</button>
          </div>
        </div>
      `;
      show("", "");

      document.getElementById("same-person").onclick = function () {
        host.innerHTML = "";
        hide();
        resolve(); // go straight to the study
      };

      document.getElementById("new-person").onclick = function () {
        try { localStorage.removeItem("demographics_done"); } catch(e){}
        host.innerHTML = "";
        hide();
        // now force demographics again
        askDemographics().then(resolve);
      };
    });
  }

  // ---------- YAML loader ----------
  function loadConfigSmart() {
    return new Promise(function(resolve, reject){
      function go(){
        var urls = ["public/block.yaml","/public/block.yaml","block.yaml","/block.yaml"];
        (function next(i){
          if (i>=urls.length) { reject(new Error("Could not find block.yaml")); return; }
          fetch(urls[i], { cache: "no-cache" }).then(function(r){
            if (!r.ok) throw new Error("HTTP "+r.status);
            return r.text();
          }).then(function(txt){
            resolve(window.jsyaml.load(txt));
          }).catch(function(e){
            console.warn("YAML load failed:", urls[i], e.message);
            next(i+1);
          });
        })(0);
      }
      if (!window.jsyaml) {
        var s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js";
        s.onload = go;
        s.onerror = function(){ reject(new Error("js-yaml load error")); };
        document.head.appendChild(s);
      } else { go(); }
    });
  }

  // ---------- DOM reset ----------
  function wipeGameDOM(size) {
    size = size || 4;
    var gc = document.querySelector(".game-container"); if (!gc) return;
    var rows = Array.from({ length: size }, function(){
      return '<div class="grid-row">' + Array.from({ length: size }, function(){ return '<div class="grid-cell"></div>'; }).join("") + "</div>";
    }).join("");
    gc.innerHTML = ''
      + '<div class="heading">'
      +   '<a class="restart-button" style="display:none"></a>'
      +   '<a class="retry-button" style="display:none"></a>'
      +   '<a class="keep-playing-button" style="display:none"></a>'
      + '</div>'
      + '<div class="game-message"><p></p><div class="lower">'
      +   '<a class="keep-playing-button" style="display:none"></a>'
      +   '<a class="retry-button" style="display:none"></a>'
      + '</div></div>'
      + '<div class="grid-container">' + rows + '</div>'
      + '<div class="tile-container"></div>';
  }

  // ---------- Badges ----------
  function getTimerEl() {
    var el = document.getElementById("study-timer");
    if (!el) { el = document.createElement("div"); el.id = "study-timer"; document.body.appendChild(el); }
    return el;
  }
  function getGoalEl() {
    var el = document.getElementById("study-goal");
    if (!el) { el = document.createElement("div"); el.id = "study-goal"; document.body.appendChild(el); }
    return el;
  }
  function anchorGoalBadgeToBoard() {
    var g = getGoalEl();
    var gc = document.querySelector(".game-container");
    if (gc && g.parentNode !== gc) gc.appendChild(g);
    g.classList.add("anchored");
  }
  function anchorTimerBadgeToBoard() {
    var t = getTimerEl();
    var gc = document.querySelector(".game-container");
    if (gc && t.parentNode !== gc) gc.appendChild(t);
    t.classList.add("anchored");
  }
  function startCountdown(seconds, onEnd) {
    if (!seconds) return { stop: function(){}, running: false };
    var el = getTimerEl();
    function fmt(s){ var m = Math.floor(s/60), ss = String(Math.max(0, s%60)).padStart(2,"0"); return m + ":" + ss; }
    var t = seconds;
    el.textContent = "Time: " + fmt(t);
    el.style.display = "block";
    var id = setInterval(function(){
      t -= 1; el.textContent = "Time: " + fmt(t);
      if (t <= 0) { clearInterval(id); el.style.display = "none"; if (typeof onEnd === "function") onEnd(); }
    }, 1000);
    return { stop: function(){ clearInterval(id); el.style.display = "none"; }, running: true };
  }
  function showGoalBadge(goalTile){
    var g = getGoalEl();
    g.textContent = "Goal: " + goalTile;
    g.style.display = "block";
    g.classList.remove("pulse"); void g.offsetWidth; g.classList.add("pulse");
  }
  function hideGoalBadge(){
    var g = document.getElementById("study-goal");
    if (g) g.style.display = "none";
  }

  // ---------- Prefill / weights ----------
  function pickWeighted(obj){
    var entries = Object.keys(obj).map(function(k){ return [Number(k), Number(obj[k])]; });
    var sum = entries.reduce(function(a, e){ return a + e[1]; }, 0) || 1;
    var r = Math.random()*sum, i;
    for (i=0;i<entries.length;i++){ r -= entries[i][1]; if (r <= 0) return Math.floor(entries[i][0]); }
    return Math.floor(entries[0] ? entries[0][0] : 2);
  }
  function prefillBoard(gm, spec){
    if (!spec || !spec.prefill) return;
    var ratio = Math.max(0, Math.min(1, Number(spec.prefill.fill_ratio || 0)));
    var need = Math.round(gm.size*gm.size*ratio);
    var weights = spec.prefill.values || {"2":1,"4":1};
    while (need-- > 0 && gm.grid.availableCells().length){
      var cell = gm.grid.randomAvailableCell();
      gm.grid.insertTile(new Tile(cell, pickWeighted(weights)));
    }
  }

  // ---------- Optional start grid ----------
  function applyStartGrid(gm, spec){
    if (!spec || !spec.grid) return false;

    gm.grid = new Grid(gm.size);

    var maxVal = -Infinity, maxPos = null, y, x;
    for (y=0; y<spec.grid.length; y++){
      for (x=0; x<spec.grid[y].length; x++){
        var v = Number(spec.grid[y][x]) || 0;
        if (v > 0) {
          gm.grid.insertTile(new Tile({ x: x, y: y }, v));
          if (v > maxVal){ maxVal = v; maxPos = { x: x, y: y }; }
        }
      }
    }

    if (Array.isArray(spec.high_tile_randomize) && spec.high_tile_randomize.length && maxPos){
      var choices = spec.high_tile_randomize.map(Number).filter(function(n){ return n>0; });
      if (choices.length){
        var pick = choices[Math.floor(Math.random()*choices.length)];
        var t = gm.grid.cells[maxPos.x][maxPos.y];
        if (t) t.value = pick;
      }
    }

    gm.score = 0;
    gm.over = false; gm.won = false; gm.keepPlaying = false;
    gm.actuator.actuate(gm.grid, { score: gm.score, terminated: false });

    return true;
  }

  // ---------- NoStorage ----------
  function NoStorageManager() {}
  NoStorageManager.prototype.getBestScore = function(){ return 0; };
  NoStorageManager.prototype.setBestScore = function(_) {};
  NoStorageManager.prototype.getGameState = function(){ return null; };
  NoStorageManager.prototype.setGameState = function(_) {};
  NoStorageManager.prototype.clearGameState = function(_) {};

  // ---------- Inline questions ----------
  function askPostQuestions(block){
    var qs = block && block.post_questions;
    if (!qs || !Array.isArray(qs) || !qs.length) return Promise.resolve();

    if (Tests && typeof Tests.runTests === "function") {
      show("Quick questions", "Answer, then continue.");
      return Tests.runTests(qs, String(block.id)+"__post", block.tests_options || null)
        .then(function(res){
          function write(id, val){ L.logTest(block.id, String(id), "post_question", val); }
          if (res == null) return;
          if (Array.isArray(res)) {
            res.forEach(function(item, i){
              if (item && typeof item === "object") {
                var id  = item.id != null ? item.id : (item.itemId != null ? item.itemId : (item.key != null ? item.key : i));
                var val = item.response != null ? item.response :
                          (item.value != null ? item.value :
                          (item.answer != null ? item.answer :
                          (item.score != null ? item.score : JSON.stringify(item))));
                write(id, val);
              } else { write(i, item); }
            });
          } else if (typeof res === "object") {
            Object.keys(res).forEach(function(k){ write(k, res[k]); });
          } else {
            write("result", res);
          }
        })
        .catch(function(e){ console.error("Post questions error:", e); })
        .finally(function(){ hide(); });
    }

    return new Promise(function(resolve){
      show("Quick questions", "Answer, then continue.");
      var form = document.getElementById("study-form");
      if (!form) { form = document.createElement("div"); form.id = "study-form"; overlay.appendChild(form); }
      form.innerHTML = "";

      var answers = {};
      qs.forEach(function(q, idx){
        var qWrap = document.createElement("div"); qWrap.className = "q";
        var lbl = document.createElement("label");
        lbl.textContent = q.text || ("Question " + (idx+1));
        qWrap.appendChild(lbl);

        if (q.type === "single" && Array.isArray(q.options)) {
          var opts = document.createElement("div"); opts.className = "opts";
          q.options.forEach(function(opt){
            var b = document.createElement("button");
            b.type = "button"; b.className = "optbtn"; b.textContent = opt;
            b.addEventListener("click", function(){
              Array.prototype.forEach.call(opts.querySelectorAll(".optbtn"), function(x){ x.classList.remove("active"); });
              b.classList.add("active");
              answers[q.id || ("q"+idx)] = opt;
            });
            opts.appendChild(b);
          });
          qWrap.appendChild(opts);
        } else if (q.type === "scale" && isFinite(q.min) && isFinite(q.max)) {
          var wrap = document.createElement("div"); wrap.className = "rangewrap";
          var out = document.createElement("div"); out.style.minWidth="32px"; out.textContent = String(q.min);
          var rng = document.createElement("input");
          rng.type = "range";
          rng.min = q.min; rng.max = q.max; rng.step = 1; rng.value = q.min;
          rng.addEventListener("input", function(){ out.textContent = rng.value; answers[q.id || ("q"+idx)] = Number(rng.value); });
          answers[q.id || ("q"+idx)] = q.min;
          wrap.appendChild(rng); wrap.appendChild(out);
          qWrap.appendChild(wrap);

          if (Array.isArray(q.labels)) {
            var lab = document.createElement("div");
            lab.style.font = "600 12px system-ui"; lab.style.opacity=".8"; lab.style.marginTop = "4px";
            lab.textContent = q.labels.join(" | ");
            qWrap.appendChild(lab);
          }
        } else {
          var inp = document.createElement("input");
          inp.type = "text"; inp.style.width="100%";
          inp.addEventListener("input", function(){ answers[q.id || ("q"+idx)] = inp.value; });
          qWrap.appendChild(inp);
        }

        form.appendChild(qWrap);
      });

      var submit = document.createElement("button");
      submit.id = "study-submit"; submit.textContent = "Submit";
      submit.addEventListener("click", function(){
        Object.keys(answers).forEach(function(itemId){ L.logTest(block.id, itemId, "post_question", answers[itemId]); });
        form.remove();
        hide();
        resolve();
      });
      form.appendChild(submit);
    });
  }

  function askYesNoAwareness(block) {
    return new Promise(function(resolve){
      var host = document.getElementById("study-form");
      if (!host) { host = document.createElement("div"); host.id = "study-form"; overlay.appendChild(host); }
      host.innerHTML = "";

      var card = document.createElement("div"); card.id = "yn-card";
      card.innerHTML =
        '<div id="yn-title">Did you notice any odd looking tile while playing?</div>' +
        '<div id="yn-sub">Answer and continue. You can also press <b>Y</b> or <b>N</b>.</div>' +
        '<div id="yn-actions">' +
          '<button class="yn-btn" id="yn-yes">Yes <span class="yn-kbd">Y</span></button>' +
          '<button class="yn-btn" id="yn-no">No <span class="yn-kbd">N</span></button>' +
        '</div>';
      host.appendChild(card);

      show("", "");

      function cleanup(){
        try { host.remove(); } catch(_) {}
        hide();
      }

  
function done(val){
  var yes = (val === "Yes");

  // 1) Keep existing StudyLogger hook
  try {
    if (window.StudyLogger && typeof StudyLogger.logOddballReport === "function") {
      StudyLogger.logOddballReport(yes);
      console.log("Oddball awareness logged:", val);
    }
  } catch (e) {
    console.warn("Oddball logging failed:", e);
  }

  // 2) NEW: log into the Tests logger so it can go to tests.csv
  try {
    if (window.L && typeof L.logTest === "function") {
      // mode_id = block.id, test_id = "oddball_awareness"
      L.logTest(block.id, "oddball_awareness", "awareness", yes ? 1 : 0);
    }
  } catch (e) {
    console.warn("Awareness L.logTest failed:", e);
  }

  cleanup();
  resolve();
}



      function onk(e){
        if (e.key === "y" || e.key === "Y") { done("Yes"); }
        if (e.key === "n" || e.key === "N") { done("No");  }
      }
      window.addEventListener("keydown", onk, true);

      document.getElementById("yn-yes").onclick = function(){ done("Yes"); };
      document.getElementById("yn-no").onclick  = function(){ done("No");  };
    });
  }

  // ================= REST =================
  function runRestBlock(cfg, block){
    return new Promise(function(res){
      show("Ready...", "");
      setTimeout(function(){ hide(); res(); }, 2000);
    });
  }

  // ---------- Per-block default overrides ----------
  function applyDefaultsForBlock(block){
    if (block && block.id === "medium_mode") {
      block.goal_tile = 512;
      delete block.timer;
      delete block.stop;
    }
    if (block && block.id === "hard_mode") {
      block.timer = block.timer || { hard_cap_sec: 90 };
      if (!isFinite(Number(block.timer.hard_cap_sec))) block.timer.hard_cap_sec = 90;
      block.stop = { kind: "time", value: block.timer.hard_cap_sec };

      block.start_state = block.start_state || {};
      var pf = block.start_state.prefill || {};
      if (!isFinite(Number(pf.fill_ratio))) pf.fill_ratio = 0.35;
      pf.values = pf.values || {"2":0.6,"4":0.3,"8":0.1};
      block.start_state.prefill = pf;

      block.spawn = block.spawn || {};
      block.spawn.rates = block.spawn.rates || {"2":0.7,"4":0.25,"8":0.05};
    }
  }

  // ================= PLAY =================
  // ================= PLAY =================
function runPlayBlock(cfg, block){
  return new Promise(function(resolve){
    applyDefaultsForBlock(block);

    var playSessionToken = (Math.random().toString(36).slice(2) + Date.now().toString(36));
    window.__activePlayToken = playSessionToken;

    var size = block.board_size || (cfg && cfg.global && cfg.global.board_size) || 4;
    wipeGameDOM(size);

    anchorGoalBadgeToBoard();
    anchorTimerBadgeToBoard();

    var msgNode = document.querySelector(".game-message");
    if (msgNode) {
      msgNode.classList.remove("game-won", "game-over");
      var p = msgNode.querySelector("p"); if (p) p.textContent = "";
    }

    var gm = new GameManager(size, KeyboardInputManager, HTMLActuator, NoStorageManager);
    var freshActuator = gm.actuator;

    // ---- ODDBALL STATE (per round) ----
    gm.moveCount      = 0;
    gm.oddballSpawned = false;
    gm.oddballEnabled = (block.id === "medium_mode");  // <— key line
    console.log(block.id + " play — gm.oddballEnabled =", gm.oddballEnabled);

    gm.grid = new Grid(size);
    gm.score = 0;
    gm.over = false;
    gm.won = false;
    gm.keepPlaying = false;

    if (gm.actuator && typeof gm.actuator.clearMessage === "function") gm.actuator.clearMessage();

    L.setContext({ participant_id: stableParticipantId(), mode_id: block.id });
    L.newSession(block.id);

    var goalTile = isFinite(Number(block.goal_tile)) ? Number(block.goal_tile) : null;
    var introMsg = goalTile
      ? '<span style="display:block;margin-top:6px;font:600 18px/1.3 system-ui;color:#fff;">Goal: reach ' + goalTile + '</span>'
      : "Press arrow keys to play";
    show(block.description || block.id, "");
    if (bodyEl) bodyEl.innerHTML = introMsg;

    var ov = document.getElementById("study-overlay");
    if (ov) ov.style.pointerEvents = "none";
    setTimeout(function(){ hide(); if (ov) ov.style.pointerEvents = ""; }, 5000);

    if (goalTile) showGoalBadge(goalTile); else hideGoalBadge();

    var ended=false, cd=null;
    var scheduled = [];
    function schedule(fn, ms){
      var id = setTimeout(function(){ if(!ended) fn(); }, ms);
      scheduled.push(id);
    }
    function clearScheduled(){
      scheduled.forEach(function(id){ clearTimeout(id); });
      scheduled = [];
    }

    function finalizeAndResolve(){
      if (window.__activePlayToken === playSessionToken) { window.__activePlayToken = null; }
      hideGoalBadge();

      try {
        var rows = L.moveRowsForExport().filter(function(r){ return r.mode_id===block.id; });
        var csv  = L.toCSVMoves(rows);
        csv = csvStripColumn(csv, "participant_id");
        var metaObj = {
          study_id: (cfg && cfg.meta && cfg.meta.study_id) || "study",
          block_id: block.id,
          app_version: "v2995+stableId+authChoice+drive+overlayFull",
          ts: new Date().toISOString(),
          userAgent: navigator.userAgent
        };
        postToDrive(
          { "moves.csv": csv, "meta.json": metaObj },
          { session_id: "S_"+tsPrecise()+"_"+block.id }
        );
      } catch(e){ console.warn("Drive upload (moves) failed:", e); }

      setTimeout(function(){
        resolve(L.moveRowsForExport().filter(function(r){ return r.mode_id===block.id; }));
      }, 80);
    }

    function stop(reason){
      if (ended) return;
      ended = true;

      if (cd && typeof cd.stop === "function") { try { cd.stop(); } catch(e) {} }
      clearScheduled();
      hideGoalBadge();
      hide();

      if (block.id === "medium_mode" || block.id === "easy_mode") {
        askYesNoAwareness(block)
          .then(function(){ return askPostQuestions(block); })
          .then(finalizeAndResolve);
      } else {
        askPostQuestions(block).then(finalizeAndResolve);
      }
    }

    if ((block.stop && block.stop.kind==="time" && block.stop.value) ||
        (block.timer && block.timer.hard_cap_sec)) {
      var secs = Number(
        (block.timer && block.timer.hard_cap_sec) ||
        (block.stop && block.stop.value) || 0
      );
      cd = startCountdown(secs, function(){ stop("time_done"); });
    }

       var spawnRates = block && block.spawn && block.spawn.rates;

      // ---- ODDBALL FLAGS (per game) ----
      gm.oddballEnabled = (block.id === "medium_mode"); // only medium
      gm.moveCount      = 0;                            // reset moves
      gm.oddballSpawned = false;                        // only once

      gm.addRandomTile = function () {
        if (!gm.grid.cellsAvailable()) return;

        // pick value by spawnRates (if defined) or default 2048 logic
        var position = gm.grid.randomAvailableCell();
        var value = spawnRates
          ? pickWeighted(spawnRates)
          : (Math.random() < 0.9 ? 2 : 4);

        // ---- ODDBALL LOGIC (medium only) ----
        var isOddball = false;
        if (
          gm.oddballEnabled &&     // only in medium_mode
          !gm.oddballSpawned &&    // at most once
          gm.moveCount >= 10 &&    // after 10 moves
          gm.moveCount <= 40       // up to 40 moves
        ) {
          if (Math.random() < 0.30) {  // 30% chance per spawn
            isOddball = true;
            gm.oddballSpawned = true;
            console.log("[ODDBALL] spawned at", position, "move", gm.moveCount);
          }
        }

        var tile = new Tile(position, value);
        tile.isOddball = !!isOddball;

        if (tile.isOddball && window.StudyLogger && StudyLogger.logOddballSpawn) {
          StudyLogger.logOddballSpawn(tile);
        }

        gm.grid.insertTile(tile);

        // 🔴 IMPORTANT: no timeout here, let it stay oddball.
        // (We can later make it fade with CSS if you still want 3s only.)
      };

    // ---------- INITIAL GRID ----------
    var hadGrid = applyStartGrid(gm, block.start_state);
    if (!hadGrid) {
      var hadPrefillBefore = (block.start_state && block.start_state.prefill) ? true : false;
      if (block.start_state && block.start_state.prefill) {
        prefillBoard(gm, block.start_state);
      }
      if (!hadPrefillBefore) {
        var desiredInitial = (block.start_state && isFinite(Number(block.start_state.initial_tiles)))
          ? Number(block.start_state.initial_tiles) : 1;
        for (var k = 0; k < desiredInitial; k++) {
          if (gm.grid.cellsAvailable()) gm.addRandomTile();
        }
      }
      gm.actuator.actuate(gm.grid, { score: 0 });
    }

    // --------- MOVE LOGGING ---------
    var lastMoveAt = performance.now();
    var inputs_total = 0;
    function dirName(d){ return ({0:"up",1:"right",2:"down",3:"left"})[d] || String(d); }

    gm.inputManager.on("move", function(dir){
      if (window.__activePlayToken !== playSessionToken) { return; }

      gm.moveCount++;   // <— IMPORTANT for oddball window

      var now = performance.now();
      var latencyMs = Math.max(1, Math.round(now - lastMoveAt));
      lastMoveAt = now;
      inputs_total += 1;

      var n = gm.size;
      var gridOut = Array.from({length:n}, function(_, y){
        return Array.from({length:n}, function(_, x){
          var cell = gm.grid.cells[x][y];
          return cell ? cell.value : 0;
        });
      });

      L.logMove(inputs_total, dirName(dir), gm.score, latencyMs, gridOut);
    });

    var oldActuate = freshActuator.actuate.bind(freshActuator);
    freshActuator.actuate = function(grid,meta){
      oldActuate(grid,meta);
      var msgEl = document.querySelector(".game-message");
      if (msgEl && !gm.over && !gm.won) msgEl.classList.remove("game-over","game-won");

      if (meta && meta.terminated){
        stop(meta.over ? "game_over" : "won");
        return;
      }

      if (isFinite(goalTile)){
        var maxNow=0;
        grid.eachCell(function(x,y,c){ if(c) maxNow = Math.max(maxNow, c.value); });
        if (maxNow>=goalTile && !gm.won){
          gm.won = true;
          show("You win!", "Reached " + goalTile);
          setTimeout(function(){ stop("goal_reached"); }, 600);
        }
      }
    };
  });
}


  // ================= TESTS =================
  function runTestsBlock(cfg, block){
    return new Promise(function(resolve){
      L.setContext({ participant_id: stableParticipantId(), mode_id:block.id });
      L.newSession(block.id);

      if (window.__pendingAwareness) {
        var p = window.__pendingAwareness;
        try {
          L.logTest(
            block.id,
            "noticed_color_change_from_" + p.block_id,
            "awareness",
            p.response
          );
          console.log("✅ Awareness carried into tests:", p.response, "from", p.block_id, "→", block.id);
        } catch(e){ console.warn("carry logTest failed:", e); }
        window.__pendingAwareness = null;
      }

      Promise.resolve().then(function(){
        return Tests && typeof Tests.runTests==="function"
          ? Tests.runTests(block.tests || [], block.id, block.tests_options || null)
          : null;
      }).then(function(res){
        function write(id, val){ L.logTest(block.id, String(id), "test_item", val); }
        if (res != null) {
          if (Array.isArray(res)) {
            res.forEach(function(item, i){
              if (item && typeof item === "object") {
                var id  = item.id != null ? item.id : (item.itemId != null ? item.itemId : (item.key != null ? item.key : i));
                var val = item.response != null ? item.response :
                          (item.value != null ? item.value :
                          (item.answer != null ? item.answer :
                          (item.score != null ? item.score : JSON.stringify(item))));
                write(id, val);
              } else { write(i, item); }
            });
          } else if (typeof res === "object") {
            var last = res;
            Object.keys(last).forEach(function(k){ write(k, last[k]); });
          } else {
            write("result", res);
          }
        } else if (Tests && typeof Tests.getLastResults === "function") {
          var last = Tests.getLastResults();
          if (last && typeof last === "object") {
            Object.keys(last).forEach(function(k){ write(k, last[k]); });
          }
        }
      }).catch(function(e){
        console.error("TestsUI.runTests error:", e);
      }).finally(function(){
        try {
          var rows = L.testRowsForExport().filter(function(r){ return r.mode_id===block.id; });
          var csv  = L.toCSVTests(rows);
          csv = csvStripColumn(csv, "participant_id");
          var metaObj = {
            study_id: (cfg && cfg.meta && cfg.meta.study_id) || "study",
            block_id: block.id,
            app_version: "v2995+stableId+authChoice+drive+overlayFull",
            ts: new Date().toISOString(),
            userAgent: navigator.userAgent
          };
          postToDrive(
            { "tests.csv": csv, "meta.json": metaObj },
            { session_id: "S_"+tsPrecise()+"_"+block.id }
          );
        } catch(e){ console.warn("Drive upload (tests) failed:", e); }

        resolve();
      });
    });
  }

  // ================= RUNNER =================
  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  var ROUND_ORDER=["easy_mode","medium_mode","hard_mode"];
  function preBlockLabel(nextId,nextType){
    if (nextType !== "play") return null;
    var idx = ROUND_ORDER.indexOf(nextId); if (idx === -1) return null;
    var n = idx+1, total = ROUND_ORDER.length;
    return { title: "Round " + n + "/" + total, body: "Starting in 3 seconds..." };
  }
  function buildName(pattern, meta, blockId, kind){
    var base=(pattern||"{study_id}__{block_id}__{kind}__{ts}.csv")
      .replace("{study_id}", (meta && meta.study_id) || "study")
      .replace("{block_id}", blockId)
      .replace("{kind}", kind)
      .replace("{ts}", tsPrecise());
    if (!/__moves__|__tests__|__.+__/.test(base)) {
      return base.replace(/\.csv$/i, "__"+kind+".csv");
    }
    return base;
  }

  function runStudy(config){
    return new Promise(function(resolve){
      var meta = config.meta, blocks = config.blocks, sequence = config.sequence, output = config.output;
      var map = {}; blocks.forEach(function(b){ map[b.id]=b; });
      (function loop(i){
        if (i>=sequence.length){ show("Study complete","Thank you!"); resolve(); return; }
        var id=sequence[i], b=map[id];
        if(!b){ loop(i+1); return; }
        var label=preBlockLabel(id,b.type);
        (function beforePlay(){
          if(label){ show(label.title,label.body); sleep(3000).then(function(){ hide(); doRun(); }); }
          else { doRun(); }
        })();
        function doRun(){
          if (b.type==="rest"){
            runRestBlock(config,b).then(function(){ loop(i+1); });
            return;
          }
          if (b.type==="play"){
            runPlayBlock(config,b).then(function(){
              if (output && output.autosave_csv_on_block_end){
                var rows = L.moveRowsForExport().filter(function(r){ return r.mode_id===id; });
                var csv  = L.toCSVMoves(rows);
                var name = buildName(output.filename_pattern, meta, id, "moves");
                // no auto-download
              }
              loop(i+1);
            });
            return;
          }
          if (b.type==="tests"){
            runTestsBlock(config,b).then(function(){
              if (output && output.autosave_csv_on_block_end){
                var rows = L.testRowsForExport().filter(function(r){ return r.mode_id===id; });
                var csv  = L.toCSVTests(rows);
                var name = buildName(output.tests_filename_pattern, meta, id, "tests");
              }
              loop(i+1);
            });
            return;
          }
          loop(i+1);
        }
      })(0);
    });
  }

  // ---------- Boot ----------
  loadConfigSmart().then(async function(cfg){
    // Google vs guest
    await askAuthChoicePersistent();

    // Only ask demographics when needed (with same/new question)
    await ensureDemographicsOnce();

    // Start study
    L.setContext({ participant_id: stableParticipantId() });
    return runStudy(cfg);
  }).catch(function(e){
    console.error(e);
    show("Config error","Could not load public/block.yaml");
  });

})(); // end IIFE
