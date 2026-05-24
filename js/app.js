// ==========================================================================
// APP.JS 
// ==========================================================================

let activeScreen = null;
let currentAudio = null;
let audioLang = 'ca'; 

let modelLoaded = {
  anfora: false,
  visor: false
};

// --------------------------------------------------------------------------
// NAVEGACIÓ ENTRE PANTALLES
// --------------------------------------------------------------------------
function navigateTo(targetId) {

  // 1. Destruir visor antic si venim d'una pantalla 3D
  if (activeScreen === 'anfora' || activeScreen === 'visor') {
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

  // 5. Inicialitzar visor 3D si cal
  if (targetId === 'anfora' || targetId === 'visor') {
    const containerId = targetId === 'anfora' ? 'd-container-piece' : 'd-container-ra';
    const container = document.getElementById(containerId);

    waitForContainerSize(container).then(() => {
      container.parentElement.style.height = "100%";
      container.style.height = "100%";

      init3DForScreen(targetId);

      setTimeout(() => {
        if (window.forceVisorResize) window.forceVisorResize(containerId);
      }, 50);

      setTimeout(() => {
        if (window.forceVisorResize) window.forceVisorResize(containerId);
      }, 250);
    });
  }

  // ----------------------------------------------------------------------
  // 6. CONTROL GLOBAL D'AUDIO (Apareix on toca, amagat a la HOME)
  // ----------------------------------------------------------------------
  const audioBtn = document.getElementById('globalAudioBtn');
  const audioScreens = ['context', 'visor', 'explorar'];

  // Si sortim de les pantalles d'àudio, s'atura el so per evitar superposicions
  if (!audioScreens.includes(targetId) && currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    // Restablir les icones dels reproductors de la pàgina a mode 'Play'
    const contextIcon = document.querySelector('.play-btn .material-symbols-outlined');
    if (contextIcon) contextIcon.textContent = 'play_circle';
  }

  if (audioBtn) {
    if (targetId === 'home') {
      audioBtn.style.display = 'none';
    } else if (audioScreens.includes(targetId)) {
      audioBtn.style.display = 'flex';
      // Sincronitzem la icona del botó flotant segons si realment està sonant o no
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
    }

    check();
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

  console.log("[App] Inicialitzant visor:", containerId);
  window.initVisor3D(containerId, modelPath);

  modelLoaded[targetId] = true;
}

// --------------------------------------------------------------------------
// INICIALITZACIÓ GENERAL
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  window.navigateTo = navigateTo;

  if (window.initLanguage) {
    await window.initLanguage();
  }

  const audioBtn = document.getElementById('globalAudioBtn');
  if (audioBtn) {
    audioBtn.addEventListener('click', toggleAudio);
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
// AUDIO: DETECTAR FITXER SEGONS LA VARIABLE BLINDADA
// --------------------------------------------------------------------------
function getAudioFileForLanguage() {
  let lang = audioLang || localStorage.getItem('selectedLanguage') || 'ca';

  // Normalitzar possibles valors derivats de llibreries (ex: 'es-ES', 'ca_ES')
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
      file = 'assets/audio/historia_darro_cat.mp3';
      break;
  }

  console.log('[AUDIO CONTROL] Idioma de veu processat =', lang, '→ Carregant:', file);
  return file;
}

// --------------------------------------------------------------------------
// CONTROL REPRODUCTOR / PAUSA
// --------------------------------------------------------------------------
function toggleAudio() {
  // Si no s'ha creat l'àudio (o s'ha tancat per canvi de llengua), es genera al moment exacte del Play
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
    // Icones quan SONA: Volum activat i botó en estat "Pausa"
    if (globalIcon) globalIcon.textContent = 'volume_up';
    if (contextIcon) contextIcon.textContent = 'pause_circle';
  } else {
    currentAudio.pause();
    // Icones quan es PAUSA: Volum silenciat i botó en estat "Play"
    if (globalIcon) globalIcon.textContent = 'volume_off';
    if (contextIcon) contextIcon.textContent = 'play_circle';
  }
}
window.toggleAudio = toggleAudio;

// --------------------------------------------------------------------------
// SINCRO GLOBAL: S'EXECUTA EN CLICAR ELS BOTONS D'IDIOMA DE L'HTML
// --------------------------------------------------------------------------
window.changeLanguageWithAudio = async function(lang) {
  console.log(">>> [Idioma] Sol·licitat canvi a:", lang);

  // 1. Aturar i eliminar completament l'àudio vell actiu per deixar pas al nou
  if (currentAudio) {
    console.log(">>> [Audio] Aturant i alliberant l'àudio antic.");
    currentAudio.pause();
    currentAudio = null; 
  }

  // 2. Assignar de forma fulminant el nou idioma a la variable de control de veu i al magatzem
  audioLang = lang;
  localStorage.setItem('selectedLanguage', lang);

  // 3. Llançar ordres de traducció per als textos de les pantalles
  if (window.setLanguage) {
    await window.setLanguage(lang);
  }
  
  if (window.applyTranslations) {
    await window.applyTranslations();
  }

  // 4. Resetar les icones a l'estat original de repòs (Play)
  const globalIcon = document.querySelector('#globalAudioBtn .material-icons');
  const contextIcon = document.querySelector('.play-btn .material-symbols-outlined');
  if (globalIcon) globalIcon.textContent = 'volume_off';
  if (contextIcon) contextIcon.textContent = 'play_circle';

  // 5. Retornar directament a la Home (elegant i neta)
  navigateTo('home');
};

// --------------------------------------------------------------------------
// INICIALITZAR IDIOMA EN ARRENCAR O RECARREGAR L'APLICACIÓ
// --------------------------------------------------------------------------
window.initLanguage = async function() {
  const lang = localStorage.getItem('selectedLanguage') || 'ca';
  localStorage.setItem('selectedLanguage', lang);
  
  // Sincronitzar la variable de veu en encendre l'aplicació
  audioLang = lang;

  if (window.applyTranslations) {
    await window.applyTranslations();
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  console.log(">>> [Init] Idioma inicial assignat a: " + audioLang + ". L'àudio naixerà orfe fins que es premi Play.");
};

// --------------------------------------------------------------------------
// DESPLEGABLES CONTEXT HISTÒRIC
// --------------------------------------------------------------------------
function toggleContext(header) {
  const block = header.parentElement;
  block.classList.toggle("active");
}
window.toggleContext = toggleContext;