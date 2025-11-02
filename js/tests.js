// TestsUI v3.11 — Improved clarity for TLX form (readable spacing + contrast).
// Theme: #402F1D; buttons styled for better visibility.

window.TestsUI = (() => {
  const L = window.StudyLogger;
  console.log("TestsUI v3.27 loaded");

  // Theme colors
  const TH = "#402F1D", TH_LIGHT = "#4B3826", BORDER = "#2F2114", TXT = "#f9f7f5", HOVER = "#5A4029";
  const BTN_BG = "#F7F3EE", BTN_BORDER = "#D3C5B6", BTN_ACTIVE = "#DCC9B2", BTN_TXT = "#1C1917";

  // ---------- Globals ----------
  let IN_TESTS = false;
  let lastUntrap = null;
  let hostCreatedAt = 0;

  function trapKeys() {
    if (lastUntrap) { try { lastUntrap(); } catch(_) {} lastUntrap = null; }
    function eat(e) { if (document.getElementById("tests-host")) { e.stopPropagation(); e.preventDefault(); } }
    document.addEventListener("keydown", eat, true);
    document.addEventListener("keyup", eat, true);
    const untrap = () => {
      document.removeEventListener("keydown", eat, true);
      document.removeEventListener("keyup", eat, true);
    };
    window.__tests_untrap = untrap;
    lastUntrap = untrap;
    return untrap;
  }

  function ensureHost() {
    let el = document.getElementById("tests-host");
    if (el) return el;
    el = document.createElement("div");
    el.id = "tests-host";
    Object.assign(el.style, {
      position: "fixed", inset: 0, display: "grid", placeItems: "center",
      background: "rgba(64,47,29,.55)", zIndex: 10000
    });
    el.tabIndex = -1;
    document.body.appendChild(el);
    el.focus();
    hostCreatedAt = Date.now();
    return el;
  }

  function clearHost() { const el = document.getElementById("tests-host"); if (el) el.remove(); }

  function emergencyExit() {
    try { clearHost(); } catch(_) {}
    try { lastUntrap?.(); } catch(_) {}
    try { window.__tests_untrap?.(); } catch(_) {}
    IN_TESTS = false;
  }
  window.TestsUIEmergencyClear = emergencyExit;

  window.addEventListener("keydown", (e) => {
    if (!IN_TESTS) return;
    if (e.key === "Escape") { e.preventDefault(); emergencyExit(); }
  }, true);

  // ---------- TLX ----------
  const QUESTIONS = [
    ["How hurried or rushed were you feeling while playing?"],
    ["How much mental effort did you need to play well?"],
    ["How successful were you in accomplishing what you aimed to do in the game?"],
    ["How irritated, stressed, or annoyed did you feel?"],
    ["How mentally demanding or complex was the game?"],
    ["How physically demanding was the task?"]
  ];

  async function runTLX(blockId) {
    return new Promise(resolve => {
      const host = ensureHost();
      host.innerHTML = "";

      const card = document.createElement("div");
      Object.assign(card.style, {
        width: "min(760px,92vw)", background: TH_LIGHT, color: TXT,
        border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "26px 24px",
        font: "15px/1.6 system-ui", boxShadow: "0 16px 48px rgba(0,0,0,.4)",
        display: "flex", flexDirection: "column", gap: "16px", maxHeight: "90vh", overflowY: "auto"
      });

      const title = document.createElement("div");
      title.textContent = "Workload Ratings";
      Object.assign(title.style, { fontWeight: 700, fontSize: "20px", marginBottom: "2px" });
      card.appendChild(title);

      const info = document.createElement("div");
      info.textContent = "Rate each from 0 (very low) to 9 (very high).";
      Object.assign(info.style, { opacity: 0.9, fontSize: "14px", marginBottom: "8px" });
      card.appendChild(info);

      const answers = {};
      const total = QUESTIONS.length;

      QUESTIONS.forEach((q, i) => {
        const wrap = document.createElement("div");
        Object.assign(wrap.style, { display: "flex", flexDirection: "column", gap: "8px" });

        const lbl = document.createElement("div");
        lbl.textContent = q[0];
        Object.assign(lbl.style, { fontWeight: 500 });

        const row = document.createElement("div");
        Object.assign(row.style, { display: "flex", gap: "6px", flexWrap: "wrap" });

        for (let n = 0; n <= 9; n++) {
          const b = document.createElement("button");
          b.textContent = n;
          b.type = "button";
          Object.assign(b.style, {
            border: `1px solid ${BTN_BORDER}`, borderRadius: "8px",
            padding: "6px 10px", minWidth: "34px", cursor: "pointer",
            background: BTN_BG, color: BTN_TXT, fontWeight: 500, transition: "all 0.2s ease"
          });
          b.onmouseenter = () => (b.style.background = BTN_ACTIVE);
          b.onmouseleave = () => {
            if (answers[i] !== n) b.style.background = BTN_BG;
          };
          b.onclick = () => {
            answers[i] = n;
            [...row.children].forEach(x => x.style.background = BTN_BG);
            b.style.background = BTN_ACTIVE;
            updateProgress();
          };
          row.appendChild(b);
        }

        wrap.appendChild(lbl);
        wrap.appendChild(row);
        card.appendChild(wrap);
      });

      const footer = document.createElement("div");
      Object.assign(footer.style, {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: "10px", borderTop: `1px solid ${BORDER}`, paddingTop: "12px"
      });

      const progress = document.createElement("div");
      progress.textContent = `Answered 0 / ${total}`;
      progress.style.opacity = 0.8;
      footer.appendChild(progress);

      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Continue";
      Object.assign(nextBtn.style, {
        borderRadius: "10px", padding: "8px 14px", fontWeight: 600,
        border: "1px solid #cab69e", background: "#cab69e", color: "#1C1917",
        opacity: 0.6, cursor: "not-allowed", transition: "all 0.2s ease"
      });
      footer.appendChild(nextBtn);
      card.appendChild(footer);
      host.appendChild(card);

      function updateProgress() {
        const count = Object.keys(answers).length;
        progress.textContent = `Answered ${count} / ${total}`;
        if (count === total) {
          nextBtn.style.opacity = 1;
          nextBtn.style.cursor = "pointer";
          nextBtn.onclick = () => {
            for (let i = 0; i < total; i++) {
              L.log("test", `TLX_${i}`, answers[i], { block: blockId });
            }
            clearHost();
            resolve();
          };
        }
      }
    });
  }

  // ---------- SAM ----------
  async function runSAM(blockId) {
    return new Promise(resolve => {
      const host = ensureHost();
      host.innerHTML = "";

      const card = document.createElement("div");
      Object.assign(card.style, {
        width: "min(560px,92vw)", background: TH_LIGHT, color: TXT,
        border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "20px",
        font: "14px system-ui", boxShadow: "0 16px 40px rgba(0,0,0,.35)",
        textAlign: "center"
      });
      card.innerHTML = `<div style="font-weight:700;font-size:18px;margin-bottom:10px">Feelings during play</div>
        <div style="opacity:.9">Use 1–9 for each question.</div>
        <div id="sam-q" style="margin-top:12px;text-align:left"></div>`;
      host.appendChild(card);

      const div = card.querySelector("#sam-q");
      const ratings = {};
      div.appendChild(makeQuestion("overall_feeling","How did you feel overall while playing? (Bad → Good)",ratings));
      div.appendChild(makeQuestion("alertness","How alert did you feel while playing? (Sleepy → Alert)",ratings));

      const btn = document.createElement("button");
      btn.textContent = "Continue";
      Object.assign(btn.style, {
        marginTop:"14px", padding:"8px 14px", border:`1px solid #cab69e`, borderRadius:"8px",
        background:"#cab69e", color:"#1C1917", fontWeight:700, cursor:"pointer"
      });
      btn.onclick = () => {
        if (!ratings.overall_feeling || !ratings.alertness) return;
        L.log("test","SAM_valence",ratings.overall_feeling,{});
        L.log("test","SAM_arousal",ratings.alertness,{});
        clearHost();
        resolve();
      };
      card.appendChild(btn);

      function makeQuestion(key, title, obj){
        const wrap=document.createElement("div");
        wrap.innerHTML=`<div style="margin-top:10px;font-weight:600">${title}</div>`;
        const row=document.createElement("div");
        Object.assign(row.style,{marginTop:"6px"});
        for(let n=1;n<=9;n++){
          const b=document.createElement("button");
          b.textContent=n;
          Object.assign(b.style,{margin:"4px",padding:"6px 8px",border:`1px solid ${BORDER}`,borderRadius:"6px",background:BTN_BG,color:BTN_TXT,cursor:"pointer"});
          b.onclick=()=>{obj[key]=n;[...row.querySelectorAll("button")].forEach(x=>x.style.background=BTN_BG);b.style.background=BTN_ACTIVE;};
          row.appendChild(b);
        }
        wrap.appendChild(row);return wrap;
      }
    });
  }

  // ---------- Stroop (normal font) ----------
  async function runStroop(blockId) {
    return new Promise(resolver => {
      const host = ensureHost();
      host.innerHTML = "";

      const card = document.createElement("div");
      Object.assign(card.style, {
        width: "min(720px,92vw)", background: TH_LIGHT, color: TXT,
        border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "18px",
        font: "14px system-ui", boxShadow: "0 16px 40px rgba(0,0,0,.35)"
      });
      card.innerHTML = `
        <div style="font-weight:700;font-size:18px;margin-bottom:4px">Color-Word Task</div>
        <div style="opacity:.9;margin-bottom:10px">
          Click the option that matches the <b>color</b> of the word.
        </div>
        <div id="stroop-chip" style="background:${BTN_BG};border:1px solid ${BTN_BORDER};border-radius:12px;padding:14px;text-align:center;margin:12px 0;">
          <div id="stroop-word" style="font-size:38px;font-weight:400;color:${BTN_TXT};"></div>
        </div>
        <div id="stroop-options" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:8px"></div>
        <div id="stroop-progress" style="opacity:.9"></div>`;
      host.appendChild(card);

      const colors = [
        { name: "red", hex: "#FF0000" },
        { name: "green", hex: "#00A94F" },
        { name: "blue", hex: "#0057E7" },
        { name: "yellow", hex: "#FFDA03" }
      ];
      const words = ["RED","GREEN","BLUE","YELLOW"];

      const trials=[]; for(let i=0;i<10;i++){const idx=Math.floor(Math.random()*4);trials.push({congruent:true,word:words[idx],color:colors[idx].name});}
      for(let i=0;i<10;i++){const wi=Math.floor(Math.random()*4);let ci=Math.floor(Math.random()*4);while(ci===wi)ci=Math.floor(Math.random()*4);trials.push({congruent:false,word:words[wi],color:colors[ci].name});}

      let trial=0,correct=0;const rts=[];
      const wordEl=card.querySelector("#stroop-word"),optsEl=card.querySelector("#stroop-options"),progEl=card.querySelector("#stroop-progress");

      function renderOptions(onChoose){optsEl.innerHTML="";for(const c of colors){const b=document.createElement("button");b.type="button";b.textContent=c.name.toUpperCase();Object.assign(b.style,{fontWeight:600,padding:"10px",border:`1px solid ${BTN_BORDER}`,borderRadius:"10px",background:BTN_BG,color:BTN_TXT,cursor:"pointer"});b.onclick=()=>onChoose(c.name);optsEl.appendChild(b);}}

      let t0=0;function showTrial(){const t=trials[trial];wordEl.textContent=t.word;wordEl.style.color=colors.find(x=>x.name===t.color)?.hex||t.color;progEl.textContent=`Trial ${trial+1}/20`;t0=performance.now();renderOptions(choice=>{const rt=performance.now()-t0;const ok=choice===t.color;if(ok)correct++;rts.push(rt);L.log("test","Stroop_trial",ok?1:0,{block:blockId,trial:trial+1,word:t.word,color:t.color,chosen:choice,rt_ms:Math.round(rt)});trial++;if(trial>=20){clearHost();resolver();}else showTrial();});}
      showTrial();
    });
  }

  async function runTests(list, blockId, _opts) {
    IN_TESTS = true;
    const untrap = trapKeys();
    try {
      for (const name of list || []) {
        if (name === "TLX") await runTLX(blockId);
        if (name === "SAM") await runSAM(blockId);
        if (name === "Stroop") await runStroop(blockId);
      }
    } finally {
      try { untrap(); } catch(_) {}
      IN_TESTS = false;
      clearHost();
    }
  }

  return { runTests, emergencyExit };
})();
