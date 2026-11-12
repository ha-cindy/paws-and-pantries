// Shared: language toggle (English/Spanish), bigger text, nav state.
const T = {
  en: {
    nav_help: "Find help", nav_need: "NJ need", nav_wait: "Pets who wait", nav_about: "About", nav_club: "Zuzu's Club",
    big: "A+ Bigger text", lang: "Español",
    hi_zuzu: "hi, I'm Zuzu",
    help_h1: "Help for pets and the people who love them.",
    help_lede: "Free pet food and low-cost vet care in Middlesex County, NJ. No sign-up, no cost, no catch.",
    search_label: "Town or ZIP code", search_btn: "Find help",
    f_all: "Everything", f_food: "Pet food", f_vet: "Vet care", f_spay: "Spay and neuter",
    local_h: "Near you", statewide_h: "Programs across New Jersey",
    checking_h: "Local listings are on the map.",
    checking_p: "Right now these come from official county and state lists (I note the date I checked each one). Starting in December, I'm calling and emailing every place myself to confirm hours and who they help. Until then, please call before you go!",
    need_now: "Need help today? Call 2-1-1. They pick up 24/7.",
    call: "Call", directions: "Directions", website: "Website", checked: "Checked",
    no_match: "Nothing matches that town yet. Try a nearby one, or call 2-1-1.",
    stat_people: "people in Middlesex County faced food insecurity in 2023",
    stat_wait: "longer wait for senior cats to get adopted (Zuzu was lucky)",
    zuzu_tip: "Zuzu's tip: call ahead! A lot of pantries only hand out pet food on certain days, and nobody wants a wasted trip.",
    report: "Something wrong with a listing?", report_link: "Tell us",
  },
  es: {
    nav_help: "Ayuda", nav_need: "Necesidad", nav_wait: "Esperan", nav_about: "Info", nav_club: "Club",
    big: "A+ Letra grande", lang: "English",
    hi_zuzu: "hola, soy Zuzu",
    help_h1: "Ayuda para las mascotas y las personas que las quieren.",
    help_lede: "Comida para mascotas gratis y atención veterinaria de bajo costo en el condado de Middlesex, NJ. Sin registro, sin costo, sin trampa.",
    search_label: "Pueblo o código postal", search_btn: "Buscar",
    f_all: "Todo", f_food: "Comida para mascotas", f_vet: "Veterinario", f_spay: "Esterilización",
    local_h: "Cerca de usted", statewide_h: "Programas en todo Nueva Jersey",
    checking_h: "Los lugares locales están en el mapa.",
    checking_p: "Por ahora vienen de listas oficiales del condado y del estado (anoto la fecha en que revisé cada una). Desde diciembre, yo misma llamo y escribo a cada lugar para confirmar horarios y a quién ayudan. Mientras tanto, ¡llame antes de ir!",
    need_now: "¿Necesita ayuda hoy? Llame al 2-1-1. Contestan las 24 horas.",
    call: "Llamar", directions: "Cómo llegar", website: "Sitio web", checked: "Verificado",
    no_match: "Todavía no hay lugares que coincidan. Pruebe otro pueblo o llame al NJ 2-1-1.",
    stat_people: "personas en el condado de Middlesex sufrieron inseguridad alimentaria en 2023",
    stat_wait: "más de espera para que un gato mayor sea adoptado (Zuzu tuvo suerte)",
    zuzu_tip: "Consejo de Zuzu: ¡llame antes! Muchas despensas solo dan comida para mascotas ciertos días, y nadie quiere un viaje en vano.",
    report: "¿Hay un error en un lugar?", report_link: "Avísenos",
  },
};

const PP = {
  lang: "en",
  t(key) { return (T[this.lang] && T[this.lang][key]) || T.en[key] || key; },
  read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  write(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  apply() {
    document.documentElement.lang = this.lang;
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = this.t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = this.t(el.dataset.i18nPh); });
    document.querySelectorAll("[data-i18n-alt]").forEach(el => { el.alt = this.t(el.dataset.i18nAlt); });
    document.querySelectorAll("[data-en]").forEach(el => { el.textContent = this.lang === "es" ? el.dataset.es : el.dataset.en; });
    document.dispatchEvent(new CustomEvent("pp:lang"));
  },
  init() {
    const q = new URLSearchParams(location.search).get("lang");
    this.lang = q === "es" || q === "en" ? q : (this.read("pp-lang") || ((navigator.language || "").startsWith("es") ? "es" : "en"));
    if (this.read("pp-big") === "1") document.body.classList.add("big");
    const langBtn = document.getElementById("langBtn");
    if (langBtn) langBtn.addEventListener("click", () => { this.lang = this.lang === "en" ? "es" : "en"; this.write("pp-lang", this.lang); this.apply(); });
    const bigBtn = document.getElementById("bigBtn");
    if (bigBtn) {
      bigBtn.setAttribute("aria-pressed", document.body.classList.contains("big") ? "true" : "false");
      bigBtn.addEventListener("click", () => {
        const on = document.body.classList.toggle("big");
        bigBtn.setAttribute("aria-pressed", on ? "true" : "false");
        this.write("pp-big", on ? "1" : "0");
      });
    }
    this.apply();
  },
};
window.PP = PP;
document.addEventListener("DOMContentLoaded", () => PP.init());
