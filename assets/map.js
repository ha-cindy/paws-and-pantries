// Map of pet help in Middlesex County. Leaflet (vendored) + Esri World Street Map tiles.
(function () {
  const TYPES = {
    food:  { color: "#F2932E", en: "Pet food", es: "Comida para mascotas", icon: '<path d="M3 12h18l-2 7H5z"/><path d="M7 12c0-3 2.2-5 5-5s5 2 5 5"/>' },
    vet:   { color: "#E5484D", en: "Vet care", es: "Veterinario", icon: '<path d="M12 6v12M6 12h12"/>' },
    spay:  { color: "#E5484D", en: "Low-cost spay and neuter", es: "Esterilización de bajo costo", icon: '<path d="M12 6v12M6 12h12"/>' },
    adopt: { color: "#3E3D44", en: "Adopt a pet", es: "Adopte una mascota", icon: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>' },
  };
  const es = () => window.PP && PP.lang === "es";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const L_ = (o, k) => (es() && o[k + "_es"]) ? o[k + "_es"] : (o[k] || "");
  const fmt = d => { try { return new Date(d + "T12:00:00").toLocaleDateString(es() ? "es-US" : "en-US", { month: "short", year: "numeric" }); } catch (e) { return d; } };
  let map, places = [], markers = {}, filter = "all", sel = null;

  const pin = (p, on) => {
    const t = TYPES[p.type] || TYPES.food;
    const color = p.status === "zuzu" ? "#E8B320" : t.color;
    return L.divIcon({ className: "", iconSize: [34, 44], iconAnchor: [17, 42],
      html: `<span class="pin${on ? " on" : ""}" style="--pin:${color}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${t.icon}</svg></span>` });
  };

  function card(p) {
    const el = document.getElementById("placeCard");
    if (!p) { el.innerHTML = `<p class="pc-hint">${es() ? "Toque un marcador para ver los detalles." : "Tap a pin to see the details."}</p>`; return; }
    const t = TYPES[p.type];
    const badge = p.status === "confirmed" ? (es() ? "Confirmado por nosotros" : "Confirmed by us")
      : p.status === "zuzu" ? (es() ? "El refugio de Zuzu" : "Zuzu's shelter")
      : (es() ? "De una lista oficial, aún sin confirmar" : "From an official list, not yet confirmed by us");
    const q = encodeURIComponent(`${p.address}, ${p.town}, NJ`);
    el.innerHTML = `<article>
      <p class="pc-type" style="color:${p.status === "zuzu" ? "#A97400" : t.color}">${esc(es() ? t.es : t.en)}</p>
      <h3>${esc(L_(p, "name"))}</h3>
      ${p.where ? `<p class="pc-where">${esc(L_(p, "where"))}</p>` : ""}
      <p>${esc(p.address)}, ${esc(p.town)}</p>
      <p class="muted small">${esc(L_(p, "note"))}</p>
      <div class="pc-actions">
        ${p.phone ? `<a class="pc-btn" href="tel:${esc(p.phone.replace(/[^0-9+]/g, ""))}">${es() ? "Llamar" : "Call"} ${esc(p.phone)}</a>` : ""}
        <a class="pc-btn alt" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${q}">${es() ? "Cómo llegar" : "Directions"}</a>
      </div>
      <p class="pc-src ${p.status === "confirmed" ? "ok" : ""}">${esc(badge)} · ${esc(p.source)}, ${esc(fmt(p.source_date))}</p>
    </article>`;
  }

  function draw() {
    if (!map) return;
    const shown = places.filter(p => filter === "all" || p.type === filter || (filter === "vet" && p.type === "spay"));
    places.forEach(p => {
      const show = shown.includes(p);
      if (show && !map.hasLayer(markers[p.id])) markers[p.id].addTo(map);
      if (!show && map.hasLayer(markers[p.id])) map.removeLayer(markers[p.id]);
      markers[p.id].setIcon(pin(p, sel === p.id));
      const el = markers[p.id].getElement();
      if (el) { el.setAttribute("role", "button"); el.setAttribute("aria-label", `${es() && p.name_es ? p.name_es : p.name}, ${esc(p.town)}`); el.setAttribute("aria-pressed", sel === p.id ? "true" : "false");
        el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(p); const n = markers[p.id].getElement(); if (n) n.focus(); } }; }
      markers[p.id].setZIndexOffset(sel === p.id ? 1000 : 0);
    });
    if (sel && !shown.find(p => p.id === sel)) sel = null;
    card(places.find(p => p.id === sel));
    const n = document.getElementById("mapCount");
    if (n) n.textContent = es() ? `${shown.length} lugares en el mapa` : `${shown.length} places on the map`;
  }

  function pick(p) {
    sel = p.id; draw();
    map.panTo([p.lat, p.lon], { animate: true });
    try { window.ppTrack && window.ppTrack("map_pin", { place: p.name, type: p.type }); } catch (e) { /* ignore */ }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const box = document.getElementById("helpMap");
    if (!box || !window.L) return;
    map = L.map(box, { scrollWheelZoom: false, zoomControl: false, attributionControl: true }).setView([40.47, -74.40], 10);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18,
      attribution: 'Tiles &copy; Esri and its data providers, including OpenStreetMap contributors',
    }).addTo(map);
    map.on("click", () => { sel = null; draw(); });
    fetch("data/places.json").then(r => r.json()).then(d => {
      places = d.places;
      places.forEach(p => {
        markers[p.id] = L.marker([p.lat, p.lon], { icon: pin(p, false), title: p.name, alt: p.name, keyboard: true });
        markers[p.id].on("click", (e) => { L.DomEvent.stopPropagation(e); pick(p); });
      });
      const inCounty = places.filter(p => p.status !== "zuzu").map(p => [p.lat, p.lon]);
      map.fitBounds(inCounty, { padding: [30, 30] });
      draw();
    }).catch(() => { box.innerHTML = '<p style="padding:16px">Map could not load. Call <a href="tel:211">2-1-1</a> for help.</p>'; });
    document.querySelectorAll("[data-filter]").forEach(b => b.addEventListener("click", () => { filter = b.dataset.filter; draw(); }));
  });
  document.addEventListener("pp:lang", draw);
})();
