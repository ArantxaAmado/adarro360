// ==========================================================================
// LÒGICA DE CONTROL DE L'APP – MILLORADA
// ==========================================================================

let activeScreen = 'home';
let currentAudio = null;

function canEnterRA() {
  // Si en el futur vols més condicions (WebXR suport, etc.), ho afegeixes aquí
  const seenOnboarding = localStorage.getItem("adarro_seen_onboarding");
  return !!seenOnboarding;
}

function navigateTo(targetId) {
  if (activeScreen === targetId) return;

  // Control específic per RA
  if (targetId === 'visor' && !canEnterRA()) {
    console.warn('[App] Intent d’entrar a RA sense onboarding. Redirigint a onboarding.');
    showScreen('onboarding');
    activeScreen = 'onboarding';
    return;
  }

  console.log(`[App] Navegant cap a: ${targetId}`);

  // Neteja visor si canviem de pantalla 3D
  if (window.disposeVisor3D) window.disposeVisor3D();

  // Control d’scroll
  document.body.style.overflow =
    (targetId === 'visor' || targetId === 'anfora') ? 'hidden' : 'auto';

  showScreen(targetId);
  activeScreen = targetId;

  // Inicialitzar visor 3D només quan la pantalla està activa
  if (targetId === 'anfora' || targetId === 'visor') {
    init3DForScreen(targetId);
  }
}

function showScreen(targetId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.toggle('active', screen.id === targetId);
  });

  document.querySelectorAll('.nav-item').forEach(item => {
    const action = item.getAttribute('onclick');
    item.classList.toggle('active', action && action.includes(`'${targetId}'`));
  });
}

function init3DForScreen(targetId) {
  let containerId = null;
  let modelPath = null;

  if (targetId === 'anfora') {
    containerId = 'd-container-piece';
    modelPath = 'assets/models/anfora.glb';
  }

  if (targetId === 'visor') {
    containerId = 'd-container-ra';
    modelPath = 'assets/models/villa_darro.glb';
  }

  const container = document.getElementById(containerId);

  if (!container) {
    console.warn(`[App] Contenidor no trobat: ${containerId}`);
    return;
  }

  // Esperar fins que el contenidor tingui mida real
  waitForContainerSize(container).then(() => {
    if (window.initVisor3D) {
      console.log(`[App] Inicialitzant visor a #${containerId}`);
      window.initVisor3D(containerId, modelPath);
    }
  }).catch(() => {
    console.warn(`[App] No s’ha pogut inicialitzar el visor a #${containerId} (sense mida).`);
  });
}

function waitForContainerSize(container, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const start = performance.now();

    function check() {
      const w = container.clientWidth;
      const h = container.clientHeight;

      if (w > 0 && h > 0) {
        resolve();
      } else if (performance.now() - start > timeout) {
        reject();
      } else {
        requestAnimationFrame(check);
      }
    }

    check();
  });
}

/* UI */

function toggleMode() {
  window.toggleVisorTheme?.();
}

function toggleInfoPanel() {
  const activeScreenEl = document.querySelector('.screen.active');
  if (activeScreenEl) {
    const panel = activeScreenEl.querySelector('.info-panel');
    if (panel) {
      panel.classList.toggle('hidden');
      console.log("Toggle info panel");
    }
  }
}

function resetCamera() {
  window.resetCamera3D?.();
}

/* AUDIO */

function toggleAudio() {
  if (!currentAudio) {
    currentAudio = new Audio('assets/audio/historia_darro.mp3');
  }

  const icon = document.querySelector('.play-btn span');

  if (currentAudio.paused) {
    currentAudio.play().catch(() => {});
    if (icon) icon.textContent = 'pause_circle';
  } else {
    currentAudio.pause();
    if (icon) icon.textContent = 'play_circle';
  }

  currentAudio.onended = () => {
    if (icon) icon.textContent = 'play_circle';
  };
}

/* CONTEXT */

function toggleContext(header) {
  header?.parentElement?.classList.toggle('active');
}

/* INIT */

document.addEventListener('DOMContentLoaded', () => {
  window.navigateTo = navigateTo;
  window.toggleMode = toggleMode;
  window.toggleInfoPanel = toggleInfoPanel;
  window.resetCamera = resetCamera;
  window.toggleAudio = toggleAudio;
  window.toggleContext = toggleContext;

    const startARBtn = document.getElementById('startARBtn');
  if (startARBtn) {
    startARBtn.addEventListener('click', () => {
      if (window.startARSession) {
        window.startARSession();
      } else {
        alert('La RA no està disponible en aquest dispositiu o navegador.');
      }
    });
  }
});

/* PWA */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('✅ PWA activa'))
      .catch(err => console.error(err));
  });
}
