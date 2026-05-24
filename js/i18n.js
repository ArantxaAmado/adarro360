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
// SELECCIONAR IDIOMA → VA AL SPLASH
// --------------------------------------------------------------------------
async function selectLanguage(lang) {
    await loadLanguage(lang);
    localStorage.setItem("adarro_lang", lang);

    navigateTo("splash");

    if (window.startSplashProgress) {
        window.startSplashProgress();
    }
}

// --------------------------------------------------------------------------
// INICIALITZACIÓ D'IDIOMA
// --------------------------------------------------------------------------
async function initLanguage() {
    const saved = localStorage.getItem("adarro_lang");
    const seenOnboarding = localStorage.getItem("adarro_seen_onboarding");

    // 1. Si ja està tot fet → HOME
    if (saved && seenOnboarding) {
        await loadLanguage(saved);
        navigateTo("home");
        return;
    }

    // 2. Si té idioma però no onboarding → SPLASH
    if (saved && !seenOnboarding) {
        await loadLanguage(saved);
        navigateTo("splash");
        if (window.startSplashProgress) window.startSplashProgress();
        return;
    }

    // 3. Primer cop → IDIOMA
    await loadLanguage("ca");
    navigateTo("screen-language");

    document.dispatchEvent(new Event("adarro_language_ready"));
}

// Exposar funcions
window.initLanguage = initLanguage;
window.selectLanguage = selectLanguage;
window.applyTranslations = applyTranslations;
