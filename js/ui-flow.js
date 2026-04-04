document.addEventListener("DOMContentLoaded", () => {
    // Referències als elements del DOM
    const splash = document.getElementById("splash");
    const onboarding = document.getElementById("onboarding");
    const enterBtn = document.getElementById("enterBtn");
    const requestCameraBtn = document.getElementById("requestCameraBtn");
    const skipOnboardingBtn = document.getElementById("skipOnboardingBtn");
    const splashBar = document.getElementById("splashProgressBar");

    /* ------------------------------
       1. ANIMACIÓ DEL SPLASH
    ------------------------------ */
    let progress = 0;
    const interval = setInterval(() => {
        progress = Math.min(100, progress + 10); // Puja de 10 en 10
        if (splashBar) splashBar.style.width = progress + "%";

        if (progress >= 100) {
            clearInterval(interval);
            if (enterBtn) {
                enterBtn.disabled = false;
                enterBtn.textContent = "ENTRAR";
            }
        }
    }, 200);

    /* ------------------------------
       2. BOTÓ ENTRAR (Des del Splash)
    ------------------------------ */
    enterBtn?.addEventListener("click", () => {
        // Amaguem el splash (treiem la classe active o el fem desaparèixer)
        if (splash) {
            splash.classList.remove('active');
            splash.style.display = 'none';
        }

        // Mirem si l'usuari ja ha vist l'onboarding abans
        const seenOnboarding = localStorage.getItem("adarro_seen_onboarding");

        if (!seenOnboarding) {
            // Si no l'ha vist, mostrem la pantalla d'onboarding
            if (onboarding) {
                onboarding.hidden = false;          // <- CLAU
                onboarding.classList.add('active');
            }
        } else {
            // Si ja l'ha vist, anem directes a la Home usant la teva funció de app.js
            if (typeof window.navigateTo === "function") {
                window.navigateTo('home');
            } else {
                document.getElementById('home')?.classList.add('active');
            }
        }
    });

    /* ------------------------------
       3. BOTONS DE L'ONBOARDING
    ------------------------------ */

    // Cas A: L'usuari prem "Donar permisos"
    requestCameraBtn?.addEventListener("click", async () => {
        try {
            // Demanem el permís real al navegador
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

            // Un cop concedit, aturem la càmera immediatament per no gastar bateria
            stream.getTracks().forEach(track => track.stop());

            // Marquem com a vist i anem a Home
            finalitzarOnboarding();
        } catch (err) {
            console.warn("L'usuari ha denegat els permisos o hi ha hagut un error:", err);
            alert("Recorda que per a l'experiència de Realitat Augmentada caldrà que activis la càmera més tard.");
            finalitzarOnboarding();
        }
    });

    // Cas B: L'usuari prem "Saltar"
    skipOnboardingBtn?.addEventListener("click", () => {
        finalitzarOnboarding();
    });

    // Funció auxiliar per tancar l'onboarding i anar a la Home
    function finalitzarOnboarding() {
        localStorage.setItem("adarro_seen_onboarding", "true");

        // Amaguem l'onboarding de totes les maneres possibles
        if (onboarding) {
            onboarding.classList.remove('active');
            onboarding.hidden = true;
            onboarding.style.display = 'none'; // Ens assegurem que el CSS no el forci
        }

        // Ara sí, cridem a la navegació principal
        if (typeof window.navigateTo === "function") {
            window.navigateTo('home');
        } else {
            document.getElementById('home')?.classList.add('active');
        }
    }

});
