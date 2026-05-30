// ==========================================================================
// AR-IOS.JS – ADARRÓ 360
// Mode AR per a iOS (Safari) utilitzant Apple Quick Look (.usdz)
// ==========================================================================
console.log("[AR] ar-ios.js carregat correctament");

/* ============================================================
   MODEL ÚNIC DE LA VILA ROMANA (Format Apple USDZ comprimit)
   ============================================================ */
// S'afegeix '#allowsContentScaling=0' per evitar que l'usuari pugui deformar
// o encongir l'escala real (1:1) de la vila romana durant la visita al jaciment.
const USDZ_MODEL_PATH = "assets/models/villa_darro.usdz#allowsContentScaling=0";

/* ============================================================
   Funció global cridada des de ar-detect.js
   ============================================================ */
window.ARQuickLook = function () {
    console.log("[AR] Preparant activació d'Apple AR Quick Look a iOS...");

    // 1. Crear l'enllaç temporal <a> requerit per Apple amb la relació "ar"
    const link = document.createElement("a");
    link.setAttribute("rel", "ar");
    link.setAttribute("href", USDZ_MODEL_PATH);

    // 2. Requisit de Quick Look: Necessita contenir un element gràfic (imatge o text)
    // a dins de l'enllaç per validar el destí gràfic 3D de l'hipervincle.
    const img = document.createElement("img");
    img.setAttribute("src", "assets/icon/ar.png"); // Icona neta del visor
    img.setAttribute("alt", "Activar Realitat Augmentada");
    img.style.width = "1px";   
    img.style.height = "1px";
    img.style.opacity = "0"; // Invisible però present al DOM per seguretat visual
    link.appendChild(img);

    // 3. Inserció efímera al document body
    document.body.appendChild(link);

    // 4. Execució del clic. Al provenir immediatament de la interacció del botó
    // de la interfície, Safari accepta l'acció de l'usuari i obre el visor natiu.
    try {
        link.click();
        console.log("[AR] Enllaç Quick Look executat correctament.");
    } catch (err) {
        console.error("[AR] Error crític llançant el Quick Look natiu:", err);
    }

    // 5. Neteja immediata del node per evitar duplicats residuals al DOM
    setTimeout(() => {
        if (link.parentNode) {
            document.body.removeChild(link);
        }
    }, 100);
};