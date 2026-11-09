// Google Analytics 4: counts visits (including tagged QR flyers) and key actions.
// Paste the Measurement ID below to switch it on. While it's empty, nothing loads and nothing is tracked.
(function () {
  const GA_ID = ""; // e.g. "G-XXXXXXXXXX"
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
    const card = a.closest("article");
    const place = card && card.querySelector("h3") ? card.querySelector("h3").textContent.trim() : "";
    if (a.href.startsWith("tel:")) window.ppTrack("tap_call", { place: place });
    else if (a.href.includes("google.com/maps")) window.ppTrack("tap_directions", { place: place });
    else if (card && a.target === "_blank") window.ppTrack("tap_website", { place: place });
  });
})();
