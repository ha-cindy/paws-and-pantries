// Zuzu's Club: a tiny pixel-art studio. Drawings stay on this device unless the visitor emails one in.
(function () {
  const N = 40, CELL = 8, KEY = "pp_friends";
  const es = () => window.PP && PP.lang === "es";
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };
  document.addEventListener("DOMContentLoaded", () => {
    const cv = document.getElementById("pix");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let grid = new Array(N * N).fill(null), tool = "pencil", color = "#2E2D33", down = false, undo = [];
    const msg = (en, sp) => { document.getElementById("dMsg").textContent = es() ? sp : en; };

    const paint = () => {
      ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < grid.length; i++) if (grid[i]) { ctx.fillStyle = grid[i]; ctx.fillRect((i % N) * CELL, Math.floor(i / N) * CELL, CELL, CELL); }
      ctx.strokeStyle = "rgba(46,45,51,.07)"; ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 1; k < N; k++) { ctx.moveTo(k * CELL + .5, 0); ctx.lineTo(k * CELL + .5, cv.height); ctx.moveTo(0, k * CELL + .5); ctx.lineTo(cv.width, k * CELL + .5); }
      ctx.stroke();
    };
    const snap = () => { undo.push(grid.slice()); if (undo.length > 20) undo.shift(); };
    const at = (e) => { const r = cv.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / r.width * N), y = Math.floor((e.clientY - r.top) / r.height * N); return (x < 0 || y < 0 || x >= N || y >= N) ? -1 : y * N + x; };
    const flood = (i, c) => {
      const from = grid[i]; if (from === c) return;
      const q = [i];
      while (q.length) { const j = q.pop(); if (grid[j] !== from) continue; grid[j] = c; const x = j % N;
        if (x > 0) q.push(j - 1); if (x < N - 1) q.push(j + 1); if (j >= N) q.push(j - N); if (j < N * (N - 1)) q.push(j + N); }
    };
    const apply = (i) => { if (i < 0) return; if (tool === "fill") flood(i, color); else grid[i] = tool === "eraser" ? null : color; paint(); };

    cv.addEventListener("pointerdown", (e) => { e.preventDefault(); snap(); down = tool !== "fill"; try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } apply(at(e)); });
    cv.addEventListener("pointermove", (e) => { if (down) apply(at(e)); });
    ["pointerup", "pointercancel"].forEach(n => cv.addEventListener(n, () => { down = false; }));

    document.querySelectorAll(".dtool").forEach(b => b.addEventListener("click", () => {
      tool = b.dataset.d;
      document.querySelectorAll(".dtool").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    }));
    document.querySelectorAll(".dsw").forEach(b => b.addEventListener("click", () => {
      color = b.dataset.c;
      document.querySelectorAll(".dsw").forEach(x => x.classList.toggle("on", x === b));
      if (tool === "eraser") document.querySelector('.dtool[data-d="pencil"]').click();
    }));
    document.getElementById("dClear").addEventListener("click", () => { snap(); grid.fill(null); paint(); });
    document.getElementById("dUndo").addEventListener("click", () => { if (undo.length) { grid = undo.pop(); paint(); } });
    document.getElementById("dStart").addEventListener("click", () => {
      const img = new Image();
      img.onload = () => {
        snap();
        const o = document.createElement("canvas"); o.width = N; o.height = N;
        const c = o.getContext("2d"); c.imageSmoothingEnabled = false;
        const s = Math.min((N - 4) / img.width, (N - 4) / img.height), w = Math.round(img.width * s), h = Math.round(img.height * s);
        c.drawImage(img, Math.floor((N - w) / 2), N - h - 2, w, h);
        const d = c.getImageData(0, 0, N, N).data;
        grid = grid.map((_, i) => d[i * 4 + 3] > 120 ? "#" + [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]].map(v => v.toString(16).padStart(2, "0")).join("") : null);
        paint(); msg("Here's Zuzu. Now change her into a brand-new friend!", "Aquí está Zuzu. ¡Ahora conviértala en un amigo nuevo!");
      };
      img.src = "assets/zuzu-sitting-pix.png";
    });

    const picture = () => {
      const o = document.createElement("canvas"); o.width = 400; o.height = 470;
      const c = o.getContext("2d"); c.imageSmoothingEnabled = false;
      c.fillStyle = "#FFE07A"; c.fillRect(0, 0, 400, 470);
      c.fillStyle = "#FFFFFF"; c.fillRect(30, 30, 340, 340); c.strokeStyle = "#2E2D33"; c.lineWidth = 4; c.strokeRect(30, 30, 340, 340);
      for (let i = 0; i < grid.length; i++) if (grid[i]) { c.fillStyle = grid[i]; c.fillRect(40 + (i % N) * 8, 40 + Math.floor(i / N) * 8, 8, 8); }
      const name = (document.getElementById("dName").value || "").trim() || (es() ? "Sin nombre" : "No name yet");
      c.fillStyle = "#2E2D33"; c.textAlign = "center";
      c.font = "700 30px 'Pixelify Sans', monospace"; c.fillText(name, 200, 415);
      c.font = "600 15px 'Nunito', sans-serif"; c.fillText(es() ? "amigo de Zuzu · Paws & Pantries" : "Zuzu's friend · Paws & Pantries", 200, 445);
      return { name, url: o.toDataURL("image/png") };
    };
    const empty = () => !grid.some(Boolean);

    const gallery = () => {
      const el = document.getElementById("gallery"), items = store.get();
      el.innerHTML = "";
      if (!items.length) { el.innerHTML = `<div class="empty"><p>${es() ? "Todavía no hay amigos. ¡Dibuje el primero arriba!" : "No friends yet. Draw the first one above!"}</p></div>`; return; }
      items.forEach((it, i) => {
        const f = document.createElement("figure"); f.className = "friend";
        const im = document.createElement("img"); im.src = it.url; im.alt = it.name; im.width = 200; im.height = 235;
        const cap = document.createElement("figcaption");
        const b = document.createElement("button"); b.type = "button"; b.className = "btn"; b.textContent = es() ? "Quitar" : "Remove";
        b.addEventListener("click", () => { const v = store.get(); v.splice(i, 1); store.set(v); gallery(); });
        cap.appendChild(b); f.appendChild(im); f.appendChild(cap); el.appendChild(f);
      });
    };

    document.getElementById("dSave").addEventListener("click", () => {
      if (empty()) { msg("Draw something first!", "¡Dibuje algo primero!"); return; }
      const v = store.get(); v.unshift(picture()); if (v.length > 12) v.length = 12;
      if (store.set(v)) { msg("Added! Scroll down to see Zuzu's friends.", "¡Agregado! Baje para ver los amigos de Zuzu."); gallery(); }
      else msg("Couldn't save on this device. Use Save picture instead.", "No se pudo guardar en este dispositivo. Use Guardar imagen.");
      try { window.ppTrack && window.ppTrack("friend_saved", {}); } catch (e) { /* ignore */ }
    });
    document.getElementById("dDown").addEventListener("click", () => {
      if (empty()) { msg("Draw something first!", "¡Dibuje algo primero!"); return; }
      const p = picture(), a = document.createElement("a");
      a.href = p.url; a.download = "zuzus-friend-" + p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".png";
      document.body.appendChild(a); a.click(); a.remove();
      try { window.ppTrack && window.ppTrack("friend_downloaded", {}); } catch (e) { /* ignore */ }
    });

    paint(); gallery();
    document.addEventListener("pp:lang", gallery);
  });
})();
