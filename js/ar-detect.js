// ==========================================================================
// AR-DETECT.JS – ADARRÓ 360 (SELECTOR D'ENTORNS AR)
// ==========================================================================

console.log("[AR] ar-detect.js carregat neta i exclusivament com a selector");

/* ============================================================
   Funció core unificada cridada des del botó AR d'app.js
   ============================================================ */
window.detectAndLaunchAR = function () {
    const ua = navigator.userAgent.toLowerCase();

    /* ============================================================
       1) iOS + Safari → Apple Quick Look (.usdz)
       ============================================================ */
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS && isSafari) {
        console.log("[AR DETECT] Entorn iOS detectat → Quick Look");
        if (window.ARQuickLook) {
            window.ARQuickLook();
        } else {
            console.error("[AR DETECT] Error: ar-ios.js no carregat o funció absent");
            alert("Error intern en carregar el visor AR d'iOS.");
        }
        return;
    }

    /* ============================================================
       2) Android + Chrome → WebXR Earth Spaces (.glb)
       ============================================================ */
    const isAndroid = /android/.test(ua);
    const isChrome = /chrome/.test(ua);

    if (isAndroid && isChrome && navigator.xr) {
        console.log("[AR DETECT] Entorn Android Chrome detectat → WebXR Earth");
        if (window.startARSessionAndroid) {
            window.startARSessionAndroid();   
        } else {
            console.error("[AR DETECT] Error: ar-android.js no carregat");
            alert("Error intern en inicialitzar WebXR.");
        }
        return;
    }

    /* ============================================================
       3) Fallback → Dispositius no compatibles
       ============================================================ */
    console.warn("[AR DETECT] Dispositiu no compatible amb AR.");
    alert("Aquest dispositiu no suporta AR. Obrint la vila en 3D.");

    if (window.navigateTo) {
        window.navigateTo("explorar3d");
    }
};