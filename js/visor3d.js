// ==========================================================================
// VISOR 3D + RA – VERSIÓ ESTABLE
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
let hitTestSource = null;
let reticle = null;
let arModel = null;
let isARMode = false;

// ==========================================================================
// INICIALITZACIÓ DEL VISOR 3D
// ==========================================================================

window.initVisor3D = function (containerId, modelPath) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Fallback de mida per evitar 0×0
  let width = container.clientWidth;
  let height = container.clientHeight;

  if (width === 0 || height === 0) {
    width = 300;
    height = 300;
    console.warn('[Visor] Contenidor sense mida, inicialitzant amb 300x300 i confiant en el resize.');
  }

  // Si ja hi havia un visor → neteja
  if (renderer) window.disposeVisor3D();

  // Escena i renderer
  scene = new THREE.Scene();
  scene.background = new THREE.Color(isDarkMode ? 0x1a1a1a : 0xeeeeee);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding;

  container.appendChild(renderer.domElement);

  // MODE 3D NORMAL (ÀNFORA)
  if (containerId === 'd-container-piece') {
    isARMode = false;
    setupNormalControls();
    loadModel(modelPath, false);
    startNormalLoop();
  }

  // MODE AR (JACIMENT)
  if (containerId === 'd-container-ra') {
    isARMode = true;
    renderer.xr.enabled = true;

    setupARSceneLights();
    setupReticle();
    // El model AR es carrega DESPRÉS d'iniciar la sessió AR
  }

  // Resize
  resizeHandler = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!camera || !renderer || w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', resizeHandler);
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
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;

      // 🔥 Escala base per evitar bounding box = 0
      model.scale.set(1, 1, 1);

      if (forAR) {
        arModel = model;
        arModel.visible = false;
        scene.add(arModel);
        return;
      }

      scene.add(model);

      // Bounding box
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // 🔥 Si el model és massa petit → escala-lo
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim < 0.1) {
        model.scale.set(10, 10, 10);
      }

      // Recalcular bounding box després d'escalar
      const box2 = new THREE.Box3().setFromObject(model);
      const center2 = box2.getCenter(new THREE.Vector3());
      const size2 = box2.getSize(new THREE.Vector3());
      const maxDim2 = Math.max(size2.x, size2.y, size2.z);

      model.position.sub(center2);

      const camDistFactor = modelPath.includes('villa') ? 2.5 : 1.5;

      camera.position.set(
        maxDim2 * camDistFactor,
        maxDim2 * 1.2,
        maxDim2 * camDistFactor
      );

      camera.lookAt(0, 0, 0);

      initialCameraPosition = camera.position.clone();
      initialControlsTarget = new THREE.Vector3(0, 0, 0);

      controls.target.set(0, 0, 0);
      controls.update();
    },
    undefined,
    (error) => {
      console.error("[Visor] Error carregant GLB:", error);
    }
  );
}



// ==========================================================================
// MODE AR – CONFIGURACIÓ
// ==========================================================================

function setupARSceneLights() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));
}

function setupReticle() {
  const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    opacity: 0.6,
    transparent: true
  });

  reticle = new THREE.Mesh(geometry, material);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
}

// ==========================================================================
// INICIAR SESSIÓ AR
// ==========================================================================

window.startARSession = async function () {
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
      requiredFeatures: ['hit-test', 'local-floor']
    });

    renderer.xr.setSession(xrSession);

    xrRefSpace = await xrSession.requestReferenceSpace('local-floor');

    const viewerSpace = await xrSession.requestReferenceSpace('viewer');
    hitTestSource = await xrSession.requestHitTestSource({ space: viewerSpace });

    loadModel('assets/models/villa_darro.glb', true);

    xrSession.addEventListener('select', () => {
      if (reticle.visible && arModel) {
        arModel.position.setFromMatrixPosition(reticle.matrix);
        arModel.visible = true;
      }
    });

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
  if (!frame || !xrRefSpace || !hitTestSource) {
    renderer.render(scene, camera);
    return;
  }

  const hitTestResults = frame.getHitTestResults(hitTestSource);

  if (hitTestResults.length > 0) {
    const hit = hitTestResults[0];
    const pose = hit.getPose(xrRefSpace);

    if (pose && reticle) {
      reticle.visible = true;
      reticle.matrix.fromArray(pose.transform.matrix);
    }
  } else if (reticle) {
    reticle.visible = false;
  }

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
  reticle = null;
  isARMode = false;
};
