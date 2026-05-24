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
// SELECCIONAR IDIOMA → VA AL SPLASH (PANTALLA DE CÀRREGA)
// --------------------------------------------------------------------------
async function selectLanguage(lang) {
    await loadLanguage(lang);
    localStorage.setItem("adarro_lang", lang);

    // Un cop triat l'idioma, anem a la pantalla de Splash per carregar recursos
    navigateTo("splash");
    
    // Si la funció de la barra de progrés existeix a ui-flow.js, la iniciem
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

    // 1. Si l'usuari ja ho ha configurat tot anteriorment -> Directe a la HOME
    if (saved && seenOnboarding) {
        await loadLanguage(saved);
        navigateTo("home");
        return;
    }

    // 2. Si té idioma guardat però no ha vist l'onboarding -> Va al Splash directament
    if (saved && !seenOnboarding) {
        await loadLanguage(saved);
        navigateTo("splash");
        if (window.startSplashProgress) window.startSplashProgress();
        return;
    }

    // 3. Primer cop absolut -> Forcem la pantalla de selecció d'idioma
    // Carreguem català per defecte per evitar textos buits mentre tria
    await loadLanguage("ca"); 
    navigateTo("screen-language");
}

// Exposar les funcions globalment
window.initLanguage = initLanguage;
window.selectLanguage = selectLanguage;
window.applyTranslations = applyTranslations;