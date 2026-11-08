// Find help page: renders verified local listings and statewide programs from data/resources.json.
(function () {
  let data = null, filter = "all", town = "";
  const ICON = {
    food: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E2D33" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h18l-2 7H5z"/><path d="M7 12c0-3 2.2-5 5-5s5 2 5 5"/></svg>',
    vet: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E2D33" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg>',
    spay: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E2D33" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const L = (o, k) => (PP.lang === "es" && o[k + "_es"]) ? o[k + "_es"] : (o[k] || "");
  const fmtDate = d => { try { return new Date(d + "T12:00:00").toLocaleDateString(PP.lang === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", year: "numeric" }); } catch (e) { return d; } };

  function card(r) {
    const type = (r.types || ["food"])[0];
    const tel = r.phone ? `<a class="btn" href="tel:${esc(r.phone.replace(/[^0-9+]/g, ""))}">${esc(PP.t("call"))} ${esc(r.phone)}</a>` : "";
    const dir = r.address ? `<a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address + ", " + (r.town || "") + ", NJ")}">${esc(PP.t("directions"))}</a>` : "";
    const web = r.link ? `<a class="btn ghost" target="_blank" rel="noopener" href="${esc(r.link)}">${esc(PP.t("website"))}</a>` : "";
    const where = [r.town, r.hours ? L(r, "hours") : ""].filter(Boolean).join(" · ");
    return `<article class="item"><span class="icon">${ICON[type] || ICON.food}</span><div class="body">
      <h3>${esc(L(r, "name"))}</h3>
      ${where ? `<p class="muted">${esc(where)}</p>` : ""}
      <p>${esc(L(r, "summary"))}</p>
      ${r.how ? `<p class="muted small">${esc(L(r, "how"))}</p>` : ""}
      <div class="actions">${tel}${dir}${web}</div>
      <p class="muted small">${esc(PP.t("checked"))} ${esc(fmtDate(r.checked))}${r.source ? " · " + esc(r.source) : ""}</p>
    </div></article>`;
  }

  function render() {
    if (!data) return;
    const keep = r => (filter === "all" || (r.types || []).includes(filter));
    const near = r => !town || [r.town, r.zip, r.address].join(" ").toLowerCase().includes(town);
    const local = data.local.filter(r => keep(r) && near(r));
    const localEl = document.getElementById("localList");
    if (!data.local.length) {
      localEl.innerHTML = `<div class="empty"><span class="icon" style="width:46px;height:46px;border-radius:16px;background:#FFF1B8;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ICON.food}</span>
        <div class="body"><h3>${esc(PP.t("checking_h"))}</h3><p>${esc(PP.t("checking_p"))}</p><p style="margin-top:8px"><a href="tel:211"><strong>${esc(PP.t("need_now"))}</strong></a></p></div></div>`;
    } else if (!local.length) {
      localEl.innerHTML = `<div class="empty"><p>${esc(PP.t("no_match"))}</p></div>`;
    } else {
      localEl.innerHTML = local.map(card).join("");
    }
    document.getElementById("stateList").innerHTML = data.statewide.filter(keep).map(card).join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-filter]").forEach(b => b.addEventListener("click", () => {
      filter = b.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      render();
    }));
    document.getElementById("searchForm").addEventListener("submit", e => {
      e.preventDefault();
      town = document.getElementById("town").value.trim().toLowerCase();
      render();
      document.getElementById("localH").scrollIntoView({ behavior: "smooth" });
    });
    fetch("data/resources.json").then(r => r.json()).then(d => { data = d; render(); })
      .catch(() => { document.getElementById("localList").innerHTML = '<div class="empty"><p><a href="tel:211">NJ 2-1-1</a></p></div>'; });
  });
  document.addEventListener("pp:lang", render);
})();
