// Shared: language toggle (English/Spanish), bigger text, nav state.
const T = {
  en: {
    nav_help: "Find help", nav_need: "NJ need", nav_wait: "Pets who wait", nav_about: "About", nav_club: "Zuzu's Club",
    big: "A+ Bigger text", lang: "Español",
    hi_zuzu: "hi, I'm Zuzu",
    help_h1: "Help for pets and the people who love them.",
    help_lede: "Free pet food and low-cost pet care in Middlesex County, NJ. No sign-up, no cost.",
    search_label: "Town or ZIP code", search_btn: "Find help",
    f_all: "Everything", f_food: "Pet food", f_vet: "Vet care", f_spay: "Spay and neuter",
    local_h: "Near you", statewide_h: "Programs across New Jersey",
    checking_h: "Local listings are on the map.",
    checking_p: "Right now they come from official county and state lists, with the date each list was checked. Next step: I confirm every place directly by phone or email, starting December 2026. Until then, please call before you go.",
    need_now: "Need help today? Call NJ 2-1-1, any time.",
    call: "Call", directions: "Directions", website: "Website", checked: "Checked",
    no_match: "No listings match yet. Try another town, or call NJ 2-1-1.",
    stat_people: "people in Middlesex County faced food insecurity in 2023",
    stat_wait: "Senior cats waited about twice as long to be adopted",
    zuzu_tip: "Zuzu's tip: call ahead. Lots of pantries only hand out pet food on certain days.",
    report: "Something wrong with a listing?", report_link: "Tell us",
  },
  es: {
    nav_help: "Ayuda", nav_need: "Necesidad", nav_wait: "Esperan", nav_about: "Info", nav_club: "Club",
    big: "A+ Letra grande", lang: "English",
    hi_zuzu: "hola, soy Zuzu",
    help_h1: "Ayuda para las mascotas y las personas que las quieren.",
    help_lede: "Comida para mascotas gratis y atención veterinaria de bajo costo en el condado de Middlesex, NJ. Sin registro, sin costo.",
    search_label: "Pueblo o código postal", search_btn: "Buscar",
    f_all: "Todo", f_food: "Comida para mascotas", f_vet: "Veterinario", f_spay: "Esterilización",
    local_h: "Cerca de usted", statewide_h: "Programas en todo Nueva Jersey",
    checking_h: "Los lugares locales están en el mapa.",
    checking_p: "Por ahora vienen de listas oficiales del condado y del estado, con la fecha en que se revisó cada lista. Siguiente paso: confirmar cada lugar directamente por teléfono o correo, a partir de diciembre de 2026. Mientras tanto, llame antes de ir.",
    need_now: "¿Necesita ayuda hoy? Llame al NJ 2-1-1, a cualquier hora.",
    call: "Llamar", directions: "Cómo llegar", website: "Sitio web", checked: "Verificado",
    no_match: "Todavía no hay lugares que coincidan. Pruebe otro pueblo o llame al NJ 2-1-1.",
    stat_people: "personas en el condado de Middlesex sufrieron inseguridad alimentaria en 2023",
    stat_wait: "Los gatos mayores esperaron casi el doble para ser adoptados",
    zuzu_tip: "Consejo de Zuzu: llame antes. Muchas despensas solo dan comida para mascotas ciertos días.",
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
document.addEventListener("DOMContentLoaded", () => PP.init());
