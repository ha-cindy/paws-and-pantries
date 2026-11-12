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

  const INTENTS = [
    { id: "food", en: "I need pet food", es: "Necesito comida para mi mascota", kw: ["food", "hungry", "feed", "pantry", "kibble", "comida", "aliment", "despensa", "hambre"] },
    { id: "vet", en: "Low-cost vet care", es: "Veterinario de bajo costo", kw: ["vet", "sick", "shot", "vaccin", "rabies", "doctor", "hurt", "veterin", "vacuna", "enferm", "rabia"] },
    { id: "spay", en: "Spay or neuter", es: "Esterilización", kw: ["spay", "neuter", "fix", "esteriliz", "castr"] },
    { id: "adopt", en: "Adopt a pet", es: "Adoptar una mascota", kw: ["adopt", "shelter", "rescue", "kitten", "puppy", "refugio", "rescate", "gatito", "perrito"] },
    { id: "person", en: "Talk to a person", es: "Hablar con una persona", kw: ["person", "human", "call", "phone", "emergency", "urgent", "211", "persona", "llamar", "emergencia", "urgente"] },
    { id: "about", en: "Who made this?", es: "¿Quién hizo esto?", kw: ["who", "cindy", "zuzu", "about", "made", "quien", "quién", "hizo"] },
  ];
  const list = (type) => places.filter(p => p.type === type && p.status !== "zuzu").map(p => `<li><strong>${esc(es() && p.name_es ? p.name_es : p.name)}</strong>, ${esc(p.town)}${p.phone ? ". " + tel(p.phone) : ""}</li>`).join("");
  const ANSWERS = {
    food: () => `<p>${tr("Here's where to start for pet food:", "Aquí puede empezar para comida de mascotas:")}</p><ul>${list("food")}<li>${tr("Dial", "Marque")} ${tel("211")} ${tr("and ask for pet food near you. Open 24/7.", "y pregunte por comida para mascotas cerca de usted. Abierto 24/7.")}</li></ul><p class="azu-note">${tr("Call before you go. Many pantries give pet food only on certain days.", "Llame antes de ir. Muchas despensas dan comida para mascotas solo ciertos días.")}</p><p><a href="./#mapH">${tr("See it on the map", "Ver en el mapa")}</a></p>`,
    vet: () => `<p>${tr("Two low-cost options:", "Dos opciones de bajo costo:")}</p><ul><li>${tr("Free rabies shots: Middlesex County towns hold free clinics. Call", "Vacunas gratis contra la rabia: los pueblos del condado de Middlesex tienen clínicas gratis. Llame al")} ${tel("732-745-3100")}.</li><li>${tr("$10 spay or neuter if you get SNAP, Medicaid, SSI, or Lifeline. Tap \"Spay or neuter\" below.", "Esterilización por $10 si recibe SNAP, Medicaid, SSI o Lifeline. Toque \"Esterilización\" abajo.")}</li></ul><p class="azu-note">${tr("If your pet is in danger right now, call the nearest animal hospital.", "Si su mascota está en peligro ahora, llame al hospital veterinario más cercano.")}</p>`,
    spay: () => `<p>${tr("New Jersey's program costs $10 if you get SNAP, Medicaid, SSI, or Lifeline, and $20 for pets adopted from a NJ shelter. Call one of these vets to book and bring your benefits ID:", "El programa de Nueva Jersey cuesta $10 si recibe SNAP, Medicaid, SSI o Lifeline, y $20 para mascotas adoptadas de un refugio de NJ. Llame a uno de estos veterinarios y traiga su identificación de beneficios:")}</p><ul>${list("spay")}</ul>`,
    adopt: () => `<p>${tr("These shelters and rescues are in Middlesex County:", "Estos refugios y rescates están en el condado de Middlesex:")}</p><ul>${list("adopt")}</ul><p>${tr("I came from SAVE in Skillman! Senior cats wait about twice as long, so say hi to the older pets first.", "¡Yo vine de SAVE en Skillman! Los gatos mayores esperan casi el doble, así que salude primero a las mascotas mayores.")}</p><p><a href="./#mapH">${tr("See shelters on the map", "Ver refugios en el mapa")}</a></p>`,
    person: () => `<p>${tr("Dial", "Marque")} ${tel("211")} ${tr("from any phone, or text your ZIP code to 898211. NJ 2-1-1 is a help line with real people, open 24/7.", "desde cualquier teléfono, o envíe su código postal por texto al 898211. NJ 2-1-1 es una línea de ayuda con personas reales, abierta 24/7.")}</p>`,
    about: () => `<p>${tr("Cindy made this! She's a grad student at Rutgers, and I'm her very chatty shelter cat. I mostly supervise from the bed.", "¡Cindy hizo esto! Es estudiante de posgrado en Rutgers, y yo soy su gata de refugio, muy habladora. Yo superviso desde la cama.")}</p><p><a href="about.html#story">${tr("Read our story", "Lea nuestra historia")}</a></p>`,
    unknown: () => `<p>${tr("Sorry, I only know a few things. Pick one below, or dial", "Perdón, solo sé algunas cosas. Elija una abajo o marque")} ${tel("211")} ${tr("to talk to a person.", "para hablar con una persona.")}</p>`,
  };
  const match = (text) => {
    const t = text.toLowerCase();
    const hit = INTENTS.find(i => i.kw.some(k => t.includes(k)));
    return hit ? hit.id : "unknown";
  };

  document.addEventListener("DOMContentLoaded", () => {
    const here = (location.pathname.split("/").pop() || "index.html");
    const LINKS = [["./", "Find help", "Ayuda", "index.html"], ["need.html", "NJ need", "Necesidad en NJ", "need.html"], ["wait.html", "Pets who wait", "Mascotas que esperan", "wait.html"], ["club.html", "Zuzu's Club", "El Club de Zuzu", "club.html"], ["about.html", "About", "Acerca de", "about.html"]];

    const bar = document.createElement("div");
    bar.className = "taskbar";
    bar.innerHTML = `<button type="button" class="start" id="startBtn" aria-haspopup="true" aria-expanded="false"><img class="pix" src="assets/zuzu-icon-pix.png" alt="" width="26" height="20"><span data-en="Start" data-es="Inicio">Start</span></button>
      <span class="task on"><img class="pix" src="assets/zuzu-icon-pix.png" alt="" width="20" height="15"><span>zuzu.bmp</span></span>
      <button type="button" class="task" id="azuTask" aria-pressed="false"><span data-en="Ask Zuzu" data-es="Pregúntele a Zuzu">Ask Zuzu</span></button>
      <a class="task" href="club.html#quiz" data-track="taskbar quiz"><span data-en="Quiz" data-es="Quiz">Quiz</span></a>
      <span class="tb-space"></span><span class="clock" id="clock" aria-hidden="true"></span>`;
    const menu = document.createElement("div");
    menu.className = "startmenu"; menu.hidden = true; menu.setAttribute("role", "menu");
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
      <p class="azu-fine" data-en="I'm a simple helper that follows rules, not an AI chatbot. I only answer from this site's listings, and nothing you type is saved." data-es="Soy una ayudante sencilla que sigue reglas, no un chatbot de IA. Solo respondo con los lugares de este sitio, y nada de lo que escriba se guarda.">I'm a simple helper that follows rules, not an AI chatbot. I only answer from this site's listings, and nothing you type is saved.</p>`;
    document.body.appendChild(azu); document.body.appendChild(menu); document.body.appendChild(bar);
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
    const say = (html, who) => { const d = document.createElement("div"); d.className = "azu-msg " + who; d.innerHTML = (who === "z" ? '<img class="pix" src="assets/zuzu-icon-pix.png" alt="" width="30" height="23">' : "") + `<div>${html}</div>`; log.appendChild(d); log.scrollTop = log.scrollHeight; };
    const quicks = () => { quick.innerHTML = INTENTS.map(i => `<button type="button" class="chip" data-intent="${i.id}">${esc(tr(i.en, i.es))}</button>`).join(""); input.placeholder = tr("Type a question...", "Escriba una pregunta..."); };
    const answer = (id, how) => { say(ANSWERS[id](), "z"); track("ask_zuzu", { intent: id, how: how }); };
    const open = (on) => {
      azu.hidden = !on; document.getElementById("azuTask").setAttribute("aria-pressed", on ? "true" : "false"); document.getElementById("azuTask").classList.toggle("on", on);
      if (on && !log.children.length) { say(tr("Hi! I'm Zuzu. Cindy's busy, so you get me. What does your pet need?", "¡Hola! Soy Zuzu. Cindy está ocupada, así que le toca conmigo. ¿Qué necesita su mascota?"), "z"); }
      if (on) { quicks(); track("ask_zuzu_open", {}); }
    };
    document.getElementById("azuTask").addEventListener("click", () => open(azu.hidden));
    document.getElementById("smAsk").addEventListener("click", () => { setMenu(false); open(true); });
    document.getElementById("azuX").addEventListener("click", () => open(false));
    quick.addEventListener("click", (e) => { const b = e.target.closest("[data-intent]"); if (!b) return; say(esc(b.textContent), "u"); answer(b.dataset.intent, "button"); });
    document.getElementById("azuForm").addEventListener("submit", (e) => { e.preventDefault(); const v = input.value.trim(); if (!v) return; say(esc(v), "u"); input.value = ""; answer(match(v), "typed"); });
    document.addEventListener("pp:lang", () => { tick(); if (!azu.hidden) quicks(); });

    fetch("data/places.json").then(r => r.json()).then(d => { places = d.places; }).catch(() => { /* answers still work without the list */ });
  });
})();
