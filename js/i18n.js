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

    // FIX: Cambiat 'onboarding' per 'screen-onboarding' que és l'ID real a l'HTML
    navigateTo("screen-onboarding");
}

// --------------------------------------------------------------------------
// INICIALITZACIÓ D'IDIOMA
// SEMPRE MOSTRA LA PANTALLA D’IDIOMA PRIMER
// --------------------------------------------------------------------------
async function initLanguage() {
    const saved = localStorage.getItem("adarro_lang");

    if (saved) {
        await loadLanguage(saved);
    }

    // FIX: Cambiat 'screen-language' per 'language-screen' que és l'ID real a l'HTML
    navigateTo("language-screen");
}

// Exposar perquè app.js la pugui cridar
window.initLanguage = initLanguage;
window.selectLanguage = selectLanguage;
window.applyTranslations = applyTranslations;