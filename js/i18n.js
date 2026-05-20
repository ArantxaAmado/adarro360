let currentLang = "ca";
let i18nStrings = {};

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

function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (i18nStrings[key]) {
            el.textContent = i18nStrings[key];
        }
    });
}

function initLanguage() {
    const saved = localStorage.getItem("adarro_lang");

    if (saved) {
        loadLanguage(saved);
    } else {
        const nav = navigator.language || navigator.userLanguage;
        const lang = nav.startsWith("es")
            ? "es"
            : nav.startsWith("en")
            ? "en"
            : "ca";

        loadLanguage(lang);
    }
}

document.addEventListener("DOMContentLoaded", initLanguage);
