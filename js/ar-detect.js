/* ============================================================
   AR-DETECT.JS
   Detecta el tipus de dispositiu i activa el mode AR adequat.
   - Android + Chrome → AR geolocalitzat (WebXR)
   - iOS + Safari → AR Quick Look (.usdz)
   - Altres → Fallback (visor 3D o missatge)
   ============================================================ */

console.log("[AR] ar-detect.js carregat");

// Referència al botó AR de la HOME
const arLauncher = document.getElementById("arLauncher");

if (arLauncher) {
    arLauncher.addEventListener("click", handleARRequest);
}

/* ============================================================
   Funció principal
   ============================================================ */
function handleARRequest() {
    const ua = navigator.userAgent.toLowerCase();

    // -------------------------------
    // 1) iOS + Safari → AR Quick Look
    // -------------------------------
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS && isSafari) {
        console.log("[AR] Mode iOS Quick Look");
        launchARQuickLook();
        return;
    }

    // -------------------------------
    // 2) Android + Chrome → WebXR
    // -------------------------------
    const isAndroid = /android/.test(ua);
    const isChrome = /chrome/.test(ua);

    if (isAndroid && isChrome && navigator.xr) {
        console.log("[AR] Mode Android WebXR");
        launchARAndroid();
        return;
    }

    // -------------------------------
    // 3) Fallback → No AR
    // -------------------------------
    console.warn("[AR] AR no disponible en aquest dispositiu");
    alert("Aquest dispositiu no suporta AR. Pots explorar la vila en 3D.");
    navigateTo("explorar");
}

/* ============================================================
   Funcions que deleguen als altres fitxers
   ============================================================ */

function launchARQuickLook() {
    if (window.ARQuickLook) {
        window.ARQuickLook();
    } else {
        console.error("[AR] ar-ios.js no carregat");
    }
}

function launchARAndroid() {
    if (window.startGeoAR) {
        window.startGeoAR();
    } else {
        console.error("[AR] ar-android.js no carregat");
    }
}
