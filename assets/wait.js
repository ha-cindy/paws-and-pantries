// Pets who wait: bar chart of regression effects and a simple "how long might this pet wait" combiner.
(function () {
  let data = null, sp = "cat", age = "young", traits = { black: false, female: false, pit_type: false };
  const es = () => PP.lang === "es";
  const LABEL = {
    age_baby: ["Under 1 year (vs. 1 to 3)", "Menos de 1 año (vs. 1 a 3)"],
    age_adult: ["Adult, 4 to 7 (vs. 1 to 3)", "Adulto, 4 a 7 (vs. 1 a 3)"],
    age_senior: ["Senior, 8+ (vs. 1 to 3)", "Mayor, 8+ (vs. 1 a 3)"],
    black: ["Solid black coat", "Pelaje negro sólido"],
    female: ["Female (vs. male)", "Hembra (vs. macho)"],
    pit_type: ["Pit bull type breed", "Raza tipo pit bull"],
  };
  const AGES = [["baby", "Under 1 year", "Menos de 1 año"], ["young", "1 to 3 years", "1 a 3 años"], ["adult", "4 to 7 years", "4 a 7 años"], ["senior", "8+ years", "8+ años"]];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function bars() {
    const s = data.species[sp], keys = Object.keys(s.effects).sort((a, b) => s.effects[b].pct - s.effects[a].pct);
    const max = Math.max(...keys.map(k => s.effects[k].hi)), min = Math.min(0, ...keys.map(k => s.effects[k].lo));
    const span = max - min, X = v => ((v - min) / span) * 100, zero = X(0);
    document.getElementById("barsH").textContent = es() ? `Cuánto más tiempo esperan (${sp === "cat" ? "gatos" : "perros"})` : `How much longer they wait (${sp === "cat" ? "cats" : "dogs"})`;
    document.getElementById("bars").innerHTML = keys.map(k => {
      const e = s.effects[k], neg = e.pct < 0;
      const left = neg ? X(e.pct) : zero, width = Math.abs(X(e.pct) - zero);
      const val = (e.pct > 0 ? "+" : "") + Math.round(e.pct) + "%";
      return `<div class="bar-row"><span>${esc(LABEL[k][es() ? 1 : 0])}</span>
        <div class="bar-track" title="${esc(LABEL[k][0])}: ${val} (95% CI ${Math.round(e.lo)}% to ${Math.round(e.hi)}%)">
          <span class="bar${neg ? " neg" : ""}" style="left:${left}%;width:${Math.max(width, 0.6)}%;border-radius:${neg ? "4px 0 0 4px" : "0 4px 4px 0"}"></span>
          <span class="whisker" style="left:${X(e.lo)}%;width:${X(e.hi) - X(e.lo)}%"></span>
          <span style="position:absolute;left:${zero}%;top:-4px;bottom:-4px;width:2px;background:#2E2D33"></span>
        </div><span class="bar-val">${val}</span></div>`;
    }).join("");
  }

  function chips() {
    document.getElementById("ageChips").innerHTML = AGES.map(a => `<button class="chip" type="button" data-age="${a[0]}" aria-pressed="${a[0] === age}">${esc(es() ? a[2] : a[1])}</button>`).join("");
    const T = [["black", "Black coat", "Pelaje negro"], ["female", "Female", "Hembra"]];
    if (sp === "dog") T.push(["pit_type", "Pit bull type", "Tipo pit bull"]);
    document.getElementById("traitChips").innerHTML = T.map(t => `<button class="chip" type="button" data-trait="${t[0]}" aria-pressed="${!!traits[t[0]]}">${esc(es() ? t[2] : t[1])}</button>`).join("");
    document.querySelectorAll("[data-age]").forEach(b => b.onclick = () => { age = b.dataset.age; chips(); result(); });
    document.querySelectorAll("[data-trait]").forEach(b => b.onclick = () => { traits[b.dataset.trait] = !traits[b.dataset.trait]; chips(); result(); });
  }

  function result() {
    const e = data.species[sp].effects;
    let logr = 0;
    if (age !== "young") logr += Math.log(1 + e["age_" + age].pct / 100);
    ["black", "female", "pit_type"].forEach(k => { if (traits[k] && e[k]) logr += Math.log(1 + e[k].pct / 100); });
    const r = Math.exp(logr), pet = es() ? (sp === "cat" ? "gato" : "perro") : sp;
    let txt;
    if (Math.abs(r - 1) < 0.03) txt = es() ? "Una espera típica." : "A typical wait.";
    else if (r >= 1.5) txt = es() ? `Alrededor de ${r.toFixed(1)} veces más tiempo.` : `About ${r.toFixed(1)}x as long.`;
    else if (r > 1) txt = es() ? `Alrededor de ${Math.round((r - 1) * 100)}% más tiempo.` : `About ${Math.round((r - 1) * 100)}% longer.`;
    else txt = es() ? `Alrededor de ${Math.round((1 - r) * 100)}% menos tiempo.` : `About ${Math.round((1 - r) * 100)}% shorter.`;
    document.getElementById("result").textContent = txt;
    document.getElementById("resultNote").textContent = es()
      ? `Comparado con un ${pet} macho de 1 a 3 años${sp === "dog" ? ", no tipo pit bull," : ""} sin pelaje negro, con lo demás igual.`
      : `Compared with a 1 to 3 year old male ${pet}${sp === "dog" ? " that isn't a pit bull type" : ""} without a black coat, everything else equal.`;
  }

  function render() {
    if (!data) return;
    if (sp === "cat") traits.pit_type = false;
    document.querySelectorAll("[data-sp]").forEach(b => b.setAttribute("aria-pressed", b.dataset.sp === sp ? "true" : "false"));
    bars(); chips(); result();
    const s = data.species[sp];
    document.getElementById("src").textContent = (es() ? "Fuente: " : "Source: ") + data.source + (es() ? `. ${s.n.toLocaleString("es-US")} adopciones; espera mediana ${s.median_days} días. Regresión lineal sobre el logaritmo de los días de estadía.` : `. ${s.n.toLocaleString("en-US")} adoptions; median wait ${s.median_days} days. Linear regression on log days of stay.`);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-sp]").forEach(b => b.addEventListener("click", () => { sp = b.dataset.sp; render(); }));
    fetch("data/wait.json").then(r => r.json()).then(d => { data = d; render(); });
  });
  document.addEventListener("pp:lang", render);
})();
