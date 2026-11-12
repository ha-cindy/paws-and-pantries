// Zuzu's photo album: a little Picture Viewer window. Arrow keys, swipe, and a Play button.
(function () {
  const P = "assets/photos/";
  const PHOTOS = [
    ["overalls", "Me and Zuzu. She tolerates being held for about four seconds.", "Zuzu y yo. Aguanta que la carguen unos cuatro segundos."],
    ["treat", "Treat negotiations. She always wins.", "Negociando premios. Siempre gana ella."],
    ["rstudio", "My research assistant. She reviews my R code by sitting on it.", "Mi asistente de investigación. Revisa mi código de R sentándose encima."],
    ["sitting", "Sitting like she pays rent.", "Sentada como si pagara la renta."],
    ["sunglasses", "Zuzu's off-duty look.", "El look de Zuzu fuera de servicio."],
    ["hellokitty", "If it fits, she sits. Hello Kitty approved.", "Si cabe, se sienta. Aprobado por Hello Kitty."],
    ["selfie", "Toe beans and a nap. A perfect Sunday.", "Almohadillas y una siesta. Un domingo perfecto."],
    ["pinkhug", "Matching pink was her idea.", "Lo del rosa a juego fue idea suya."],
    ["loaf", "The loaf, deluxe edition.", "El pan de gato, edición de lujo."],
    ["chin", "Chin scratches: 10/10, would recommend.", "Rascadas de barbilla: 10/10, recomendadas."],
    ["sunnap", "Sunbeam located. Nap initiated.", "Rayo de sol localizado. Siesta iniciada."],
    ["checker", "Smiling in her sleep. Probably dreaming about treats.", "Sonriendo dormida. Seguro sueña con premios."],
    ["couch", "Posing with the toy collection.", "Posando con su colección de juguetes."],
    ["cattree", "On patrol.", "De patrulla."],
    ["sniff", "Investigating the blanket situation.", "Investigando la situación de la cobija."],
    ["pinknap", "Asleep mid-cuddle. Mission accomplished.", "Dormida a mitad del abrazo. Misión cumplida."],
    ["overalls-side", "Zuzu, mid-escape plan.", "Zuzu, planeando su escape."],
  ];
  const es = () => (window.PP && PP.lang === "es");
  const track = (n, p) => { try { window.ppTrack && window.ppTrack(n, p || {}); } catch (e) { /* ignore */ } };

  function build(root) {
    let i = 0, timer = null, playing = false;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.innerHTML = `
      <div class="viewer">
        <div class="v-bar"><img class="pix" src="assets/zuzu-icon-pix.png" alt="" width="16" height="16"><span class="v-title">zuzu_album.jpg</span><span class="v-count" aria-live="polite"></span></div>
        <div class="v-stage"><button type="button" class="v-nav v-prev" aria-label="Previous photo">&#9664;</button><img class="v-img" alt=""><button type="button" class="v-nav v-next" aria-label="Next photo">&#9654;</button></div>
        <p class="v-cap" aria-live="polite"></p>
        <div class="v-tools"><button type="button" class="menu-btn v-play"></button><div class="v-thumbs" role="tablist" aria-label="Photos"></div></div>
      </div>`;
    const img = root.querySelector(".v-img"), cap = root.querySelector(".v-cap"), cnt = root.querySelector(".v-count"), play = root.querySelector(".v-play"), thumbs = root.querySelector(".v-thumbs");
    PHOTOS.forEach((p, k) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "v-th"; b.setAttribute("role", "tab");
      b.innerHTML = `<img src="${P}${p[0]}-t.jpg" alt="" width="56" height="56" loading="lazy">`;
      b.setAttribute("aria-label", p[1]);
      b.addEventListener("click", () => { stop(); show(k, "thumb"); });
      thumbs.appendChild(b);
    });
    const labelPlay = () => { play.textContent = playing ? (es() ? "❚❚ Pausa" : "❚❚ Pause") : (es() ? "▶ Ver todas" : "▶ Play slideshow"); play.setAttribute("aria-pressed", playing ? "true" : "false"); };
    function show(k, how) {
      i = (k + PHOTOS.length) % PHOTOS.length;
      const p = PHOTOS[i];
      img.classList.remove("in"); void img.offsetWidth;
      img.src = P + p[0] + ".jpg"; img.alt = p[1]; img.classList.add("in");
      cap.textContent = es() ? p[2] : p[1];
      cnt.textContent = (i + 1) + " / " + PHOTOS.length;
      thumbs.querySelectorAll(".v-th").forEach((t, k2) => { t.classList.toggle("on", k2 === i); t.setAttribute("aria-selected", k2 === i ? "true" : "false"); });
      const on = thumbs.children[i]; if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
      const nx = new Image(); nx.src = P + PHOTOS[(i + 1) % PHOTOS.length][0] + ".jpg";
      if (how) track("photo_view", { photo: p[0], how: how });
    }
    function start() { playing = true; labelPlay(); clearInterval(timer); timer = setInterval(() => show(i + 1, "auto"), 3800); }
    function stop() { playing = false; labelPlay(); clearInterval(timer); }
    play.addEventListener("click", () => { playing ? stop() : start(); track("photo_play", { on: playing ? "yes" : "no" }); });
    root.querySelector(".v-prev").addEventListener("click", () => { stop(); show(i - 1, "prev"); });
    root.querySelector(".v-next").addEventListener("click", () => { stop(); show(i + 1, "next"); });
    root.tabIndex = 0;
    root.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") { stop(); show(i - 1, "key"); } else if (e.key === "ArrowRight") { stop(); show(i + 1, "key"); } });
    let sx = null;
    img.addEventListener("pointerdown", (e) => { sx = e.clientX; });
    img.addEventListener("pointerup", (e) => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) { stop(); show(dx < 0 ? i + 1 : i - 1, "swipe"); } });
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
    document.addEventListener("pp:lang", () => { show(i); labelPlay(); });
    show(0); labelPlay();
  }

  document.addEventListener("DOMContentLoaded", () => { document.querySelectorAll(".album").forEach(build); });
})();
