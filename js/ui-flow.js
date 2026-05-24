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
                    enterBtn.textContent = "ENTRAR";
                }
            }
        }, 200);
    }

    // Exposar globalment perquè i18n.js la cridi després de triar idioma
    window.startSplashProgress = startSplashProgress;

    // -----------------------------------------------------------
    // 2. BOTÓ "ENTRAR" → ONBOARDING
    // -----------------------------------------------------------
    enterBtn?.addEventListener("click", () => {
        clearInterval(splashInterval);
        navigateTo("onboarding");
    });

    // -----------------------------------------------------------
    // 3. PERMISOS DE CÀMERA
    // -----------------------------------------------------------
    requestCameraBtn?.addEventListener("click", async () => {
        try {
            if (navigator.mediaDevices?.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(t => t.stop());
            }
        } catch (err) {
            console.warn("Permís de càmera denegat:", err);
        }

        finalitzarOnboarding();
    });

    skipOnboardingBtn?.addEventListener("click", finalitzarOnboarding);

    // -----------------------------------------------------------
    // 4. FINALITZAR ONBOARDING → HOME
    // -----------------------------------------------------------
    function finalitzarOnboarding() {
        localStorage.setItem("adarro_seen_onboarding", "true");
        navigateTo("home");
    }

});