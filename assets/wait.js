// Pets who wait: bar chart of regression effects and a simple "how long might this pet wait" combiner.
(function () {
  let data = null, H = null, intake = "stray", cond = "normal", sp = "cat", age = "young", traits = { black: false, female: false, pit_type: false };
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
    const T = [["black", "Black coat", "Pelaje negro"], ["female", "Female", "Hembra"], ["intact", "Not yet fixed", "Sin esterilizar"]];
    if (sp === "dog") T.push(["pit_type", "Pit bull type", "Tipo pit bull"]);
    const S = [["intake", "stray", "Came in as a stray", "Llegó como callejero"], ["intake", "surrender", "Surrendered by owner", "Entregado por su dueño"], ["cond", "normal", "Healthy", "Sano"], ["cond", "sick", "Sick or injured", "Enfermo o herido"]];
    const sEl = document.getElementById("storyChips");
    if (sEl) { sEl.innerHTML = S.map(t => `<button class="chip" type="button" data-story="${t[0]}:${t[1]}" aria-pressed="${(t[0] === "intake" ? intake : cond) === t[1]}">${esc(es() ? t[3] : t[2])}</button>`).join("");
      sEl.querySelectorAll("[data-story]").forEach(b => b.onclick = () => { const [k, v] = b.dataset.story.split(":"); if (k === "intake") intake = v; else cond = v; chips(); result(); }); }
    document.getElementById("traitChips").innerHTML = T.map(t => `<button class="chip" type="button" data-trait="${t[0]}" aria-pressed="${!!traits[t[0]]}">${esc(es() ? t[2] : t[1])}</button>`).join("");
    document.querySelectorAll("[data-age]").forEach(b => b.onclick = () => { age = b.dataset.age; chips(); result(); });
    document.querySelectorAll("[data-trait]").forEach(b => b.onclick = () => { traits[b.dataset.trait] = !traits[b.dataset.trait]; chips(); result(); });
  }

  // Predictor: uses the final model's coefficients (data/wait_holdout.json) to estimate days,
  // a likely range (middle 50% of similar pets), and whether this pet lands in the slowest 20%.
  const COEF = (sp) => H && H.species[sp] && H.species[sp].coef;
  function predict() {
    const c = COEF(sp); if (!c) return null;
    const A = { baby: "Baby (<1)", young: null, adult: "Adult (4-7)", senior: "Senior (8+)" };
    let lp = c.Intercept;
    if (A[age]) lp += c[`C(age_grp, Treatment('Young (1-3)'))[T.${A[age]}]`] || 0;
    if (traits.female) lp += c.female || 0;
    if (traits.black) lp += c.black || 0;
    if (sp === "dog" && traits.pit_type) lp += c.pit_type || 0;
    if (traits.intact) lp += c.intact || 0;
    if (intake === "surrender") lp += c["C(intake_type, Treatment('Stray'))[T.Owner Surrender]"] || 0;
    if (cond === "sick") lp += c["C(condition)[T.Sick/injured/other]"] || 0;
    const sd = H.species[sp].resid_sd, q = 0.6745 * sd;   // middle 50% of similar pets
    const days = Math.expm1(lp), lo = Math.expm1(lp - q), hi = Math.expm1(lp + q);
    return { days, lo, hi, slow: lp >= H.species[sp].slow20_cut_log };
  }
  function result() {
    const p = predict();
    const rEl = document.getElementById("result"), nEl = document.getElementById("resultNote"), fEl = document.getElementById("flag");
    if (!p) { rEl.textContent = ""; return; }
    const d = Math.round(p.days), lo = Math.max(1, Math.round(p.lo)), hi = Math.round(p.hi);
    rEl.textContent = es() ? `Unos ${d} días` : `About ${d} days`;
    nEl.textContent = es() ? `La mitad de las mascotas parecidas se fueron a casa entre ${lo} y ${hi} días.` : `Half of similar pets went home within ${lo} to ${hi} days.`;
    if (fEl) {
      fEl.hidden = !p.slow;
      fEl.textContent = es() ? "Entre el 20% más lento. Si usted trabaja en un refugio: ¡destaque primero a esta mascota!" : "In the slowest 20%. If you work at a shelter: feature this pet first!";
    }
    try { window.ppTrack && window.ppTrack("wait_predict", { species: sp, age: age, slow: p.slow ? "yes" : "no" }); } catch (e) { /* ignore */ }
  }
  function holdout() {
    const el = document.getElementById("holdout"); if (!el || !H) return;
    const s = H.species[sp], pet = es() ? (sp === "cat" ? "gatos" : "perros") : (sp === "cat" ? "cats" : "dogs");
    const n = x => x.toLocaleString(es() ? "es-US" : "en-US");
    const dec = s.deciles, max = Math.max(...dec.map(x => Math.max(x.pred, x.actual)));
    const rows = dec.map((x, i) => `<div class="ho-row"><span class="ho-lab">${i + 1}</span><span class="ho-track"><span class="ho-pred" style="width:${100 * x.pred / max}%"></span><span class="ho-act" style="width:${100 * x.actual / max}%"></span></span><span class="ho-val">${Math.round(x.pred)} / ${Math.round(x.actual)}</span></div>`).join("");
    el.innerHTML = `
      <div class="ho-stats">
        <div><b>${n(s.n_test)}</b><span>${es() ? `${pet} de 2023 a 2024 que el modelo nunca vio` : `${pet} from 2023 to 2024 the model never saw`}</span></div>
        <div><b>${s.flag_median_days} ${es() ? "días" : "days"}</b><span>${es() ? `espera mediana de los que marcó como "20% más lento", contra ${s.rest_median_days} días para el resto` : `median wait for pets it flagged as the "slowest 20%", vs ${s.rest_median_days} days for the rest`}</span></div>
        <div><b>${Math.round(s.flag_precision_pct)}%</b><span>${es() ? "de los marcados realmente estuvieron en el quinto más lento (el azar daría 20%)" : "of flagged pets really were in the slowest fifth (chance would be 20%)"}</span></div>
        <div><b>${Math.round(s.within_2x_pct)}%</b><span>${es() ? "de las predicciones quedaron dentro del doble o la mitad de la espera real. Ordena bien, pero no adivina el día exacto." : "of predictions landed within double or half the real wait. It ranks well, but can't call the exact day."}</span></div>
      </div>
      <p class="muted small" style="margin-top:10px">${es() ? "Predicho / real, en días, por grupo de predicción (grupo 1 = predicción más corta). Barras amarillas = predicho, grises = real." : "Predicted / actual days by prediction group (group 1 = shortest predicted). Yellow bars = predicted, gray = actual."}</p>
      <div class="ho-chart">${rows}</div>
      <p class="muted small">${es() ? `Entrenado con ${n(s.n_train)} adopciones de 2014 a 2022. Correlación de rangos ${s.spearman}. Error absoluto medio ${s.mae_days} días, contra ${s.mae_baseline_days} si siempre se adivinara la mediana.` : `Trained on ${n(s.n_train)} adoptions from 2014 to 2022. Rank correlation ${s.spearman}. Mean absolute error ${s.mae_days} days, vs ${s.mae_baseline_days} for always guessing the median.`}</p>`;
  }

  function render() {
    if (!data) return;
    if (sp === "cat") traits.pit_type = false;
    document.querySelectorAll("[data-sp]").forEach(b => b.setAttribute("aria-pressed", b.dataset.sp === sp ? "true" : "false"));
    bars(); chips(); result(); holdout();
    const s = data.species[sp];
    document.getElementById("src").textContent = (es() ? "Fuente: " : "Source: ") + data.source + (es() ? `. ${s.n.toLocaleString("es-US")} adopciones; espera mediana ${s.median_days} días. Regresión lineal sobre el logaritmo de los días de estadía.` : `. ${s.n.toLocaleString("en-US")} adoptions; median wait ${s.median_days} days. Linear regression on log days of stay.`);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-sp]").forEach(b => b.addEventListener("click", () => { sp = b.dataset.sp; render(); }));
    Promise.all([fetch("data/wait.json").then(r => r.json()), fetch("data/wait_holdout.json").then(r => r.json()).catch(() => null)]).then(([d, h]) => { data = d; H = h; render(); });
  });
  document.addEventListener("pp:lang", render);
})();
