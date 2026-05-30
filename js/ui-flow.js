// ==========================================================================
// CONTROL DEL FLUX D'ENTRADA (SPLASH & ONBOARDING) – ADARRÓ 360
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {

    const splash = document.getElementById("splash");
    const onboarding = document.getElementById("onboarding");
    const enterBtn = document.getElementById("enterBtn");
    const requestCameraBtn = document.getElementById("requestCameraBtn");
    const skipOnboardingBtn = document.getElementById("skipOnboardingBtn");
    const splashBar = document.getElementById("splashProgressBar");

    let splashInterval = null;

    // -----------------------------------------------------------
    // 1. BARRA DE PROGRÉS DEL SPLASH
    // -----------------------------------------------------------
    function startSplashProgress() {
        let progress = 0;

        // S'aplica la traducció just a l'inici del Splash 
        if (window.applyTranslations) {
            window.applyTranslations();
        }

        if (splashBar) splashBar.style.width = "0%";
        if (enterBtn) {
            enterBtn.disabled = true;
            enterBtn.textContent = "...";
        }

        clearInterval(splashInterval);
        splashInterval = setInterval(() => {
            progress = Math.min(100, progress + 10);

            if (splashBar) splashBar.style.width = progress + "%";

            if (progress >= 100) {
                clearInterval(splashInterval);
                if (enterBtn) {
                    enterBtn.disabled = false;
                    
                    // Es recupera el text correcte ("Entrar", "Enter"...) configurat a l'inici
                    if (window.applyTranslations) {
                        window.applyTranslations();
                    } else {
                        enterBtn.textContent = "ENTRAR"; 
                    }
                }
            }
        }, 200);
    }

    // Exposar globalment perquè i18n.js la cridi després de triar idioma
    window.startSplashProgress = startSplashProgress;

    // -----------------------------------------------------------
    // 2. BOTÓ "ENTRAR" → NAVEGACIÓ INTEL·LIGENT
    // -----------------------------------------------------------
    enterBtn?.addEventListener("click", () => {
        clearInterval(splashInterval);

        // Es comprova si l'usuari ja ha completat el tutorial prèviament
        const seen = localStorage.getItem("adarro_seen_onboarding");

        if (seen) {
            navigateTo("home");
        } else {
            navigateTo("onboarding");
        }
    });

    // -----------------------------------------------------------
    // 3. PERMISOS DE CÀMERA (PANTALLA ONBOARDING)
    // -----------------------------------------------------------
    requestCameraBtn?.addEventListener("click", async () => {
        try {
            if (navigator.mediaDevices?.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(t => t.stop()); // Tancat immediat preventiu per estalviar bateria
            }
        } catch (err) {
            console.warn("[Camera] Permís denegat o dispositiu absent:", err);
        }

        finalitzarOnboarding();
    });

    // El botó de saltar opcional, protegit contra canvis futurs en l'HTML amb l'encadenament opcional (?.)
    skipOnboardingBtn?.addEventListener("click", finalitzarOnboarding);

    // -----------------------------------------------------------
    // 4. FINALITZAR ONBOARDING → HOME
    // -----------------------------------------------------------
    function finalitzarOnboarding() {
        localStorage.setItem("adarro_seen_onboarding", "true");
        
        // S'assegura que el HUD i elements de la Home agafin l'idioma seleccionat
        if (window.applyTranslations) {
            window.applyTranslations();
        }

        navigateTo("home");
    }

});