// NJ need page: choropleth of the need score, group cards, and a table view.
(function () {
  const RAMP = ["#FFF4C7", "#FFDF7A", "#F2B53A", "#C98415", "#7A4E08"];
  const BREAKS = [45, 50, 55, 60];
  const GROUPS = {
    south: { en: "South Jersey: hard to reach", es: "Sur de Jersey: difícil acceso",
      den: "High need, and the most people living far from healthy food. Highest unemployment.", des: "Mucha necesidad y la mayor cantidad de personas lejos de comida saludable. El desempleo más alto." },
    urban: { en: "Cities: very high numbers", es: "Ciudades: muchísimas personas",
      den: "Food stores are close, but rates and counts are high. Essex alone has about 123,000 food-insecure people.", des: "Las tiendas están cerca, pero las tasas y los números son altos. Solo Essex tiene unas 123,000 personas con inseguridad alimentaria." },
    other: { en: "Lower rates, still many people", es: "Tasas más bajas, todavía muchas personas",
      den: "Below-average rates, but large counties still have big numbers. Middlesex has about 89,800 food-insecure people.", des: "Tasas bajo el promedio, pero los condados grandes tienen números altos. Middlesex tiene unas 89,800 personas con inseguridad alimentaria." },
  };
  let data = null, sel = "Middlesex", view = "score";
  const PET_BREAKS = [3000, 6000, 10000, 15000];
  const fillFor = c => view === "pets" ? RAMP[PET_BREAKS.filter(b => c.pet_hh_est >= b).length] : color(c.need_score);
  const es = () => PP.lang === "es";
  const color = s => RAMP[BREAKS.filter(b => s >= b).length];
  const n = x => x.toLocaleString(es() ? "es-US" : "en-US");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function detail(c) {
    const g = GROUPS[c.group];
    const rows = es()
      ? [["Hogares con mascotas e inseguridad alimentaria (est.)", "~" + n(c.pet_hh_low) + " a " + n(c.pet_hh_est)], ["Puntaje de necesidad", c.need_score.toFixed(1)], ["Inseguridad alimentaria", c.food_insecure_pct + "%"], ["Personas", "~" + n(c.food_insecure_people)], ["Niños con inseguridad alimentaria", c.child_food_insecure_pct + "%"], ["Pobreza", c.poverty_pct + "%"], ["Acceso limitado a comida saludable", c.limited_access_pct + "%"], ["Desempleo", c.unemployment_pct + "%"]]
      : [["Food-insecure households with a pet (est.)", "~" + n(c.pet_hh_low) + " to " + n(c.pet_hh_est)], ["Need score", c.need_score.toFixed(1)], ["Food insecurity", c.food_insecure_pct + "%"], ["People", "~" + n(c.food_insecure_people)], ["Children food insecure", c.child_food_insecure_pct + "%"], ["Poverty", c.poverty_pct + "%"], ["Limited access to healthy food", c.limited_access_pct + "%"], ["Unemployment", c.unemployment_pct + "%"]];
    document.getElementById("detail").innerHTML =
      `<h3>${esc(c.county)} ${es() ? "" : "County"}</h3><p class="badge" style="margin-top:6px">${esc(es() ? g.es : g.en)}</p>
       <dl class="kv">${rows.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl>`;
    document.querySelectorAll("#map path").forEach(p => p.classList.toggle("on", p.dataset.c === c.county));
    explain(c);
  }


  // Explainer: how the selected county's score is built. Each ingredient is compared with the
  // average NJ county (z-score). The score is 50 plus 2.5 points per ingredient per standard deviation.
  const ING = [
    ["food_insecure_pct", "Food insecurity", "Inseguridad alimentaria"],
    ["poverty_pct", "Poverty", "Pobreza"],
    ["limited_access_pct", "Limited access to healthy food", "Acceso limitado a comida saludable"],
    ["unemployment_pct", "Unemployment", "Desempleo"],
  ];
  let stats = null;
  function explain(c) {
    const el = document.getElementById("explain");
    if (!el) return;
    if (!stats) stats = ING.map(([k]) => { const v = data.counties.map(x => x[k]); const m = v.reduce((a, b) => a + b, 0) / v.length; return [m, Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length)]; });
    const pts = ING.map(([k], i) => 2.5 * (c[k] - stats[i][0]) / stats[i][1]);
    const max = 8;
    const rows = ING.map(([k, en, sp], i) => {
      const v = pts[i], w = Math.min(50, Math.abs(v) / max * 50);
      const side = v >= 0 ? `left:50%;width:${w}%` : `right:50%;width:${w}%`;
      return `<div class="ex-row"><span class="ex-lab">${esc(es() ? sp : en)}<small>${c[k]}% ${es() ? "aquí, promedio" : "here, average"} ${stats[i][0].toFixed(1)}%</small></span>
        <span class="ex-track"><span class="ex-bar ${v >= 0 ? "up" : "down"}" style="${side}"></span></span>
        <span class="ex-val">${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}</span></div>`;
    }).join("");
    const total = 50 + pts.reduce((a, b) => a + b, 0);
    const top = ING[pts.indexOf(Math.max(...pts))], low = ING[pts.indexOf(Math.min(...pts))];
    const hi = Math.max(...pts), lo = Math.min(...pts);
    let why;
    if (hi <= 0) why = es() ? `Los cuatro números de ${c.county} están por debajo del promedio de NJ, así que su puntaje queda bajo 50. El que más lo baja: ${low[2].toLowerCase()}.` : `All four of ${c.county}'s numbers are below the NJ average, so its score lands under 50. The one that pulls it down the most: ${low[1].toLowerCase()}.`;
    else if (lo >= 0) why = es() ? `Los cuatro números de ${c.county} están por encima del promedio de NJ. El que más sube el puntaje: ${top[2].toLowerCase()}.` : `All four of ${c.county}'s numbers are above the NJ average. The one that pushes the score up the most: ${top[1].toLowerCase()}.`;
    else why = es() ? `Lo que más sube el puntaje de ${c.county}: ${top[2].toLowerCase()}. Lo que más lo baja: ${low[2].toLowerCase()}.` : `What pushes ${c.county}'s score up the most: ${top[1].toLowerCase()}. What pulls it down the most: ${low[1].toLowerCase()}.`;
    el.innerHTML = `<h3>${es() ? "Por qué " + esc(c.county) + " tiene " + c.need_score.toFixed(1) : "Why " + esc(c.county) + " scores " + c.need_score.toFixed(1)}</h3>
      <p class="muted small">${es() ? "Cada condado empieza en 50, el promedio de NJ. Cada ingrediente suma o resta puntos según qué tan lejos está del promedio." : "Every county starts at 50, the NJ average. Each ingredient adds or subtracts points depending on how far it is from average."}</p>
      <div class="ex-head"><span></span><span class="ex-track ex-axis"><em>${es() ? "baja el puntaje" : "lowers score"}</em><em>${es() ? "sube el puntaje" : "raises score"}</em></span><span></span></div>
      ${rows}
      <p class="ex-sum">50 ${pts.map(v => (v >= 0 ? "+ " : "− ") + Math.abs(v).toFixed(1)).join(" ")} = <strong>${total.toFixed(1)}</strong></p>
      <p>${esc(why)}</p>`;
  }

  function render() {
    if (!data) return;
    const svg = document.getElementById("map");
    svg.setAttribute("viewBox", data.viewBox);
    svg.innerHTML = data.counties.map(c => `<path data-c="${esc(c.county)}" d="${c.path}" fill="${fillFor(c)}" tabindex="0"><title>${esc(c.county)}: ${view === "pets" ? "~" + n(c.pet_hh_est) + (es() ? " hogares con mascotas" : " pet households") : c.need_score.toFixed(1)}</title></path>`).join("");
    svg.querySelectorAll("path").forEach(p => {
      const c = data.counties.find(x => x.county === p.dataset.c);
      const pick = () => { sel = c.county; detail(c); };
      p.addEventListener("mouseenter", pick); p.addEventListener("click", pick); p.addEventListener("focus", pick);
    });
    document.getElementById("legend").innerHTML = RAMP.map(c => `<span style="background:${c}"></span>`).join("");
    document.querySelectorAll("[data-view]").forEach(b => { b.setAttribute("aria-pressed", b.dataset.view === view ? "true" : "false"); b.onclick = () => { view = b.dataset.view; render(); try { window.ppTrack && window.ppTrack("need_view", { view: view }); } catch (e) { /* ignore */ } }; });
    const ll = document.querySelector(".legend-labels");
    if (ll) ll.innerHTML = view === "pets" ? `<span>${es() ? "Menos hogares" : "Fewer households"}</span><span>${es() ? "Más hogares" : "More households"}</span>` : `<span>${es() ? "Menos necesidad" : "Lower need"}</span><span>${es() ? "Más necesidad" : "Higher need"}</span>`;
    const pn = document.getElementById("petNeed");
    if (pn && data.pet_need) {
      const top = [...data.counties].sort((a, b) => b.pet_hh_est - a.pet_hh_est);
      const max = top[0].pet_hh_est;
      pn.innerHTML = `<p class="pn-total"><b>~${n(data.pet_need.total_low)} ${es() ? "a" : "to"} ${n(data.pet_need.total_est)}</b> ${es() ? "hogares de Nueva Jersey tienen una mascota y pasan hambre, según mi estimación. Middlesex es el número 4." : "New Jersey households have a pet and face food insecurity, by my estimate. Middlesex ranks 4th."}</p>
        <div class="pn-list">${top.map((c, i) => `<div class="pn-row${c.county === "Middlesex" ? " me" : ""}"><span>${i + 1}. ${esc(c.county)}</span><span class="pn-track"><span style="width:${100 * c.pet_hh_est / max}%"></span></span><span class="pn-val">~${n(c.pet_hh_est)}</span></div>`).join("")}</div>
        <details class="pn-how"><summary>${es() ? "Cómo lo calculé" : "How I calculated it"}</summary><p>${es() ? "Personas con inseguridad alimentaria ÷ 2.6 personas por hogar × 47% de hogares de NJ con mascota. El número bajo usa 38%, porque los hogares con menos ingresos tienen mascotas con un poco menos de frecuencia. Es una estimación, no un conteo: nadie publica datos de mascotas por condado." : "Food-insecure people ÷ 2.6 people per household × 47% of NJ households that own a pet. The low number uses 38%, since lower-income households own pets a little less often. It's an estimate, not a count: nobody publishes pet data by county."}</p><p class="muted small">${esc(data.pet_need.sources.pet_share)}. ${esc(data.pet_need.sources.household_size)}.</p></details>`;
    }
    detail(data.counties.find(x => x.county === sel));
    document.getElementById("groups").innerHTML = ["south", "urban", "other"].map(k => {
      const names = data.counties.filter(c => c.group === k).map(c => c.county).join(", ");
      const g = GROUPS[k];
      return `<div class="card${k === "other" ? "" : " butter"}"><h3>${esc(es() ? g.es : g.en)}</h3><p>${esc(es() ? g.des : g.den)}</p><p class="muted small">${esc(names)}</p></div>`;
    }).join("");
    const head = es() ? ["Condado", "Puntaje", "Insegur. alim.", "Personas", "Pobreza", "Acceso limitado", "Desempleo"] : ["County", "Need score", "Food insecure", "People", "Poverty", "Limited access", "Unemployed"];
    document.getElementById("table").innerHTML = `<thead><tr>${head.map((h, i) => `<th${i ? ' class="num"' : ""}>${h}</th>`).join("")}</tr></thead><tbody>` +
      data.counties.map(c => `<tr><td>${esc(c.county)}</td><td class="num">${c.need_score.toFixed(1)}</td><td class="num">${c.food_insecure_pct}%</td><td class="num">${n(c.food_insecure_people)}</td><td class="num">${c.poverty_pct}%</td><td class="num">${c.limited_access_pct}%</td><td class="num">${c.unemployment_pct}%</td></tr>`).join("") + "</tbody>";
    const s = data.sources;
    document.getElementById("sources").innerHTML = (es() ? "Fuentes: " : "Sources: ") + esc([s.food_insecurity, s.poverty, s.limited_access, s.unemployment, s.population].join("; ")) +
      '. <a href="https://nj.gov/foodsecurity/documents/The%20State%20of%20Food%20Security%20in%20New%20Jersey%20-%20A%20Data%20Chart%20Book_12.10.2025_FINAL.pdf" target="_blank" rel="noopener">' + (es() ? "Ver el informe" : "See the report") + "</a>.";
  }
  document.addEventListener("DOMContentLoaded", () => fetch("data/counties.json").then(r => r.json()).then(d => { data = d; render(); }));
  document.addEventListener("pp:lang", render);
})();
