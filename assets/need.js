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
      den: "Below-average rates, but large counties still have big numbers. Middlesex has about 92,600 food-insecure people.", des: "Tasas bajo el promedio, pero los condados grandes tienen números altos. Middlesex tiene unas 92,600 personas con inseguridad alimentaria." },
  };
  let data = null, sel = "Middlesex";
  const es = () => PP.lang === "es";
  const color = s => RAMP[BREAKS.filter(b => s >= b).length];
  const n = x => x.toLocaleString(es() ? "es-US" : "en-US");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function detail(c) {
    const g = GROUPS[c.group];
    const rows = es()
      ? [["Puntaje de necesidad", c.need_score.toFixed(1)], ["Inseguridad alimentaria", c.food_insecure_pct + "%"], ["Personas", "~" + n(c.food_insecure_people)], ["Niños con inseguridad alimentaria", c.child_food_insecure_pct + "%"], ["Pobreza", c.poverty_pct + "%"], ["Acceso limitado a comida saludable", c.limited_access_pct + "%"], ["Desempleo", c.unemployment_pct + "%"]]
      : [["Need score", c.need_score.toFixed(1)], ["Food insecurity", c.food_insecure_pct + "%"], ["People", "~" + n(c.food_insecure_people)], ["Children food insecure", c.child_food_insecure_pct + "%"], ["Poverty", c.poverty_pct + "%"], ["Limited access to healthy food", c.limited_access_pct + "%"], ["Unemployment", c.unemployment_pct + "%"]];
    document.getElementById("detail").innerHTML =
      `<h3>${esc(c.county)} ${es() ? "" : "County"}</h3><p class="badge" style="margin-top:6px">${esc(es() ? g.es : g.en)}</p>
       <dl class="kv">${rows.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl>`;
    document.querySelectorAll("#map path").forEach(p => p.classList.toggle("on", p.dataset.c === c.county));
  }

  function render() {
    if (!data) return;
    const svg = document.getElementById("map");
    svg.setAttribute("viewBox", data.viewBox);
    svg.innerHTML = data.counties.map(c => `<path data-c="${esc(c.county)}" d="${c.path}" fill="${color(c.need_score)}" tabindex="0"><title>${esc(c.county)}: ${c.need_score.toFixed(1)}</title></path>`).join("");
    svg.querySelectorAll("path").forEach(p => {
      const c = data.counties.find(x => x.county === p.dataset.c);
      const pick = () => { sel = c.county; detail(c); };
      p.addEventListener("mouseenter", pick); p.addEventListener("click", pick); p.addEventListener("focus", pick);
    });
    document.getElementById("legend").innerHTML = RAMP.map(c => `<span style="background:${c}"></span>`).join("");
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
