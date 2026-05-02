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
    // 1. SPLASH AMB PROGRÉS SIMULAT
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

    // Si l’usuari ja ha fet onboarding → saltar splash automàticament
    if (localStorage.getItem("adarro_seen_onboarding")) {
        splash.style.display = "none";
        window.navigateTo?.("home");
    } else {
        startSplashProgress();
    }

    // -----------------------------------------------------------
    // 2. BOTÓ "ENTRAR"
    // -----------------------------------------------------------
    enterBtn?.addEventListener("click", () => {

        clearInterval(splashInterval);

        splash.style.display = "none";

        const seenOnboarding = localStorage.getItem("adarro_seen_onboarding");

        if (!seenOnboarding) {
            onboarding.hidden = false;
            onboarding.classList.add("active");
        } else {
            window.navigateTo?.("home");
        }
    });

    // -----------------------------------------------------------
    // 3. PERMISOS DE CÀMERA
    // -----------------------------------------------------------
    requestCameraBtn?.addEventListener("click", async () => {
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("API no suportada");
            }

            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(t => t.stop());

            finalitzarOnboarding();

        } catch (err) {
            console.warn("Permís de càmera denegat o no disponible:", err);
            alert("Podràs explorar el jaciment en 3D, però la RA requerirà permisos més endavant.");
            finalitzarOnboarding();
        }
    });

    skipOnboardingBtn?.addEventListener("click", finalitzarOnboarding);

    // -----------------------------------------------------------
    // 4. FINALITZAR ONBOARDING 
    // -----------------------------------------------------------
    function finalitzarOnboarding() {

        localStorage.setItem("adarro_seen_onboarding", "true");

        // Amagar onboarding SEMPRE
        onboarding.hidden = true;
        onboarding.style.display = "none";
        onboarding.classList.remove("active");

        // Només navegar si NO estem ja a HOME
        if (window.activeScreen !== "home" && window.navigateTo) {
            window.navigateTo("home");
        }
    }
});
