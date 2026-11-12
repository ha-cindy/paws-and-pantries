// Desktop Zuzu: every so often she walks in along the taskbar, has a snack, plays, sits for a bit, and leaves.
// Click her for a hello. Skipped entirely when the visitor prefers reduced motion.
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const S = "assets/sprites/zuzu-";
  const F = { walk: ["walk1", "walk2", "walk3", "walk4"], stand: ["stand"], eat: ["eat1", "eat2"], play: ["play1", "play2"], loaf: ["loaf-awake", "loaf"] };
  Object.values(F).flat().forEach(n => { const i = new Image(); i.src = S + n + ".png"; });
  const es = () => (window.PP && PP.lang === "es");
  const track = (n, p) => { try { window.ppTrack && window.ppTrack(n, p || {}); } catch (e) { /* ignore */ } };
  const status = (en, sp) => { const el = document.getElementById("statusMsg"); if (!el) return; el.textContent = es() ? sp : en; clearTimeout(status.t); status.t = setTimeout(() => { el.textContent = es() ? el.dataset.es : el.dataset.en; }, 4500); };

  document.addEventListener("DOMContentLoaded", () => {
    const pet = document.createElement("button");
    pet.type = "button"; pet.className = "pet"; pet.hidden = true; pet.setAttribute("aria-label", "Zuzu");
    pet.innerHTML = '<img class="pix" src="' + S + 'stand.png" alt="" width="32" height="22">';
    document.body.appendChild(pet);
    const img = pet.firstChild;
    let x = -120, dir = 1, busy = false, frameT = null, moveT = null, visits = 0;
    const scale = () => (window.innerWidth < 600 ? 2 : 3);
    const W = () => 32 * scale();
    const place = () => { pet.style.transform = `translateX(${Math.round(x)}px) scaleX(${dir})`; };
    const anim = (name, ms) => { clearInterval(frameT); let k = 0; const fr = F[name]; img.src = S + fr[0] + ".png"; if (fr.length > 1) frameT = setInterval(() => { k = (k + 1) % fr.length; img.src = S + fr[k] + ".png"; }, ms || 160); };
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const walkTo = (tx, speed) => new Promise(res => {
      dir = tx > x ? 1 : -1; anim("walk", 130);
      clearInterval(moveT);
      moveT = setInterval(() => {
        if (document.hidden) return;
        x += dir * speed; place();
        if ((dir === 1 && x >= tx) || (dir === -1 && x <= tx)) { clearInterval(moveT); res(); }
      }, 40);
    });
    async function visit() {
      if (busy) return; busy = true; visits++;
      const vw = window.innerWidth, w = W();
      x = -w - 10; dir = 1; place(); pet.hidden = false;
      const stopAt = Math.round(vw * (0.25 + Math.random() * 0.4));
      await walkTo(stopAt, 2.2);
      anim("stand"); await wait(900);
      anim("eat", 260); status("Zuzu found a treat. Priorities.", "Zuzu encontró un premio. Prioridades."); await wait(3200);
      anim("play", 220); await wait(2800);
      anim("stand"); await wait(500);
      anim("loaf", 1400); await wait(4600);
      anim("stand"); await wait(500);
      await walkTo(vw + w + 10, 2.6);
      pet.hidden = true; busy = false;
      track("zuzu_visit", { n: visits });
      schedule(70000 + Math.random() * 60000);
    }
    let sched = null;
    const schedule = (ms) => { clearTimeout(sched); sched = setTimeout(visit, ms); };
    pet.addEventListener("click", () => {
      const lines = [["Mrrp.", "Mrrp."], ["Zuzu says hi! Then walks away.", "¡Zuzu saluda! Y luego se va."], ["She is not a fan of being picked up.", "No le gusta que la carguen."], ["Treats accepted. Petting negotiable.", "Premios aceptados. Caricias negociables."]];
      const l = lines[Math.floor(Math.random() * lines.length)]; status(l[0], l[1]);
      pet.classList.remove("hop"); void pet.offsetWidth; pet.classList.add("hop");
      track("zuzu_pet", { page: location.pathname.split("/").pop() || "index.html" });
    });
    document.addEventListener("visibilitychange", () => { if (document.hidden) { clearTimeout(sched); } else if (!busy) schedule(20000); });
    schedule(sessionStorage.getItem("pp_seen_zuzu") ? 45000 : 6000);
    try { sessionStorage.setItem("pp_seen_zuzu", "1"); } catch (e) { /* ignore */ }
  });
})();
