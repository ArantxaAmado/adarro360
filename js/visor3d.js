// ==========================================================================
// MOTOR DE RENDERITZAT 3D – VISOR ADARRÓ 360 (VERSIÓ FINAL CORREGIDA)
// ==========================================================================

import * as THREE from 'https://cdn.skypack.dev/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/DRACOLoader.js';

let scene, camera, renderer, controls, animationId;
let initialCameraPosition, initialControlsTarget;
let isDarkMode = false;

/**
 * Inicialitza l'entorn 3D i carrega el model
 */
window.initVisor3D = function (modelPath) {
    const container = document.getElementById('d-container');
    
    // 1. ELIMINEM EL BUCLE: Si no hi ha contenidor, sortim. 
    // La gestió del reintent es fa des d'app.js amb un sol delay.
    if (!container || container.clientWidth === 0) {
        console.warn("[Visor] Contenidor no preparat. Avortant per evitar bucle.");
        return;
    }

    // Neteja previa si ja existia una instància activa
    if (renderer) window.disposeVisor3D();

    // 2. ESCENA
    scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkMode ? 0x1a1a1a : 0xeeeeee);

    // 3. CÀMERA (Rang ampli per a la Vil·la)
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 10000);

    // 4. RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    // CRÍTIC CONTRA SCROLL: display block elimina l'espai buit inferior del canvas
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    
    container.appendChild(renderer.domElement);

    // 5. CONTROLS
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 6. LLUMS (Augmentem intensitat perquè la vil·la es vegi bé)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 50, 30);
    scene.add(dirLight);

    // 7. CARREGA DEL MODEL
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(dracoLoader);

    console.log("[Visor] Intentant carregar:", modelPath);

    loader.load(modelPath, (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Centrat automàtic del model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center); 

        const maxDim = Math.max(size.x, size.y, size.z);
        
        // POSICIÓ CÀMERA: Multiplicador 2.5 per a la vil·la (model gran)
        const camDistFactor = modelPath.includes('villa') ? 2.5 : 1.5;
        
        camera.position.set(maxDim * camDistFactor, maxDim * 1.2, maxDim * camDistFactor);
        camera.lookAt(0, 0, 0);
        
        initialCameraPosition = camera.position.clone();
        initialControlsTarget = new THREE.Vector3(0, 0, 0);
        
        controls.target.set(0, 0, 0);
        controls.update();
        
        console.log("[Visor] " + modelPath + " carregat.");
        animate(); // Iniciem l'animació només quan el model és a dins
    }, undefined, (error) => {
        console.error("[Visor] Error carregant GLB:", error);
    });

    function animate() {
        animationId = requestAnimationFrame(animate);
        if (controls) controls.update();
        renderer.render(scene, camera);
    }

    return { renderer };
};

/* --- API DE CONTROL GLOBAL --- */

window.toggleVisorTheme = function () {
    isDarkMode = !isDarkMode;
    if (scene) {
        scene.background = new THREE.Color(isDarkMode ? 0x1a1a1a : 0xeeeeee);
    }
};

window.resetCamera3D = function () {
    if (!camera || !controls) return;
    camera.position.copy(initialCameraPosition);
    controls.target.copy(initialControlsTarget);
    controls.update();
};

window.disposeVisor3D = function () {
    console.log("[Visor] Netejant escena anterior...");
    if (animationId) cancelAnimationFrame(animationId);
    
    if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
    }

    if (scene) {
        scene.traverse((object) => {
            if (object.isMesh) {
                object.geometry.dispose();
                if (object.material.isMaterial) {
                    object.material.dispose();
                }
            }
        });
    }

    renderer = null;
    scene = null;
    camera = null;
    controls = null;
};