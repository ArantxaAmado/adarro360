// ==========================================================================
// I18N – ADARRÓ 360
// ==========================================================================

let currentLang = "ca";
let i18nStrings = {}; 

// --------------------------------------------------------------------------
// CARREGAR IDIOMA I REFRESCAR LA INTERFÍCIE (ATRIBUTS INCLOSOS)
// --------------------------------------------------------------------------
async function loadLanguage(lang) {
    try {
        const res = await fetch(`i18n/${lang}.json`);
        const data = await res.json();

        // Validació de seguretat del JSON rebut
        if (!data || typeof data !== "object") {
            console.error("[i18n] Error: El JSON d'idioma està mal formatat o buit.");
            return;
        }

        i18nStrings = data;
        currentLang = lang;

        // Actualitzo el localStorage unificat
        localStorage.setItem("adarro_lang", lang);

        // Sincronitzo la variable global d'àudio d'app.js si existeix
        if (typeof audioLang !== "undefined") {
            audioLang = lang;
        }

        // Aplico les traduccions a tota la pantalla
        window.applyTranslations();
        
        // Event global de sistema 
        window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
        
        console.log(`[i18n] Idioma '${lang}' carregat i aplicat amb èxit.`);
    } catch (e) {
        console.error("[i18n] Error crític en carregar el fitxer de traduccions:", e);
}
}

// --------------------------------------------------------------------------
// APLICAR TRADUCCIONS (TEXTOS, ATRIBUTS I FALLBACK)
// --------------------------------------------------------------------------
window.applyTranslations = function() {
    // 1) Textos de contingut ordinaris
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        // Retorno el text o un indicador visible de debug en cas de clau absent
        el.textContent = i18nStrings[key] || `[${key}]`;
    });

    // 2) Atributs dinàmics (title, alt, placeholders, etc.)
    document.querySelectorAll("[data-i18n-attr]").forEach(el => {
        const attrValue = el.getAttribute("data-i18n-attr");
        if (attrValue && attrValue.includes(":")) {
            const [attr, key] = attrValue.split(":");
            if (i18nStrings[key]) {
                el.setAttribute(attr, i18nStrings[key]);
            } else {
                el.setAttribute(attr, `[${key}]`); // Fallback visual de seguretat
            }
        }
    });
};

// ==========================================================================
// INICIALITZACIÓ UNIFICADA EN L'ARRENCADA DE LA PWA
// ==========================================================================
window.initLanguage = async function() {
    console.log("[Init] Inicialitzant entorn d'idiomes d'Adarró360...");
    
    const saved = localStorage.getItem("adarro_lang");
    const seenOnboarding = localStorage.getItem("adarro_seen_onboarding");

    // Evito el FOUT (Flash of Untranslated Text) de català per defecte si està buit.
    // Va directa a la pantalla de banderes sense carregar fons inútils.
    if (!saved) {
        navigateTo("screen-language");
        return;
    }

    // Es Carrega directament l'idioma recordat del sistema
    await loadLanguage(saved);

    // Comprovació de la ruta segons l'estat d'Onboarding de l'usuari
    if (seenOnboarding) {
        navigateTo("home");
        return;
    }

    navigateTo("onboarding");
};

// ==========================================================================
// SELECCIÓ DIRECTA / CANVI EN CALENT (INTERFÍCIE UNIFICADA)
// ==========================================================================

// Selecció des de la pantalla de banderes (Usuari inicial)
window.selectLanguage = async function(lang) {
    await loadLanguage(lang);
    
    // Disparar la barra d'animació de ui-flow.js de manera segura
    navigateTo("splash");
    if (window.startSplashProgress) {
        window.startSplashProgress();
    }
};

// Canvi dinàmic des de panells de configuració dins de l'aplicació
window.setLanguage = async function(lang) {
    await loadLanguage(lang);

    // Gestió del mòdul multimèdia: es talla l'àudio anterior per evitar solapaments idiomàtics
    if (typeof currentAudio !== "undefined" && currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    // Es Corregeix l'estat dels selectors visuals del HUD d'àudios
    const globalIcon = document.querySelector('#globalAudioBtn .material-icons');
    const contextIcon = document.querySelector('.play-btn .material-symbols-outlined');
    if (globalIcon) globalIcon.textContent = 'volume_off';
    if (contextIcon) contextIcon.textContent = 'play_circle';

    console.log(`[i18n] Canvi en calent executat. Interfície sincronitzada i reproductors tancats.`);
};
