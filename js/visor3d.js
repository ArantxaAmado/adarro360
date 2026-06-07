// ==========================================================================
// VISOR 3D + RA 
// ==========================================================================

import * as THREE from 'https://cdn.skypack.dev/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/DRACOLoader.js';

// --------------------------------------------------------------------------
// VARIABLES GLOBALS
// --------------------------------------------------------------------------
let scene, camera, renderer, controls, animationId;
let initialCameraPosition, initialControlsTarget;
let isDarkMode = false;
let resizeHandler = null;

// AR
let xrSession = null;
let xrRefSpace = null;
let arModel = null;
let isARMode = false;

// ==========================================================================
// INICIALITZACIÓ DEL VISOR 3D
// ==========================================================================

window.initVisor3D = function (containerId, modelPath) {
  console.log(">>> initVisor3D() cridat amb:", containerId, modelPath);
  console.log(">>> Existeix el contenidor?", !!document.getElementById(containerId));
  console.log(">>> És explorar3d?", containerId === 'd-container-explorar');

  try {
    const container = document.getElementById(containerId);
    if (!container || !modelPath) {
      console.warn("[Visor] Falta container o modelPath:", containerId, modelPath);
      return;
    }

    let width = container.clientWidth || 300;
    let height = container.clientHeight || 300;
    console.log(`[Visor] Mides detectades pel canvas: ${width}px x ${height}px`);

    // Netejo el div per si hi hagués un canvas vell flotant.
    container.innerHTML = '';

    scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkMode ? 0x1a1a1a : 0xeeeeee);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;

    container.appendChild(renderer.domElement);
    console.log("[Visor] Canvas WebGL injectat correctament al contenidor.");

    // MODE 3D EXPLORACIÓ WEB
    if (containerId === 'd-container-explorar') {
      console.log(">>> EXCEL·LENT! ENTRO al bloc d'explorar3d");
      isARMode = false;
      renderer.xr.enabled = false;
      scene.background = new THREE.Color(0xeeeeee);

      setupNormalControls();
      loadModel(modelPath, false);
      startNormalLoop();
    }

    // MODE 3D NORMAL (ÀNFORA)
    if (containerId === 'd-container-piece') {
      console.log(">>> ENTRO al bloc de l'ànfora");
      isARMode = false;
      renderer.xr.enabled = false;
      scene.background = new THREE.Color(0xeeeeee);

      setupNormalControls();
      loadModel(modelPath, false);
      startNormalLoop();
    }

    // MODE AR
    if (containerId === 'd-container-ra') {
      console.log(">>> ENTRO al bloc de Realitat Augmentada");
      isARMode = true;
      renderer.xr.enabled = true;
      scene.background = null;

      setupARSceneLights();
      loadModel(modelPath, false);
      startNormalLoop();
    }

    resizeHandler = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!camera || !renderer || w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', resizeHandler);
    console.log("[Visor] Inicialització de la base acabada sense talls.");

  } catch (errorCrític) {
    console.error("[Visor] ERROR CRÍTIC DETECTAT DINS D'INITVISOR3D:", errorCrític);
  }
};


// ==========================================================================
// MODE 3D NORMAL
// ==========================================================================

function setupNormalControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(20, 50, 30);
  scene.add(dirLight);
}

function startNormalLoop() {
  if (animationId) cancelAnimationFrame(animationId);
  function animate() {
    animationId = requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

// ==========================================================================
// CARREGAR MODELS (3D i AR)
// ==========================================================================

function loadModel(modelPath, forAR) {
  console.log("[Visor] >>> loadModel() executant-se. Preparant carregadors...");
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();

  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(dracoLoader);

  console.log("[Visor] Llançant petició real de xarxa per:", modelPath);

  loader.load(
    modelPath,
    (gltf) => {
      console.log("[Visor] >>>ÈXIT TOTAL DE CÀRREGA GRÀFICA! Processant escena:", gltf);
      const model = gltf.scene;

      model.scale.set(1, 1, 1);

      // REVISIÓ DE MATERIALS: Forço visibilitat amb llum real
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          const mat = child.material;

          if (Array.isArray(mat)) {
            mat.forEach(m => fixMaterial(m));
          } else {
            fixMaterial(mat);
          }
        }
      });

      function fixMaterial(material) {
        if (!material) return;

        // Assegura que les textures es vegin correctament
        if (material.map) {
          material.map.encoding = THREE.sRGBEncoding;
        }
        if (material.emissiveMap) {
          material.emissiveMap.encoding = THREE.sRGBEncoding;
        }
        if (material.roughnessMap) {
          material.roughnessMap.encoding = THREE.sRGBEncoding;
        }
        if (material.metalnessMap) {
          material.metalnessMap.encoding = THREE.sRGBEncoding;
        }
        if (material.normalMap) {
          material.normalMap.encoding = THREE.LinearEncoding;
        }

        // Evita materials invisibles
        material.transparent = false;
        material.opacity = 1;
        material.side = THREE.DoubleSide;

        material.needsUpdate = true;
      }


      if (forAR) {
        arModel = model;
        arModel.visible = true;
        arModel.position.set(0, 0, -2);
        scene.add(arModel);
        return;
      }

      scene.add(model);

      // CONFIGURACIÓ DE LLUMS EN VOLTOR (Bany total en 360 graus)
      // Llum ambient massiva perquè cap racó quedi a fosques
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      // Llum zenital (des del cel cap a terra)
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
      hemiLight.position.set(0, 200, 0);
      scene.add(hemiLight);

      // Llums direccionals creuades per generar relleus i ombres tridimensionals reals
      const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.3);
      dirLight1.position.set(100, 150, 50);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
      dirLight2.position.set(-100, 150, -50);
      scene.add(dirLight2);

      // 1) Mesures i centrat de la vil·la (Ja confirmat que mesura ~47m)
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      console.log(`[Visor] Mides definitives -> X: ${size.x.toFixed(2)}, Y: ${size.y.toFixed(2)}, Z: ${size.z.toFixed(2)}`);

      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= (center.y - size.y / 2); // Deixa la base al punt zero de la pantalla

      // 2) Ajust de la càmera proporcional (Distància ideal per a veure els 47m sencers)
      const maxDim = Math.max(size.x, size.y, size.z);
      const dist = maxDim * 1.8; // Una mica més a prop que abans perquè es vegi més gran des del primer segon

      camera.position.set(dist, dist * 0.7, dist);
      camera.lookAt(0, 0, 0);

      initialCameraPosition = camera.position.clone();
      initialControlsTarget = new THREE.Vector3(0, 0, 0);

      if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
      }

      console.log("[Visor] Procés finalitzat. Model llest i il·luminat.");
    },
    (xhr) => {
      if (xhr.total) {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        console.log(`[Visor] Descarregant binari .glb: ${percent}%`);
      }
    },
    (error) => {
      console.error("[Visor] Error carregant GLB des de la xarxa:", error);
    }
  );
}


// ==========================================================================
// MODE AR – CONFIGURACIÓ
// ==========================================================================

function setupARSceneLights() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));
}

// ==========================================================================
// INICIAR SESSIÓ AR (AR immediata)
// ==========================================================================

window.startARSession = async function () {
  console.log("[AR] Iniciant sessió AR…");

  if (!navigator.xr) {
    alert('Aquest dispositiu/navegador no suporta WebXR.');
    return;
  }

  try {
    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    if (!supported) {
      alert('La RA no està disponible en aquest dispositiu.');
      return;
    }

    xrSession = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['local-floor']
    });

    renderer.xr.setSession(xrSession);

    xrRefSpace = await xrSession.requestReferenceSpace('local-floor');

    // Carreguem la vila en mode AR immediat
    loadModel('assets/models/villa_darro.glb', true);

    renderer.setAnimationLoop(renderAR);

  } catch (err) {
    console.error('Error iniciant sessió AR:', err);
    alert('No s’ha pogut iniciar la RA.');
  }
};

// ==========================================================================
// RENDER LOOP AR
// ==========================================================================

function renderAR(timestamp, frame) {
  renderer.render(scene, camera);
}

// ==========================================================================
// FUNCIONS EXTRA
// ==========================================================================

window.toggleVisorTheme = function () {
  isDarkMode = !isDarkMode;
  if (scene && !isARMode) {
    scene.background = new THREE.Color(isDarkMode ? 0x1a1a1a : 0xeeeeee);
  }
};

window.resetCamera3D = function () {
  if (!camera || !controls || !initialCameraPosition || !initialControlsTarget) return;
  camera.position.copy(initialCameraPosition);
  controls.target.copy(initialControlsTarget);
  controls.update();
};

// ==========================================================================
// NETEJA DEL VISOR
// ==========================================================================

window.disposeVisor3D = function () {
  if (animationId) cancelAnimationFrame(animationId);

  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }

  if (xrSession) {
    xrSession.end();
    xrSession = null;
  }

  if (renderer) {
    renderer.dispose();
    renderer.domElement?.remove();
  }

  if (scene) {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
  }

  renderer = null;
  scene = null;
  camera = null;
  controls = null;
  arModel = null;
  isARMode = false;
};