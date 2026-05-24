// ==========================================================================
// CONTROL DEL FLUX D'ENTRADA (SPLASH & ONBOARDING) – ADARRÓ 360
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {

    const splash = document.getElementById("splash");
    const enterBtn = document.getElementById("enterBtn");
    const requestCameraBtn = document.getElementById("requestCameraBtn");
    const skipOnboardingBtn = document.getElementById("skipOnboardingBtn");
    const splashBar = document.getElementById("splashProgressBar");

    let splashInterval = null;

    // -----------------------------------------------------------
    // 1. SPLASH (només després de triar idioma)
    // -----------------------------------------------------------
    function startSplashProgress() {
        let progress = 0;

        splashInterval = setInterval(() => {
            progress = Math.min(100, progress + 10);
            if (splashBar) splashBar.style.width = progress + "%";

            if (progress >= 100) {
                clearInterval(splashInterval);
                enterBtn.disabled = false;
                enterBtn.textContent = "ENTRAR";
            }
        }, 200);
    }

    // -----------------------------------------------------------
    // 2. Quan l’idioma està llest → mostrar SPLASH
    // -----------------------------------------------------------
    document.addEventListener("adarro_language_ready", () => {

        // Si ja ha fet onboarding → anar directament a home
        if (localStorage.getItem("adarro_seen_onboarding")) {
            navigateTo("home");
            return;
        }

        // Si NO ha fet onboarding → mostrar splash
        navigateTo("splash");
        startSplashProgress();
    });

    // -----------------------------------------------------------
    // 3. BOTÓ "ENTRAR" → anar a ONBOARDING
    // -----------------------------------------------------------
    enterBtn?.addEventListener("click", () => {
        clearInterval(splashInterval);
        navigateTo("onboarding");
    });

    // -----------------------------------------------------------
    // 4. PERMISOS DE CÀMERA
    // -----------------------------------------------------------
    requestCameraBtn?.addEventListener("click", async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(t => t.stop());
        } catch (err) {
            console.warn("Permís de càmera denegat:", err);
        }

        finalitzarOnboarding();
    });

    skipOnboardingBtn?.addEventListener("click", finalitzarOnboarding);

    // -----------------------------------------------------------
    // 5. FINALITZAR ONBOARDING → HOME
    // -----------------------------------------------------------
    function finalitzarOnboarding() {
        localStorage.setItem("adarro_seen_onboarding", "true");
        navigateTo("home");
    }

});
