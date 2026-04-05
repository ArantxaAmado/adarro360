// ==========================================================================
// LÒGICA DE CONTROL DE L'APLICACIÓ – ADARRÓ 360
// ==========================================================================
// Aquest fitxer gestiona l'estat global, la navegació i la integració
// entre el DOM (interfície) i el motor de renderitzat Three.js.

let activeScreen = 'home';
let currentRenderer = null; // Referència al renderitzador actual per a la gestió de memòria
let currentAudio = null;    // Variable per controlar la reproducció de l'audioguia

/**
 * GESTIÓ DE NAVEGACIÓ ENTRE PANTALLES
 * @param {string} targetId - ID de la secció de destí
 */
function navigateTo(targetId) {
  // Evitem recarregar la mateixa pantalla si ja hi som
  if (activeScreen === targetId) return;

  // NETEJA DE RECURSOS (Garbage Collection manual):
  // Si sortim d'una vista 3D, hem de destruir el context WebGL per no col·lapsar la RAM.
  if (activeScreen === 'visor' || activeScreen === 'anfora') {
    disposeVisor3D();
  }

  // Gestió visual de les pantalles d'inici (Splash i Onboarding)
  document.getElementById('splash')?.classList.remove('active');
  document.getElementById('onboarding')?.classList.remove('active');

  // Commutació de classes 'active' per a les vistes (screens)
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.toggle('active', screen.id === targetId);
  });

  // Actualització visual de la barra de navegació inferior
  document.querySelectorAll('.nav-item').forEach(item => {
    const onclick = item.getAttribute('onclick');
    item.classList.toggle('active', onclick?.includes(`'${targetId}'`));
  });

  activeScreen = targetId;

  // INICIALITZACIÓ ASÍNCRONA DEL VISOR 3D:
  // Usem un timeout mínim per assegurar que el contenidor DOM és visible i té mides 
  // abans d'arrencar el motor de renderitzat.
  setTimeout(() => {
    if (window.initVisor3D) {
      if (targetId === 'anfora') {
        // Carrega el model de l'objecte (Ànfora)
        const visor = window.initVisor3D('assets/models/anfora.glb');
        if (visor?.renderer) currentRenderer = visor.renderer;
      } else if (targetId === 'visor') {
        // MODIFICACIÓ: Carrega el model volumètric de la Vil·la Romana (Greyboxing)
        const visor = window.initVisor3D('assets/models/villa_darro.glb');
        if (visor?.renderer) currentRenderer = visor.renderer;
      }
    }
  }, 50); 
}

/**
 * ALLIBERAMENT DE MEMÒRIA (DISPOSE)
 * Atura el bucle d'animació i destrueix el context WebGL. 
 * Crític per a l'estabilitat en dispositius iOS/Android.
 */
function disposeVisor3D() {
  if (window.stopVisorAnimation) window.stopVisorAnimation();
  if (currentRenderer) {
    currentRenderer.dispose(); // Allibera el context GPU
    currentRenderer = null;
  }
  const container = document.getElementById('d-container');
  if (container) container.innerHTML = ''; // Neteja física del contenidor DOM
}

/**
 * FUNCIONS D'INTERACCIÓ AMB EL VISOR
 */
function toggleMode() {
  if (window.toggleVisorTheme) window.toggleVisorTheme(); // Canvi de mode clar/fosc
}

function toggleInfoPanel() {
  const panel = document.querySelector('.screen.active .info-panel');
  if (panel) panel.classList.toggle('hidden'); // Obre/Tanca el panell de dades històriques
}

function resetCamera() {
  if (window.resetCamera) window.resetCamera(); // Torna el model a la posició inicial
}

/**
 * CONTROL DE L'AUDIOGUIA (Web Audio API simplificada)
 */
function toggleAudio() {
  // Inicialització lazy (només creem l'objecte quan l'usuari el necessita)
  if (!currentAudio) {
    currentAudio = new Audio('assets/audio/historia_darro.mp3'); 
  }

  // Localitzem la icona del botó per donar feedback visual a l'usuari
  const playIcon = document.querySelector('.play-btn .material-symbols-outlined, .play-btn .material-icons');

  if (currentAudio.paused) {
    currentAudio.play().catch(e => console.error("Error reproduint àudio:", e));
    if (playIcon) playIcon.textContent = 'pause_circle';
  } else {
    currentAudio.pause();
    if (playIcon) playIcon.textContent = 'play_circle';
  }

  // Restabliment d'icona automàtic en acabar la locució
  currentAudio.onended = () => {
    if (playIcon) playIcon.textContent = 'play_circle';
  };
}

/**
 * INTERACCIÓ DE TEXTOS (ACORDIONS)
 * Permet desplegar blocs d'informació contextual de forma neta.
 */
function toggleContext(header) {
  const block = header.parentElement;
  block.classList.toggle('active');
}

/**
 * INICIALITZACIÓ I EXPOSICIÓ GLOBAL
 * Fem que les funcions siguin accessibles des dels atributs 'onclick' de l'HTML.
 */
document.addEventListener('DOMContentLoaded', () => {
  window.navigateTo = navigateTo;
  window.toggleMode = toggleMode;
  window.toggleInfoPanel = toggleInfoPanel;
  window.resetCamera = resetCamera;
  window.toggleAudio = toggleAudio; 
  window.toggleContext = toggleContext; 
});

// =====================================================
// REGISTRE DEL SERVICE WORKER (PWA)
// =====================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('✅ PWA: Service Worker actiu al lloc:', reg.scope);
      })
      .catch(err => {
        console.error('❌ PWA: Error al registrar el SW:', err);
      });
  });
}