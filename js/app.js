// ==========================================================================
// APP.JS – ADARRÓ 360 (CORE DE NAVEGACIÓ I CONTROL AUDIO/3D)
// ==========================================================================

let activeScreen = null;
let currentAudio = null;
let audioLang = 'ca'; 

let modelLoaded = {
  anfora: false,
  visor: false,
  explorar3d: false 
};

// --------------------------------------------------------------------------
// NAVEGACIÓ ENTRE PANTALLES
// --------------------------------------------------------------------------
function navigateTo(targetId) {

  // 1. Destruir visor antic si venim d'una pantalla 3D (S'inclou explorar3d)
  if (activeScreen === 'anfora' || activeScreen === 'visor' || activeScreen === 'explorar3d') {
    if (window.disposeVisor3D) window.disposeVisor3D();
    modelLoaded[activeScreen] = false;
  }

  // 2. Amagar totes les pantalles
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // 3. Mostrar la pantalla objectiu
  const target = document.getElementById(targetId);
  if (!target) {
    console.error("Pantalla no trobada:", targetId);
    return;
  }

  target.classList.add('active');
  activeScreen = targetId;
  window.activeScreen = targetId;

  // 4. Traduccions de la interfície (S'executen sense interrupcions de codi)
  if (window.applyTranslations) {
    window.applyTranslations();
  }

  // 5. Inicialitzar visor 3D si cal (S'inclou la condició per a explorar3d)
  if (targetId === 'anfora' || targetId === 'visor' || targetId === 'explorar3d') {
    const containerId = targetId === 'anfora' ? 'd-container-piece' : 
                        (targetId === 'visor' ? 'd-container-ra' : 'd-container-explorar');
    const container = document.getElementById(containerId);

    if (container) {
      // 1) Dono temps perquè la pantalla passi de display:none → flex
      setTimeout(() => {

        // 2) Ara espero que el contenidor tingui mida real (> 0px)
        waitForContainerSize(container).then(() => {

          // 3) Es dona un últim tick perquè el layout s’estabilitzi del tot
          setTimeout(() => {

            if (container.parentElement) container.parentElement.style.height = "100%";
            container.style.height = "100%";

            // Inicialitzoçació del Three.js amb mides reals garantides
            init3DForScreen(targetId);

            // Forço el recalculat de mida de la càmera per si de cas
            setTimeout(() => {
              if (window.forceVisorResize) window.forceVisorResize(containerId);
            }, 50);

            setTimeout(() => {
              if (window.forceVisorResize) window.forceVisorResize(containerId);
            }, 250);

          }, 50); // El delay clau de seguretat per al layout

        });

      }, 100);
    }
  }
  
  // ----------------------------------------------------------------------
  // 6. CONTROL GLOBAL D'AUDIO
  // ----------------------------------------------------------------------
  const audioBtn = document.getElementById('globalAudioBtn');
  const audioScreens = ['context', 'visor', 'explorar3d']; // Netejat de rutes inexistents

  if (!audioScreens.includes(targetId) && currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    const contextIcon = document.querySelector('.play-btn .material-symbols-outlined');
    if (contextIcon) contextIcon.textContent = 'play_circle';
  }

  if (audioBtn) {
    if (targetId === 'home') {
      audioBtn.style.display = 'none';
    } else if (audioScreens.includes(targetId)) {
      audioBtn.style.display = 'flex';
      const globalIcon = audioBtn.querySelector('.material-icons');
      if (globalIcon) {
        globalIcon.textContent = (currentAudio && !currentAudio.paused) ? 'volume_up' : 'volume_off';
      }
    } else if (currentAudio && !currentAudio.paused) {
      audioBtn.style.display = 'flex';
    } else {
      audioBtn.style.display = 'none';
    }
  }
}

// --------------------------------------------------------------------------
// ESPERAR FINS QUE EL CONTENIDOR TINGUI MIDA REAL
// --------------------------------------------------------------------------
function waitForContainerSize(container, timeout = 3000) {
  return new Promise(resolve => {
    const start = performance.now();

    function check() {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        resolve();
      } else if (performance.now() - start > timeout) {
        console.warn("Timeout esperant mida del contenidor");
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    } check();
  });
}

// --------------------------------------------------------------------------
// INICIALITZAR VISOR 3D PER A CADA PANTALLA
// --------------------------------------------------------------------------
function init3DForScreen(targetId) {
  if (modelLoaded[targetId]) return;

  let containerId, modelPath;

  if (targetId === 'anfora') {
    containerId = 'd-container-piece';
    modelPath = 'assets/models/anfora.glb';
  }

  if (targetId === 'visor') {
    containerId = 'd-container-ra';
    modelPath = 'assets/models/villa_darro.glb';
  }

  if (targetId === 'explorar3d') {
    containerId = 'd-container-explorar';
    modelPath = 'assets/models/villa_darro.glb';
  }

  console.log("[App] Inicialitzant visor a:", containerId);
  window.initVisor3D(containerId, modelPath);
  modelLoaded[targetId] = true; 
}

// --------------------------------------------------------------------------
// INICIALITZACIÓ GENERAL EN ENGEGAR EL DOM
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  window.navigateTo = navigateTo;

  // Es Delega la inicialització d'idiomes al script i18n.js de forma asíncrona
  if (window.initLanguage) {
    await window.initLanguage();
  }

  const audioBtn = document.getElementById('globalAudioBtn');
  if (audioBtn) {
    audioBtn.addEventListener('click', toggleAudio);
  }

  const startARBtn = document.getElementById('startARBtn');
  if (startARBtn) {
    startARBtn.addEventListener('click', () => {
      console.log("[UI] Botó Començar premut");
      if (window.startARSession) {
        window.startARSession();
      } else {
        console.warn("Funció startARSession no disponible.");
      }
    });
  }
});

// --------------------------------------------------------------------------
// FUNCIONS NECESSÀRIES PER EVITAR ERRORS AL VISOR 3D
// --------------------------------------------------------------------------
window.toggleInfoPanel = function () {
  const panel = document.querySelector('#anfora .info-panel');
  panel?.classList.toggle('hidden');
};

window.toggleMode = function () {
  window.toggleVisorTheme?.();
};

window.resetCamera = function () {
  window.resetCamera3D?.();
};

// --------------------------------------------------------------------------
// AUDIO: DETECTAR FITXER SEGONS LA VARIABLE UNIFICADA
// --------------------------------------------------------------------------
function getAudioFileForLanguage() {
  // Sincronització amb la clau 'adarro_lang' de i18n.js
  let lang = localStorage.getItem('adarro_lang') || 'ca';

  lang = lang.toLowerCase();
  if (lang.startsWith('ca')) lang = 'ca';
  else if (lang.startsWith('es')) lang = 'es';
  else if (lang.startsWith('en')) lang = 'en';

  let file;
  switch (lang) {
    case 'es':
      file = 'assets/audio/historia_darro_es.mp3';
      break;
    case 'en':
      file = 'assets/audio/historia_darro_en.mp3';
      break;
    default:
      // Fitxer natiu precatxat al sw.js per al mode offline
      file = 'assets/audio/historia_darro.mp3';
      break;
  }

  console.log('[AUDIO CONTROL] Idioma de veu processat =', lang, '→ Carregant:', file);
  return file;
}

// --------------------------------------------------------------------------
// CONTROL REPRODUCTOR / PAUSA
// --------------------------------------------------------------------------
function toggleAudio() {
  if (!currentAudio) {
    const audioFile = getAudioFileForLanguage();
    console.log(">>> [Audio] Creant instància real en memòria amb l'arxiu:", audioFile);
    currentAudio = new Audio(audioFile);
    currentAudio.loop = true;
  }

  const globalIcon = document.querySelector('#globalAudioBtn .material-icons');
  const contextIcon = document.querySelector('.play-btn .material-symbols-outlined');

  if (currentAudio.paused) {
    currentAudio.play();
    if (globalIcon) globalIcon.textContent = 'volume_up';
    if (contextIcon) contextIcon.textContent = 'pause_circle';
  } else {
    currentAudio.pause();
    if (globalIcon) globalIcon.textContent = 'volume_off';
    if (contextIcon) contextIcon.textContent = 'play_circle';
  }
}
window.toggleAudio = toggleAudio;

// --------------------------------------------------------------------------
// DESPLEGABLES CONTEXT HISTÒRIC
// --------------------------------------------------------------------------
function toggleContext(header) {
  const block = header.parentElement;
  block.classList.toggle("active");
}
window.toggleContext = toggleContext;