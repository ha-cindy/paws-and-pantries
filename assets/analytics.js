// Google Analytics 4: counts visits (including tagged QR flyers) and key actions.
// Paste the Measurement ID below to switch it on. While it's empty, nothing loads and nothing is tracked.
(function () {
  const GA_ID = "G-LT1QTGK77H"; // e.g. "G-XXXXXXXXXX"
  window.ppTrack = function () {};
  if (!GA_ID) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  window.ppTrack = function (name, params) { try { window.gtag("event", name, params || {}); } catch (e) { /* ignore */ } };

  // Count taps on call, directions, and website buttons anywhere on the site.
  document.addEventListener("click", function (e) {
    const a = e.target.closest && e.target.closest("a");
    if (!a) return;
    const card = a.closest("article, .place-card");
    const place = a.dataset.place || (card && card.querySelector("h3") ? card.querySelector("h3").textContent.trim() : "");
    const area = a.closest(".azu") ? "ask_zuzu" : a.closest(".place-card") ? "map_card" : card ? "list" : "page";
    if (a.href.startsWith("tel:")) window.ppTrack("tap_call", { place: place, area: area });
    else if (a.href.includes("google.com/maps")) window.ppTrack("tap_directions", { place: place, area: area });
    else if (card && a.target === "_blank") window.ppTrack("tap_website", { place: place, area: area });
  });

  // Count every click on a link or button, so GA4 shows what people actually use.
  // Event: ui_click, with label (what was clicked), area (where on the page) and site_lang.
  document.addEventListener("click", function (e) {
    const el = e.target.closest && e.target.closest("a, button, .pin, #map path");
    if (!el) return;
    const areas = [[".startmenu", "start_menu"], [".taskbar", "taskbar"], [".azu", "ask_zuzu"], [".menubar", "menu"], [".toolbox", "toolbox"], [".palette", "palette"], [".titlebar", "title_bar"], ["#helpMap", "map"], [".place-card", "map_card"], [".studio", "draw_studio"], [".quiz", "quiz"], [".hero", "header"], ["main", "page"]];
    const hit = areas.find(function (a) { return el.closest(a[0]); });
    let label = el.getAttribute("data-track") || el.getAttribute("data-en") || el.getAttribute("aria-label") || el.getAttribute("data-c") || el.getAttribute("title") || (el.textContent || "").trim();
    label = String(label).replace(/\s+/g, " ").slice(0, 60);
    window.ppTrack("ui_click", { label: label, area: hit ? hit[1] : "other", site_lang: document.documentElement.lang || "en" });
  }, true);
})();
