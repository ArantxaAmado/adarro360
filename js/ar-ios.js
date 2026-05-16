/* ============================================================
   AR-IOS.JS
   Mode AR per a iOS (Safari) utilitzant Quick Look (.usdz)
   ============================================================ */

console.log("[AR] ar-ios.js carregat");

/* ============================================================
   MODEL ÚNIC DE LA VILA (format USDZ)
   ============================================================ */

const USDZ_MODEL_PATH = "assets/models/villa_darro.usdz";

/* ============================================================
   Funció global cridada des de ar-detect.js
   ============================================================ */
window.ARQuickLook = function () {
    console.log("[AR] Obrint AR Quick Look a iOS");

    // Crear un enllaç temporal <a> amb rel="ar"
    const link = document.createElement("a");
    link.setAttribute("rel", "ar");
    link.setAttribute("href", USDZ_MODEL_PATH);

    // Quick Look requereix una imatge dins l'enllaç
    const img = document.createElement("img");
    img.setAttribute("src", "assets/icon/ar.png");
    img.setAttribute("alt", "AR");
    img.style.width = "1px";   
    img.style.height = "1px";
    link.appendChild(img);

    // Afegir, clicar i eliminar
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
