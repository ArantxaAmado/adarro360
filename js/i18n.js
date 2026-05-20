let currentLang = "ca";
let i18nStrings = {};

// --------------------------------------------------------------------------
// CARREGAR IDIOMA
// --------------------------------------------------------------------------
async function loadLanguage(lang) {
    try {
        const res = await fetch(`./i18n/${lang}.json`);
        i18nStrings = await res.json();
        currentLang = lang;

        applyTranslations();
        localStorage.setItem("adarro_lang", lang);
    } catch (e) {
        console.error("Error carregant idioma:", e);
    }
}

// --------------------------------------------------------------------------
// APLICAR TRADUCCIONS
// --------------------------------------------------------------------------
function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (i18nStrings[key]) {
            el.textContent = i18nStrings[key];
        }
    });
}

// --------------------------------------------------------------------------
// SELECCIONAR IDIOMA (pantalla inicial)
// --------------------------------------------------------------------------
function selectLanguage(lang) {
    loadLanguage(lang);
    localStorage.setItem("adarro_lang", lang);

    // Amagar pantalla d'idioma i anar a HOME
    document.getElementById("screen-language").classList.remove("active");
    navigateTo("home");
}

// --------------------------------------------------------------------------
// INICIALITZACIÓ D'IDIOMA
// --------------------------------------------------------------------------
function initLanguage() {
    const saved = localStorage.getItem("adarro_lang");

    if (saved) {
        // L’usuari ja va triar idioma → carregar-lo i anar a HOME
        loadLanguage(saved);
        navigateTo("home");
    } else {
        // Primera vegada → mostrar pantalla d’idioma
        navigateTo("screen-language");
    }
}

document.addEventListener("DOMContentLoaded", initLanguage);
