let currentLang = "ca";
let i18nStrings = {};

// --------------------------------------------------------------------------
// CARREGAR IDIOMA
// --------------------------------------------------------------------------
async function loadLanguage(lang) {
    try {
        const res = await fetch(`./i18n/${lang}.json`);
        if (!res.ok) throw new Error("No s'ha pogut carregar el fitxer: " + res.status);
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
        if (i18nStrings && i18nStrings[key]) {
            el.textContent = i18nStrings[key];
        }
    });
}

// --------------------------------------------------------------------------
// SELECCIONAR IDIOMA (pantalla inicial)
// --------------------------------------------------------------------------
async function selectLanguage(lang) {
    // Esperem que es carregui l'arxiu abans de navegar per assegurar traduccions
    await loadLanguage(lang);
    localStorage.setItem("adarro_lang", lang);

    // Marcar que l'onboarding ja s'ha vist? (no ho fem aquí per defecte)
    // localStorage.setItem("adarro_seen_onboarding", "1");

    // Navegar a home (navigateTo està exposada per app.js)
    if (typeof navigateTo === 'function') {
        navigateTo("home");
    } else if (window.navigateTo) {
        window.navigateTo("home");
    } else {
        console.warn("selectLanguage: navigateTo no està disponible encara.");
    }
}

// --------------------------------------------------------------------------
// INICIALITZACIÓ D'IDIOMA
// --------------------------------------------------------------------------
function initLanguage() {
    const saved = localStorage.getItem("adarro_lang");

    if (saved) {
        // Si ja hi ha idioma guardat, carreguem i anem a home
        loadLanguage(saved);
        if (typeof navigateTo === 'function') {
            navigateTo("home");
        } else if (window.navigateTo) {
            window.navigateTo("home");
        }
    } else {
        // Si no hi ha idioma, mostrar pantalla d'idioma
        if (typeof navigateTo === 'function') {
            navigateTo("screen-language");
        } else if (window.navigateTo) {
            window.navigateTo("screen-language");
        } else {
            console.warn("initLanguage: navigateTo no està disponible encara.");
        }
    }
}

// Exposar initLanguage perquè app.js la cridi quan navigateTo ja existeixi
window.initLanguage = initLanguage;
