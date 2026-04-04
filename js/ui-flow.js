// ==========================================================================
// CONTROL DEL FLUX D'ENTRADA (SPLASH & ONBOARDING) – ADARRÓ 360
// ==========================================================================
// Aquest script gestiona el cicle de vida inicial de l'aplicació: 
// des de la precàrrega visual fins a la gestió de permisos de hardware.

document.addEventListener("DOMContentLoaded", () => {
    // Referències als elements del DOM mitjançant IDs únics
    const splash = document.getElementById("splash");
    const onboarding = document.getElementById("onboarding");
    const enterBtn = document.getElementById("enterBtn");
    const requestCameraBtn = document.getElementById("requestCameraBtn");
    const skipOnboardingBtn = document.getElementById("skipOnboardingBtn");
    const splashBar = document.getElementById("splashProgressBar");

    /* -----------------------------------------------------------
       1. ANIMACIÓ DEL SPLASH (PANTALLA DE CÀRREGA)
    ----------------------------------------------------------- */
    // Simulem una barra de progrés per donar feedback a l'usuari 
    // mentre el Service Worker i els assets s'inicialitzen en segon pla.
    let progress = 0;
    const interval = setInterval(() => {
        progress = Math.min(100, progress + 10); // Increment gradual del 10%
        if (splashBar) splashBar.style.width = progress + "%";

        if (progress >= 100) {
            clearInterval(interval);
            // Un cop carregat, habilitem la interacció
            if (enterBtn) {
                enterBtn.disabled = false;
                enterBtn.textContent = "ENTRAR";
            }
        }
    }, 200);

    /* -----------------------------------------------------------
       2. GESTIÓ DE L'ESTAT D'USUARI (LocalStorage)
    ----------------------------------------------------------- */
    enterBtn?.addEventListener("click", () => {
        // Ocultem la pantalla de càrrega
        if (splash) {
            splash.classList.remove('active');
            splash.style.display = 'none';
        }

        // PERSISTÈNCIA DE DADES: 
        // Verifiquem si l'usuari ja ha passat per l'onboarding anteriorment
        const seenOnboarding = localStorage.getItem("adarro_seen_onboarding");

        if (!seenOnboarding) {
            // PRIMER ACCÉS: Mostrem la guia d'aprenentatge i petició de permisos
            if (onboarding) {
                onboarding.hidden = false;
                onboarding.classList.add('active');
            }
        } else {
            // ACCÉS RECURRENT: Saltem directament a la interfície principal
            if (typeof window.navigateTo === "function") {
                window.navigateTo('home');
            } else {
                document.getElementById('home')?.classList.add('active');
            }
        }
    });

    /* -----------------------------------------------------------
       3. GESTIÓ PROACTIVA DE PERMISOS (CÀMERA)
    ----------------------------------------------------------- */
    // Aquesta secció és clau per a la futura fase de Realitat Augmentada (RA).
    // Demanar permisos aquí evita interrupcions brusques durant l'experiència 3D.

    requestCameraBtn?.addEventListener("click", async () => {
        try {
            // SOL·LICITUD DE PERMÍS REAL: 
            // Fem servir la Media Devices API per validar que l'usuari accepta la càmera.
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

            // OPTIMITZACIÓ DE BATERIA: 
            // Un cop confirmat el permís, aturem immediatament els tracks de vídeo
            // perquè no volem mostrar la càmera encara, només verificar l'accés.
            stream.getTracks().forEach(track => track.stop());

            finalitzarOnboarding();
        } catch (err) {
            // GESTIÓ D'ERRORS I FALLBACK:
            // Si l'usuari denega el permís, l'app segueix sent funcional però s'avisa
            // de la limitació per a la futura RA.
            console.warn("L'usuari ha denegat els permisos de càmera:", err);
            alert("Podràs explorar el jaciment en 3D, però la funció de RA requerirà permisos més endavant.");
            finalitzarOnboarding();
        }
    });

    skipOnboardingBtn?.addEventListener("click", () => {
        finalitzarOnboarding();
    });

    /**
     * Tanca l'onboarding, guarda l'estat i activa la navegació principal.
     */
    function finalitzarOnboarding() {
        // Guardem l'estat al navegador per a futures sessions
        localStorage.setItem("adarro_seen_onboarding", "true");

        if (onboarding) {
            onboarding.classList.remove('active');
            onboarding.hidden = true;
            onboarding.style.display = 'none';
        }

        // Crida a la funció de navegació definida a app.js
        if (typeof window.navigateTo === "function") {
            window.navigateTo('home');
        } else {
            document.getElementById('home')?.classList.add('active');
        }
    }
});