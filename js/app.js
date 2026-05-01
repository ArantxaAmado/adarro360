// ==========================================================================
// LÒGICA DE CONTROL DE L'APLICACIÓ – ADARRÓ 360 (VERSIÓ FINAL CORREGIDA)
// ==========================================================================

let activeScreen = 'home';
let currentAudio = null;

/**
 * GESTIÓ DE NAVEGACIÓ ENTRE PANTALLES
 * @param {string} targetId - ID de la secció de destí
 */
function navigateTo(targetId) {
  if (activeScreen === targetId) return;

  console.log(`[App] Navegant cap a: ${targetId}`);

  // 1. NETEJA DE RECURSOS 3D
  // Cridem a la funció de neteja global definida a visor3d.js per alliberar GPU
  if (typeof window.disposeVisor3D === 'function') {
    window.disposeVisor3D();
  }

  // 2. GESTIÓ DEL SCROLL DEL BODY
  // Si anem al visor, bloquegem l'scroll del body perquè l'experiència 3D sigui fixa
  if (targetId === 'visor' || targetId === 'anfora') {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
  }

  // 3. CANVI VISUAL DE PANTALLES
  document.getElementById('splash')?.classList.remove('active');
  document.getElementById('onboarding')?.classList.remove('active');

  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.toggle('active', screen.id === targetId);
  });

  // 4. ACTUALITZACIÓ DE LA BARRA DE NAVEGACIÓ (NAV-BAR)
  document.querySelectorAll('.nav-item').forEach(item => {
    const action = item.getAttribute('onclick');
    item.classList.toggle('active', action && action.includes(`'${targetId}'`));
  });

  activeScreen = targetId;

  // 5. INICIALITZACIÓ DEL MOTOR 3D
  if (targetId === 'anfora' || targetId === 'visor') {
    // Esperem un marge perquè el CSS s'apliqui i el contenidor tingui mides reals
    setTimeout(() => {
      const container = document.getElementById('d-container');
      
      if (window.initVisor3D && container) {
        // Seleccionem el model segons la pantalla
        const modelPath = (targetId === 'anfora') 
          ? 'assets/models/anfora.glb' 
          : 'assets/models/villa_darro.glb';
        
        console.log(`[App] Sol·licitant càrrega al visor: ${modelPath}`);
        window.initVisor3D(modelPath);
      }
    }, 250); 
  }
}

/**
 * FUNCIONS D'INTERACCIÓ (Exposades a l'HTML)
 */
function toggleMode() {
  if (window.toggleVisorTheme) window.toggleVisorTheme();
}

function toggleInfoPanel() {
  const panel = document.querySelector('.screen.active .info-panel');
  if (panel) panel.classList.toggle('hidden');
}

function resetCamera() {
  // Cridem a la funció de reset específica del visor3d.js
  if (window.resetCamera3D) {
    window.resetCamera3D();
  } else if (window.resetCamera) {
    window.resetCamera();
  }
}

/**
 * CONTROL DE L'AUDIOGUIA
 */
function toggleAudio() {
  if (!currentAudio) {
    currentAudio = new Audio('assets/audio/historia_darro.mp3'); 
  }

  const playIcon = document.querySelector('.play-btn span');

  if (currentAudio.paused) {
    currentAudio.play().catch(e => console.warn("L'usuari ha d'interaccionar primer per reproduir àudio"));
    if (playIcon) playIcon.textContent = 'pause_circle';
  } else {
    currentAudio.pause();
    if (playIcon) playIcon.textContent = 'play_circle';
  }

  currentAudio.onended = () => {
    if (playIcon) playIcon.textContent = 'play_circle';
  };
}

/**
 * CONTROL DE DESPLEGABLES (CONTEXT)
 */
function toggleContext(header) {
  if (header && header.parentElement) {
    header.parentElement.classList.toggle('active');
  }
}

/**
 * INICIALITZACIÓ GLOBAL
 */
document.addEventListener('DOMContentLoaded', () => {
  // Exposició de funcions al window per als onclick de l'HTML
  window.navigateTo = navigateTo;
  window.toggleMode = toggleMode;
  window.toggleInfoPanel = toggleInfoPanel;
  window.resetCamera = resetCamera;
  window.toggleAudio = toggleAudio; 
  window.toggleContext = toggleContext;
});

// SERVICE WORKER (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('✅ PWA: Service Worker actiu'))
      .catch(err => console.error('❌ PWA: Error:', err));
  });
}