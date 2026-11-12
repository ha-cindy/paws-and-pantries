// Retro desktop: taskbar, Start menu, clock, and "Ask Zuzu", a rule-based helper.
// Ask Zuzu is NOT a chatbot. It matches keywords to a fixed set of answers built from this
// site's own listings (data/places.json), so it cannot make anything up.
(function () {
  const es = () => window.PP && PP.lang === "es";
  const tr = (en, sp) => es() ? sp : en;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const track = (n, p) => { try { window.ppTrack && window.ppTrack(n, p || {}); } catch (e) { /* ignore */ } };
  const tel = p => `<a href="tel:${esc(String(p).replace(/[^0-9+]/g, ""))}">${esc(p)}</a>`;
  let places = [];

  // The four big chips people see first, then two smaller ones.
  const INTENTS = [
    { id: "food", en: "Pet food near me", es: "Comida para mascotas cerca", kw: ["food", "hungry", "feed", "pantry", "kibble", "comida", "aliment", "despensa", "hambre"], town: true },
    { id: "spay", en: "Low-cost spay or neuter", es: "Esterilizar a bajo costo", kw: ["spay", "neuter", "fix", "esteriliz", "castr"], town: true },
    { id: "now", en: "I need help today", es: "Necesito ayuda hoy", kw: ["today", "now", "help", "emergency", "urgent", "211", "person", "human", "hoy", "ahora", "ayuda", "emergencia", "urgente", "persona"] },
    { id: "adopt", en: "Adopt", es: "Adoptar", kw: ["adopt", "shelter", "rescue", "kitten", "puppy", "refugio", "rescate", "gatito", "perrito", "cachorro"], town: true },
    { id: "vet", en: "Vet care", es: "Veterinario", kw: ["vet", "sick", "shot", "vaccin", "rabies", "doctor", "hurt", "veterin", "vacuna", "enferm", "rabia"], small: true },
    { id: "about", en: "Who made this?", es: "¿Quién hizo esto?", kw: ["who", "cindy", "zuzu", "about", "made", "quien", "quién", "hizo"], small: true },
  ];
  // Rough town centers for Middlesex County, only used to sort places closest first.
  const TOWNS = {
    "Carteret": [40.5773, -74.2282], "Colonia": [40.5934, -74.3149], "Cranbury": [40.3162, -74.5138], "Dunellen": [40.5893, -74.4718],
    "East Brunswick": [40.4279, -74.416], "Edison": [40.5187, -74.4121], "Helmetta": [40.3768, -74.4246], "Highland Park": [40.4959, -74.4243],
    "Iselin": [40.5754, -74.3224], "Jamesburg": [40.3523, -74.4401], "Metuchen": [40.5432, -74.3632], "Middlesex": [40.5726, -74.4929],
    "Milltown": [40.4562, -74.4432], "Monroe": [40.32, -74.43], "New Brunswick": [40.4862, -74.4518], "North Brunswick": [40.449, -74.4818],
    "Old Bridge": [40.4146, -74.3654], "Perth Amboy": [40.5068, -74.2654], "Piscataway": [40.5543, -74.4643], "Plainsboro": [40.3329, -74.5682],
    "Sayreville": [40.4593, -74.361], "Sewaren": [40.5532, -74.2588], "South Amboy": [40.4779, -74.2907], "South Brunswick": [40.384, -74.531],
    "South Plainfield": [40.5793, -74.4115], "South River": [40.4465, -74.386], "Spotswood": [40.3918, -74.3985], "Woodbridge": [40.5576, -74.2846],
  };
  const CHIP_TOWNS = ["New Brunswick", "Edison", "Woodbridge", "Perth Amboy", "Piscataway", "East Brunswick", "Old Bridge", "Sayreville"];
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  const findTown = (text) => { const t = " " + norm(text) + " "; return Object.keys(TOWNS).sort((a, b) => b.length - a.length).find(k => t.includes(" " + norm(k) + " ")); };
  const miles = (a, b) => { const R = 3958.8, r = x => x * Math.PI / 180, dLa = r(b[0] - a[0]), dLo = r(b[1] - a[1]); const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  const nearest = (type, town) => {
    const c = TOWNS[town];
    const rows = places.filter(p => p.type === type && p.status !== "zuzu" && p.lat).map(p => ({ p, d: c ? miles(c, [p.lat, p.lon]) : 0 }));
    return c ? rows.sort((a, b) => a.d - b.d).slice(0, 3) : rows.sort((a, b) => a.p.name.localeCompare(b.p.name));
  };
  const card = ({ p, d }) => {
    const name = es() && p.name_es ? p.name_es : p.name;
    const q = encodeURIComponent(`${p.address}, ${p.town}, NJ`);
    const m = Math.round(d);
    const dist = d ? ` · ${d < 0.6 ? tr("under 1 mile", "a menos de 1 milla") : m <= 1 ? tr("about 1 mile", "a 1 milla, más o menos") : tr(`about ${m} miles`, `a unas ${m} millas`)}` : "";
    return `<li class="azu-place"><strong>${esc(name)}</strong><span class="azu-meta">${esc(p.town)}${dist}</span><span class="azu-acts">${p.phone ? `<a class="azu-act" href="tel:${esc(p.phone.replace(/[^0-9+]/g, ""))}" data-place="${esc(p.name)}">${tr("Call", "Llamar")}</a>` : ""}<a class="azu-act" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${q}" data-place="${esc(p.name)}">${tr("Directions", "Cómo llegar")}</a></span></li>`;
  };
  const LEAD = {
    food: ["Closest pet food help to", "La ayuda con comida para mascotas más cerca de"],
    spay: ["Vets in New Jersey's $10 spay and neuter program, closest to", "Veterinarios del programa de esterilización de $10 de Nueva Jersey, más cerca de"],
    adopt: ["Shelters and rescues closest to", "Refugios y rescates más cerca de"],
  };
  const ALL = {
    food: ["Here's every pet food spot I know:", "Estos son todos los lugares con comida para mascotas que conozco:"],
    spay: ["Here are all the vets I know in New Jersey's $10 spay and neuter program:", "Estos son todos los veterinarios que conozco del programa de esterilización de $10 de Nueva Jersey:"],
    adopt: ["Here are all the shelters and rescues I know, A to Z:", "Estos son todos los refugios y rescates que conozco, en orden alfabético:"],
  };
  const TAIL = {
    food: () => `<p class="azu-note">${tr("Call before you go. A lot of pantries only hand out pet food on certain days. You can also dial", "Llame antes de ir. Muchas despensas solo dan comida para mascotas ciertos días. También puede marcar el")} ${tel("211")} ${tr("and ask for pet food near you.", "y pedir comida para mascotas cerca de usted.")}</p>`,
    spay: () => `<p class="azu-note">${tr("It's $10 if you get SNAP, Medicaid, SSI, or Lifeline, and $20 for pets adopted from a NJ shelter. Bring your benefits card when you book.", "Cuesta $10 si recibe SNAP, Medicaid, SSI o Lifeline, y $20 para mascotas adoptadas de un refugio de NJ. Lleve su tarjeta de beneficios cuando haga la cita.")}</p>`,
    adopt: () => `<p class="azu-note">${tr("I came from SAVE in Skillman! Senior cats wait about twice as long, so say hi to the older pets first.", "¡Yo vine de SAVE en Skillman! Los gatos mayores esperan casi el doble, así que salude primero a los mayores.")}</p>`,
  };
  const ANSWERS = {
    now: () => `<p>${tr("Call", "Llame al")} ${tel("211")} ${tr("from any phone, or text your ZIP code to 898211. NJ 2-1-1 has real people on the line, 24/7, and they know about pet food too.", "desde cualquier teléfono, o mande su código postal por texto al 898211. En NJ 2-1-1 contestan personas de verdad, 24/7, y también saben de comida para mascotas.")}</p><p class="azu-note">${tr("If your pet is hurt or sick right now, call the nearest animal hospital first.", "Si su mascota está herida o enferma ahora mismo, llame primero al hospital veterinario más cercano.")}</p>`,
    vet: () => `<p>${tr("Two low-cost options:", "Dos opciones de bajo costo:")}</p><ul><li>${tr("Free rabies shots: Middlesex County towns hold free clinics. Call", "Vacunas gratis contra la rabia: los pueblos del condado de Middlesex hacen clínicas gratis. Llame al")} ${tel("732-745-3100")}.</li><li>${tr("$10 spay or neuter if you get SNAP, Medicaid, SSI, or Lifeline. Tap \"Low-cost spay or neuter\" below.", "Esterilización por $10 si recibe SNAP, Medicaid, SSI o Lifeline. Toque \"Esterilizar a bajo costo\" abajo.")}</li></ul><p class="azu-note">${tr("If your pet is hurt or sick right now, call the nearest animal hospital.", "Si su mascota está herida o enferma ahora mismo, llame al hospital veterinario más cercano.")}</p>`,
    about: () => `<p>${tr("Cindy made this! She's a grad student at Rutgers, and I'm her very chatty shelter cat. I mostly supervise from the bed.", "¡Cindy hizo esto! Es estudiante de posgrado en Rutgers, y yo soy su gata de refugio, bastante habladora. Más que nada superviso desde la cama.")}</p><p><a href="about.html#story">${tr("Read our story", "Lea nuestra historia")}</a></p>`,
    unknown: () => `<p>${tr("I'm a pixel cat, not a genius. Try one of these:", "Soy una gata de píxeles, no una genia. Pruebe una de estas:")}</p>`,
  };
  const match = (text) => {
    const t = text.toLowerCase();
    const hit = INTENTS.find(i => i.kw.some(k => t.includes(k)));
    return hit ? hit.id : "unknown";
  };

  document.addEventListener("DOMContentLoaded", () => {
    const here = (location.pathname.split("/").pop() || "index.html");
    const LINKS = [["./", "Find help", "Ayuda", "index.html"], ["need.html", "NJ need", "Necesidad en NJ", "need.html"], ["wait.html", "Pets who wait", "Mascotas que esperan", "wait.html"], ["club.html", "Zuzu's Club", "El Club de Zuzu", "club.html"], ["about.html", "About", "Sobre mí", "about.html"]];

    const bar = document.createElement("div");
    bar.className = "taskbar"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Taskbar");
    bar.innerHTML = `<button type="button" class="start" id="startBtn" aria-haspopup="true" aria-expanded="false"><img class="pix" src="assets/sprites/zuzu-icon.png" alt="" width="22" height="17"><span data-en="Start" data-es="Inicio">Start</span></button>
      <span class="task on"><img class="pix" src="assets/sprites/zuzu-icon.png" alt="" width="22" height="17"><span>zuzu.bmp</span></span>
      <button type="button" class="task" id="azuTask" aria-pressed="false"><span data-en="Ask Zuzu" data-es="Pregúntele a Zuzu">Ask Zuzu</span></button>
      <a class="task" href="club.html#quiz" data-track="taskbar quiz"><span data-en="Quiz" data-es="Quiz">Quiz</span></a>
      <span class="tb-space"></span><span class="clock" id="clock" aria-hidden="true"></span>`;
    const menu = document.createElement("div");
    menu.className = "startmenu"; menu.hidden = true; menu.setAttribute("role", "menu"); menu.setAttribute("aria-label", "Start menu");
    menu.innerHTML = `<div class="sm-side"><span>Paws &amp; Pantries</span></div><div class="sm-items">` +
      LINKS.map(l => `<a role="menuitem" href="${l[0]}"${here === l[3] || (here === "" && l[3] === "index.html") ? ' aria-current="page"' : ""} data-en="${l[1]}" data-es="${l[2]}">${l[1]}</a>`).join("") +
      `<hr><button type="button" role="menuitem" id="smAsk" data-en="Ask Zuzu" data-es="Pregúntele a Zuzu">Ask Zuzu</button>
       <a role="menuitem" href="club.html#quiz" data-en="Quiz: who waits longer?" data-es="Quiz: ¿quién espera más?">Quiz: who waits longer?</a>
       <a role="menuitem" href="club.html#drawH" data-en="Draw Zuzu a friend" data-es="Dibújele un amigo a Zuzu">Draw Zuzu a friend</a>
       <hr><a role="menuitem" href="tel:211" data-en="Call 2-1-1 for help" data-es="Llame al 2-1-1 para ayuda">Call 2-1-1 for help</a></div>`;

    const azu = document.createElement("div");
    azu.className = "azu"; azu.hidden = true; azu.setAttribute("role", "dialog"); azu.setAttribute("aria-label", "Ask Zuzu");
    azu.innerHTML = `<div class="azu-bar"><span data-en="Ask Zuzu" data-es="Pregúntele a Zuzu">Ask Zuzu</span><button type="button" id="azuX" aria-label="Close">x</button></div>
      <div class="azu-log" id="azuLog" aria-live="polite"></div>
      <div class="azu-quick" id="azuQuick"></div>
      <form class="azu-form" id="azuForm"><input id="azuIn" type="text" autocomplete="off" maxlength="80" aria-label="Type a question"><button class="btn light" type="submit" data-en="Ask" data-es="Enviar">Ask</button></form>
      <p class="azu-fine" data-en="I'm a simple helper that follows rules, not an AI chatbot. I only answer from this site's listings. If I don't understand a question, Cindy sees the first few words (with numbers removed) so she can teach me." data-es="Soy una ayudante sencilla que sigue reglas, no un chatbot de IA. Solo respondo con los lugares de este sitio. Si no entiendo una pregunta, Cindy ve las primeras palabras (sin números) para enseñarme.">I'm a simple helper that follows rules, not an AI chatbot. I only answer from this site's listings. If I don't understand a question, Cindy sees the first few words (never your town or numbers) so she can teach me.</p>`;
    document.body.appendChild(azu); bar.appendChild(menu); document.body.appendChild(bar);
    if (window.PP && PP.apply) try { PP.apply(); } catch (e) { /* ignore */ }

    // clock
    const tick = () => { document.getElementById("clock").textContent = new Date().toLocaleTimeString(es() ? "es-US" : "en-US", { hour: "numeric", minute: "2-digit" }); };
    tick(); setInterval(tick, 20000);

    // start menu
    const startBtn = document.getElementById("startBtn");
    const setMenu = (open) => { menu.hidden = !open; startBtn.setAttribute("aria-expanded", open ? "true" : "false"); startBtn.classList.toggle("on", open); };
    startBtn.addEventListener("click", (e) => { e.stopPropagation(); setMenu(menu.hidden); });
    document.addEventListener("click", (e) => { if (!menu.hidden && !menu.contains(e.target)) setMenu(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setMenu(false); } });

    // Ask Zuzu
    const log = document.getElementById("azuLog"), quick = document.getElementById("azuQuick"), input = document.getElementById("azuIn");
    const say = (html, who) => { const d = document.createElement("div"); d.className = "azu-msg " + who; d.innerHTML = (who === "z" ? '<img class="pix" src="assets/sprites/zuzu-icon.png" alt="" width="22" height="17">' : "") + `<div>${html}</div>`; log.appendChild(d); log.scrollTop = who === "z" ? Math.max(0, d.offsetTop - 40) : log.scrollHeight; };
    // state: "menu" (pick a need) or "town" (waiting for a town for `pending`)
    let mode = "menu", pending = null;
    const intentChips = () => {
      mode = "menu"; pending = null;
      quick.innerHTML = INTENTS.map(i => `<button type="button" class="chip${i.small ? " small" : ""}" data-intent="${i.id}">${esc(tr(i.en, i.es))}</button>`).join("");
      input.placeholder = tr("Or type a question...", "O escriba una pregunta...");
    };
    const townChips = () => {
      mode = "town";
      quick.innerHTML = CHIP_TOWNS.map(t => `<button type="button" class="chip" data-town="${esc(t)}">${esc(t)}</button>`).join("") +
        `<button type="button" class="chip small" data-town="">${esc(tr("Skip, show all", "Omitir, ver todos"))}</button><button type="button" class="chip small" data-back="1">${esc(tr("Back", "Volver"))}</button>`;
      input.placeholder = tr("Type your town...", "Escriba su pueblo...");
    };
    const results = (id, town, how) => {
      const rows = nearest(id, town);
      const lead = town ? `${tr(LEAD[id][0], LEAD[id][1])} ${esc(town)}:` : tr(ALL[id][0], ALL[id][1]);
      say(rows.length
        ? `<p>${lead}</p><ul class="azu-places">${rows.map(card).join("")}</ul>${TAIL[id]()}<p><a href="./#mapH">${tr("See everything on the map", "Ver todo en el mapa")}</a></p>`
        : `<p>${tr("I couldn't load my list just now. Dial", "No pude cargar mi lista ahora. Marque el")} ${tel("211")} ${tr("and they'll find the closest place for you.", "y le buscan el lugar más cercano.")}</p>`, "z");
      track("ask_zuzu", { intent: id, how: how, town_given: town ? "yes" : "no" });
      intentChips();
    };
    const pick = (id, how, text) => {
      const it = INTENTS.find(i => i.id === id);
      if (it && it.town) {
        const t = text ? findTown(text) : null;
        if (t) return results(id, t, how);
        pending = id;
        say(tr("Which town are you in? I'll put the closest ones first.", "¿En qué pueblo está? Le pongo primero los más cercanos."), "z");
        track("ask_zuzu", { intent: id, how: how });
        return townChips();
      }
      say(ANSWERS[id](), "z");
      track("ask_zuzu", { intent: id, how: how });
      intentChips();
    };
    const scrub = (v) => v.replace(/\S+@\S+/g, "[email]").replace(/[0-9]/g, "#").slice(0, 60);
    const miss = (v) => {
      say(ANSWERS.unknown(), "z");
      track("ask_zuzu_miss", { q: scrub(v) });
      intentChips();
    };
    const open = (on) => {
      azu.hidden = !on; document.getElementById("azuTask").setAttribute("aria-pressed", on ? "true" : "false"); document.getElementById("azuTask").classList.toggle("on", on);
      if (on && !log.children.length) { say(tr("Hi! I'm Zuzu. Cindy's busy, so you get me. What does your pet need? Tap one:", "¡Hola! Soy Zuzu. Cindy está ocupada, así que le toca conmigo. ¿Qué necesita su mascota? Toque una opción:"), "z"); intentChips(); }
      if (on) { track("ask_zuzu_open", {}); const f = quick.querySelector("button"); if (f) f.focus(); }
    };
    document.getElementById("azuTask").addEventListener("click", () => open(azu.hidden));
    document.getElementById("smAsk").addEventListener("click", () => { setMenu(false); open(true); });
    document.getElementById("azuX").addEventListener("click", () => open(false));
    quick.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.back) { say(esc(b.textContent), "u"); say(tr("Okay! What else can I help with?", "¡Listo! ¿En qué más le ayudo?"), "z"); return intentChips(); }
      if (b.dataset.intent) { say(esc(b.textContent), "u"); return pick(b.dataset.intent, "button"); }
      if (b.dataset.town !== undefined && pending) { say(esc(b.textContent), "u"); return results(pending, b.dataset.town, "button"); }
    });
    document.getElementById("azuForm").addEventListener("submit", (e) => {
      e.preventDefault(); const v = input.value.trim(); if (!v) return; say(esc(v), "u"); input.value = "";
      if (mode === "town" && pending) {
        const t = findTown(v);
        if (t) return results(pending, t, "typed");
        const id = match(v);
        if (id !== "unknown") return pick(id, "typed", v);
        track("ask_zuzu_miss", { q: "(town not recognized)" });
        say(tr("Hmm, I only know Middlesex County towns. Tap one below, or skip and I'll show them all.", "Mmm, solo conozco pueblos del condado de Middlesex. Toque uno abajo, u omita y le muestro todos."), "z");
        return;
      }
      const id = match(v);
      if (id === "unknown") return miss(v);
      pick(id, "typed", v);
    });
    document.addEventListener("pp:lang", () => { tick(); if (!azu.hidden) { if (mode === "town") townChips(); else intentChips(); } });

    fetch("data/places.json").then(r => r.json()).then(d => { places = d.places; }).catch(() => { /* answers still work without the list */ });
  });
})();
