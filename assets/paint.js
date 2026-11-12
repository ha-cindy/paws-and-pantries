// Paint toolbox: the window's tools, palette and title-bar buttons actually work.
// Doodles stay in this browser tab only. Nothing is saved or sent anywhere.
(function () {
  const L = () => (window.PP && PP.lang === "es") ? "es" : "en";
  const say = (en, es) => {
    const el = document.getElementById("statusMsg");
    if (!el) return;
    el.textContent = L() === "es" ? es : en;
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    clearTimeout(say.t);
    say.t = setTimeout(() => { el.textContent = L() === "es" ? el.dataset.es : el.dataset.en; }, 5000);
  };
  const track = (name, params) => { try { window.ppTrack && window.ppTrack(name, params || {}); } catch (e) { /* ignore */ } };

  document.addEventListener("DOMContentLoaded", () => {
    const paper = document.querySelector(".paper");
    const canvas = document.querySelector(".doodle");
    const win = document.querySelector(".win");
    if (!paper || !canvas || !win) return;
    const ctx = canvas.getContext("2d");
    let tool = "select", color = "#F2C230", drawing = false, last = null;

    // keep the doodle layer the same size as the paper, without losing what's drawn
    const fit = () => {
      const w = paper.clientWidth, h = paper.scrollHeight;
      if (canvas.width === w && canvas.height === h) return;
      const keep = document.createElement("canvas");
      keep.width = canvas.width; keep.height = canvas.height;
      if (keep.width && keep.height) keep.getContext("2d").drawImage(canvas, 0, 0);
      canvas.width = w; canvas.height = h;
      canvas.style.height = h + "px";
      ctx.imageSmoothingEnabled = false;
      if (keep.width && keep.height) ctx.drawImage(keep, 0, 0);
    };
    fit();
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(paper);
    window.addEventListener("load", fit);

    const setTool = (t) => {
      tool = t;
      document.body.dataset.tool = t;
      document.querySelectorAll(".tool").forEach(b => {
        const on = b.dataset.tool === t;
        b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    };

    document.querySelectorAll(".tool").forEach(b => b.addEventListener("click", () => {
      const t = b.dataset.tool;
      say(b.dataset.hintEn, b.dataset.hintEs);
      track("paint_tool", { tool: t });
      if (t === "eraser") { ctx.clearRect(0, 0, canvas.width, canvas.height); setTool("select"); say("All clean! Doodles erased.", "¡Listo! Dibujos borrados."); return; }
      if (t === "text") { document.getElementById("langBtn") && document.getElementById("langBtn").click(); return; }
      if (t === "zoom") { document.getElementById("bigBtn") && document.getElementById("bigBtn").click(); return; }
      setTool(t);
    }));

    document.querySelectorAll(".sw").forEach(b => b.addEventListener("click", () => {
      color = b.dataset.color;
      document.getElementById("fgSw").style.background = color;
      document.querySelectorAll(".sw").forEach(x => x.classList.toggle("on", x === b));
      if (tool === "select") setTool("pencil");
      say("Color picked. Now draw, spray, or fill!", "Color elegido. ¡Ahora dibuje, rocíe o rellene!");
    }));

    // drawing
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top) }; };
    const spray = (p) => {
      ctx.fillStyle = color;
      for (let i = 0; i < 22; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.pow(Math.random(), 0.6) * 20;
        ctx.fillRect(Math.round(p.x + d * Math.cos(a)), Math.round(p.y + d * Math.sin(a)), 3, 3);
      }
    };
    const line = (a, b) => {
      ctx.strokeStyle = color; ctx.lineCap = "square"; ctx.lineJoin = "miter";
      ctx.lineWidth = tool === "brush" ? 10 : 3;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    };
    const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; };

    canvas.addEventListener("pointerdown", (e) => {
      if (tool === "bucket") {
        if (lum(color) < 0.55) { say("That color is too dark to read on. Try a lighter one!", "Con ese color no se podría leer el texto. ¡Pruebe uno más claro!"); return; }
        paper.style.setProperty("--hero-bg", color);
        paper.classList.remove("filled"); void paper.offsetWidth; paper.classList.add("filled");
        say("Splash! Header refilled.", "¡Splash! Encabezado pintado.");
        track("paint_fill", { color: color });
        setTool("select");
        return;
      }
      drawing = true; last = pos(e);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (tool === "spray") spray(last); else line(last, last);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drawing) return;
      const p = pos(e);
      if (tool === "spray") spray(p); else line(last, p);
      last = p;
    });
    const stop = () => { if (drawing) track("paint_doodle", { tool: tool }); drawing = false; };
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);

    // title-bar buttons
    const dlg = document.createElement("div");
    dlg.className = "dlg"; dlg.hidden = true;
    dlg.innerHTML = '<div class="dlg-box" role="dialog" aria-modal="true" aria-labelledby="dlgT"><div class="dlg-bar"><span id="dlgT">zuzu.bmp</span></div><div class="dlg-body"><img class="pix" src="assets/sprites/zuzu-sit.png" alt="" width="69" height="78"><p id="dlgP"></p></div><div class="dlg-btns"><button type="button" class="btn light" id="dlgOk">OK</button></div></div>';
    document.body.appendChild(dlg);
    const closeDlg = () => { dlg.hidden = true; document.querySelector('[data-win="close"]').focus(); };
    dlg.addEventListener("click", (e) => { if (e.target === dlg) closeDlg(); });
    document.getElementById("dlgOk").addEventListener("click", closeDlg);
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!dlg.hidden) closeDlg(); else if (tool !== "select") { setTool("select"); say("Back to browsing.", "De vuelta a navegar."); }
    });

    document.querySelectorAll("[data-win]").forEach(b => b.addEventListener("click", () => {
      const w = b.dataset.win;
      track("paint_window", { button: w });
      if (w === "min") {
        const min = win.classList.toggle("min");
        say(min ? "zuzu.bmp minimized. Press _ again to bring it back." : "Welcome back!", min ? "zuzu.bmp minimizado. Presione _ otra vez para volver." : "¡Bienvenido de nuevo!");
      } else if (w === "max") {
        win.classList.toggle("max");
      } else {
        document.getElementById("dlgP").textContent = L() === "es"
          ? "¿Ya se va? Zuzu dice adiós. Si necesita ayuda, marque 2-1-1 a cualquier hora."
          : "Leaving already? Zuzu says bye! If you need help, dial 2-1-1 anytime.";
        dlg.hidden = false; document.getElementById("dlgOk").focus();
      }
    }));

    // keyboard: each toolbar is one tab stop; arrow keys move inside it
    const rove = (box, sel) => {
      if (!box) return;
      const items = () => [...box.querySelectorAll(sel)];
      items().forEach((b, k) => { b.tabIndex = k === 0 ? 0 : -1; });
      box.addEventListener("keydown", (e) => {
        const L = items(), at = L.indexOf(document.activeElement); if (at < 0) return;
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        let to = step ? (at + step + L.length) % L.length : e.key === "Home" ? 0 : e.key === "End" ? L.length - 1 : -1;
        if (to < 0) return;
        e.preventDefault(); L[at].tabIndex = -1; L[to].tabIndex = 0; L[to].focus();
      });
      box.addEventListener("focusin", (e) => { const L = items(); if (L.includes(e.target)) L.forEach(b => { b.tabIndex = b === e.target ? 0 : -1; }); });
    };
    rove(document.querySelector(".toolbox"), ".tool");
    rove(document.querySelector(".palette"), ".sw");

    setTool("select");
  });
})();
