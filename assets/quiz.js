// "Who waits longer?" quiz. Every answer comes from the wait model in data/wait.json
// (Austin Animal Center adoptions, 2013 to 2024), so the quiz teaches what the model found.
(function () {
  const es = () => window.PP && PP.lang === "es";
  const tr = (en, sp) => es() ? sp : en;
  const track = (n, p) => { try { window.ppTrack && window.ppTrack(n, p || {}); } catch (e) { /* ignore */ } };
  let W = null, i = 0, score = 0, answered = false;
  const pct = v => Math.abs(Math.round(v)) + "%";
  const Q = () => {
    const c = W.species.cat.effects, d = W.species.dog.effects;
    return [
      { a: ["A senior cat (8+ years)", "Una gata mayor (8+ años)"], b: ["A young adult cat (1 to 3)", "Una gata adulta joven (1 a 3)"], right: "a",
        why: [`The senior cat. She waited about ${pct(c.age_senior.pct)} longer, a bit more than twice as long.`, `La gata mayor. Esperó cerca de ${pct(c.age_senior.pct)} más, un poco más del doble.`] },
      { a: ["A solid black cat", "Un gato completamente negro"], b: ["A cat of any other color", "Un gato de otro color"], right: "a",
        why: [`The black cat, by about ${pct(c.black.pct)}. The bias is real, but small next to age.`, `El gato negro, por cerca de ${pct(c.black.pct)}. El prejuicio es real, pero pequeño comparado con la edad.`] },
      { a: ["A pit bull type dog", "Un perro tipo pit bull"], b: ["A dog of another breed", "Un perro de otra raza"], right: "a",
        why: [`The pit bull type dog, by about ${pct(d.pit_type.pct)}. That's the biggest gap in the whole model.`, `El perro tipo pit bull, por cerca de ${pct(d.pit_type.pct)}. Es la diferencia más grande de todo el modelo.`] },
      { a: ["A puppy (under 1 year)", "Un cachorro (menos de 1 año)"], b: ["A young adult dog (1 to 3)", "Un perro adulto joven (1 a 3)"], right: "b",
        why: [`The young adult dog. Puppies went home about ${pct(d.age_baby.pct)} faster.`, `El perro adulto joven. Los cachorros se fueron a casa cerca de ${pct(d.age_baby.pct)} más rápido.`] },
      { a: ["A female dog", "Una perra"], b: ["A male dog", "Un perro macho"], right: d.female.pct < 0 ? "b" : "a",
        why: [`The male dog, but only by about ${pct(d.female.pct)}. For cats it flips: females waited about ${pct(c.female.pct)} longer.`, `El perro macho, pero solo por cerca de ${pct(d.female.pct)}. En gatos es al revés: las hembras esperaron cerca de ${pct(c.female.pct)} más.`] },
    ];
  };
  function render() {
    const el = document.getElementById("quizBody");
    if (!el || !W) return;
    const qs = Q();
    if (i >= qs.length) {
      const msg = score >= 4 ? tr("You really know shelter pets!", "¡Usted conoce muy bien a las mascotas de refugio!") : score >= 2 ? tr("Not bad! The data surprises most people.", "¡Nada mal! Los datos sorprenden a casi todos.") : tr("Surprising, right? That's why I built the model.", "Sorprende, ¿verdad? Por eso hice el modelo.");
      el.innerHTML = `<p class="quiz-score">${score} / ${qs.length}</p><p>${msg}</p>
        <p class="muted small">${tr("These are patterns from one Texas shelter, not rules. Every pet is different.", "Son patrones de un refugio de Texas, no reglas. Cada mascota es distinta.")}</p>
        <p style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn light" id="quizAgain">${tr("Play again", "Jugar otra vez")}</button><a class="btn" href="wait.html">${tr("See the full model", "Ver el modelo completo")}</a><a class="btn" href="./#mapH">${tr("Meet shelter pets", "Conocer mascotas")}</a></p>`;
      document.getElementById("quizAgain").addEventListener("click", () => { i = 0; score = 0; answered = false; render(); });
      return;
    }
    const q = qs[i], k = es() ? 1 : 0;
    el.innerHTML = `<p class="quiz-step">${tr("Question", "Pregunta")} ${i + 1} / ${qs.length}</p>
      <p class="quiz-q">${tr("Two pets are alike in every other way. Who waits longer to be adopted?", "Dos mascotas son iguales en todo lo demás. ¿Quién espera más para ser adoptada?")}</p>
      <div class="quiz-opts"><button type="button" class="btn quiz-opt" data-a="a">${q.a[k]}</button><button type="button" class="btn quiz-opt" data-a="b">${q.b[k]}</button></div>
      <div class="quiz-why" id="quizWhy" aria-live="polite"></div>`;
    el.querySelectorAll(".quiz-opt").forEach(b => b.addEventListener("click", () => {
      if (answered) return; answered = true;
      const ok = b.dataset.a === q.right; if (ok) score++;
      el.querySelectorAll(".quiz-opt").forEach(x => { x.disabled = true; x.classList.add(x.dataset.a === q.right ? "right" : (x === b ? "wrong" : "dim")); });
      document.getElementById("quizWhy").innerHTML = `<p><strong>${ok ? tr("Yes!", "¡Sí!") : tr("Not quite.", "No exactamente.")}</strong> ${q.why[k]}</p><button type="button" class="btn light" id="quizNext">${i === qs.length - 1 ? tr("See my score", "Ver mi puntaje") : tr("Next", "Siguiente")}</button>`;
      track("quiz_answer", { question: i + 1, correct: ok ? "yes" : "no" });
      document.getElementById("quizNext").addEventListener("click", () => { i++; answered = false; if (i >= qs.length) track("quiz_done", { score: score }); render(); });
      document.getElementById("quizNext").focus();
    }));
  }
  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("quizBody")) return;
    fetch("data/wait.json").then(r => r.json()).then(d => { W = d; render(); });
  });
  document.addEventListener("pp:lang", () => { if (!answered) render(); });
})();
