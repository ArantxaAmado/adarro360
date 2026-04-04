let activeScreen = 'home';
let currentRenderer = null;
let currentAudio = null; // Variable per controlar l'àudio

function navigateTo(targetId) {
  if (activeScreen === targetId) return;

  if (activeScreen === 'visor' || activeScreen === 'anfora') {
    disposeVisor3D();
  }

  document.getElementById('splash')?.classList.remove('active');
  document.getElementById('onboarding')?.classList.remove('active');

  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.toggle('active', screen.id === targetId);
  });

  document.querySelectorAll('.nav-item').forEach(item => {
    const onclick = item.getAttribute('onclick');
    item.classList.toggle('active', onclick?.includes(`'${targetId}'`));
  });

  activeScreen = targetId;

  // Esperem un instant perquè el DOM s'actualitzi i el contenidor tingui mida
  setTimeout(() => {
    if (window.initVisor3D) {
      if (targetId === 'anfora') {
        const visor = window.initVisor3D('assets/models/anfora.glb');
        if (visor?.renderer) currentRenderer = visor.renderer;
      } else if (targetId === 'visor') {
        const visor = window.initVisor3D('assets/models/anfora.glb');
        if (visor?.renderer) currentRenderer = visor.renderer;
      }
    }
  }, 50); 
}

function disposeVisor3D() {
  if (window.stopVisorAnimation) window.stopVisorAnimation();
  if (currentRenderer) {
    currentRenderer.dispose();
    currentRenderer = null;
  }
  const container = document.getElementById('d-container');
  if (container) container.innerHTML = '';
}

function toggleMode() {
  if (window.toggleVisorTheme) window.toggleVisorTheme();
}

function toggleInfoPanel() {
  const panel = document.querySelector('.screen.active .info-panel');
  if (panel) panel.classList.toggle('hidden');
}

function resetCamera() {
  if (window.resetCamera) window.resetCamera();
}

// NOVA FUNCIÓ PER A L'ÀUDIO
function toggleAudio() {
    // Si no s'ha creat l'objecte àudio, el creem
    if (!currentAudio) {
        // REVISA QUE AQUESTA RUTA SIGUI CORRECTA (minúscules!)
        currentAudio = new Audio('assets/audio/historia_darro.mp3'); 
    }

    // Busquem la icona dins del botó de play (funciona per a Symbols i Icons)
    const playIcon = document.querySelector('.play-btn .material-symbols-outlined, .play-btn .material-icons');

    if (currentAudio.paused) {
        currentAudio.play().catch(e => console.error("Error reproduint àudio:", e));
        if (playIcon) playIcon.textContent = 'pause_circle';
    } else {
        currentAudio.pause();
        if (playIcon) playIcon.textContent = 'play_circle';
    }

    // Si l'àudio s'acaba sol, tornem la icona a "play"
    currentAudio.onended = () => {
        if (playIcon) playIcon.textContent = 'play_circle';
    };
}

// També necessitem una funció per als acordions de l'HTML (toggleContext)
function toggleContext(header) {
    const block = header.parentElement;
    block.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
  window.navigateTo = navigateTo;
  window.toggleMode = toggleMode;
  window.toggleInfoPanel = toggleInfoPanel;
  window.resetCamera = resetCamera;
  window.toggleAudio = toggleAudio; // Exposem la funció a l'HTML
  window.toggleContext = toggleContext; // Exposem la funció dels textos
});