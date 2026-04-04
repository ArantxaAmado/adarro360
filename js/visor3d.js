// ==========================================================================
// MOTOR DE RENDERITZAT 3D – VISOR ADARRÓ 360
// ==========================================================================
// Implementació basada en WebGL mitjançant la biblioteca Three.js.
// Gestiona la càrrega de models comprimits, il·luminació i càmera interactiva.

import * as THREE from 'https://cdn.skypack.dev/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/DRACOLoader.js';

// Variables de l'escena (Scope del mòdul)
let scene, camera, renderer, controls, animationId;
let initialCameraPosition, initialControlsTarget;
let isDarkMode = false;

/**
 * Inicialitza l'entorn 3D i carrega el model especificat
 * @param {string} modelPath - Ruta al fitxer .glb
 */
window.initVisor3D = function (modelPath) {
    const container = document.getElementById('d-container');
    
    // Validació del cicle de vida del DOM: 
    // Ens assegurem que el contenidor té mides reals abans de calcular la càmera.
    if (!container || container.clientWidth === 0 || !modelPath) {
        console.warn("[Visor] Contenidor no llest o ruta buida");
        return;
    }

    // Neteja de renderitzats previs per evitar fugues de memòria
    container.innerHTML = ''; 
    
    // 1. CONFIGURACIÓ DE L'ESCENA
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // Color base (Mode Clar)

    // 2. CÀMERA PERSPECTIVA
    // FOV: 75º per a una visió natural. Aspect Ratio dinàmic basat en el contenidor.
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    // 3. RENDERITZADOR (WEBGL)
    // Antialias: ON per suavitzar les vores dels models arqueològics.
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Suport per a pantalles Retina/4K
    container.appendChild(renderer.domElement);

    // 4. IL·LUMINACIÓ DINÀMICA
    // AmbientLight: Il·luminació global per evitar zones completament negres.
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    // DirectionalLight: Simula la llum solar per generar relleus i volumetria (PBR).
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // 5. CONTROLS INTERACTIUS (OrbitControls)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Efecte d'inèrcia per a una navegació suau

    // 6. PIPELINE DE CÀRREGA AMB COMPRESSIÓ DRACO
    // Aquesta és l'optimització clau: permet carregar fitxers .glb comprimits.
    const dracoLoader = new DRACOLoader();
    // Fem servir el descodificador oficial de Google per garantir compatibilitat universal.
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/'); 

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    console.log("[Visor] Carregant actiu 3D:", modelPath);

    loader.load(modelPath, (gltf) => {
        scene.add(gltf.scene);
        
        // CÀLCUL DE BOUNDING BOX: 
        // Centrem el model arqueològic automàticament independentment de com estigui a Blender.
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Ajustem la posició del model al centre (0,0,0) del visor
        gltf.scene.position.sub(center);
        
        // AJUST DINÀMIC DE LA CÀMERA: 
        // Calculem la distància òptima perquè el model ocupi la pantalla correctament.
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.set(0, maxDim / 2, maxDim * 1.8);
        camera.lookAt(0, 0, 0);
        
        // Guardem l'estat inicial per a la funció de "Reset Camera"
        initialCameraPosition = camera.position.clone();
        initialControlsTarget = controls.target.clone();
        controls.update();
        
        console.log("[Visor] Èxit: Actiu renderitzat correctament");
    }, 
    undefined, 
    (error) => { 
        console.error("[Visor] Error crític en la càrrega del model:", error);
    });

    // BUCLE D'ANIMACIÓ (Render Loop)
    function animate() {
        animationId = requestAnimationFrame(animate);
        controls.update(); // Necessari per al damping (inèrcia)
        renderer.render(scene, camera);
    }
    animate();

    // Gestió d'aturada per a l'optimització de memòria des d'app.js
    window.stopVisorAnimation = () => {
        if (animationId) cancelAnimationFrame(animationId);
    };

    return { renderer };
};

/* --- API PÚBLICA DEL VISOR --- */

// Restableix la vista original de l'usuari
window.resetCamera = function () {
    if (!camera || !controls) return;
    camera.position.copy(initialCameraPosition);
    controls.target.copy(initialControlsTarget);
    controls.update();
};

// Alterna entre mode clar i mode fosc per millorar la visibilitat del model
window.toggleVisorTheme = function () {
    if (!scene) return;
    isDarkMode = !isDarkMode;
    scene.background.set(isDarkMode ? 0x111111 : 0xf0f0f0);
};