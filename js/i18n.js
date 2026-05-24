let currentLang = "ca";
let i18nStrings = {};

// --------------------------------------------------------------------------
// CARREGAR IDIOMA
// --------------------------------------------------------------------------
async function loadLanguage(lang) {
    try {
        const res = await fetch(`i18n/${lang}.json`);
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
// SELECCIONAR IDIOMA → VA A ONBOARDING
// --------------------------------------------------------------------------
async function selectLanguage(lang) {
    await loadLanguage(lang);
    localStorage.setItem("adarro_lang", lang);

    // CORREGIT: L'ID real del teu HTML és "onboarding"
    navigateTo("onboarding");
}

// --------------------------------------------------------------------------
// INICIALITZACIÓ D'IDIOMA
// --------------------------------------------------------------------------
async function initLanguage() {
    const saved = localStorage.getItem("adarro_lang");

    if (saved) {
        await loadLanguage(saved);
    } else {
        // Fallback si no hi ha idioma guardat: detecta el del navegador
        const nav = navigator.language || navigator.userLanguage;
        const lang = nav.startsWith("es") ? "es" : nav.startsWith("en") ? "en" : "ca";
        await loadLanguage(lang);
    }

    // CORREGIT: L'ID real del teu HTML és "screen-language"
    navigateTo("screen-language");
}

// Exposar perquè app.js la pugui cridar globalment
window.initLanguage = initLanguage;
window.selectLanguage = selectLanguage;
window.applyTranslations = applyTranslations;