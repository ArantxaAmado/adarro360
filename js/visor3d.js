// =====================================================
// IMPORTACIONS DES DE CDN (Evitem problemes de fitxers locals)
// =====================================================
import * as THREE from 'https://cdn.skypack.dev/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/DRACOLoader.js';

let scene, camera, renderer, controls, animationId;
let initialCameraPosition, initialControlsTarget;
let isDarkMode = false;

window.initVisor3D = function (modelPath) {
    const container = document.getElementById('d-container');
    
    // Validació de seguretat
    if (!container || container.clientWidth === 0 || !modelPath) {
        console.warn("Contenidor no llest o ruta buida");
        return;
    }

    container.innerHTML = ''; 
    
    // --- ESCENA ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // --- CÀMERA ---
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    // --- RENDERER ---
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- LLUMS ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // --- CONTROLS ---
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // --- CONFIGURACIÓ DRACO ---
    const dracoLoader = new DRACOLoader();
    // Fem servir el descodificador oficial de Google per evitar errors de 404 locals
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/'); 

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    console.log("Intentant carregar model:", modelPath);

    loader.load(modelPath, (gltf) => {
        scene.add(gltf.scene);
        
        // Centrar el model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        gltf.scene.position.sub(center);
        
        // Ajustar càmera
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.set(0, maxDim / 2, maxDim * 1.8);
        camera.lookAt(0, 0, 0);
        
        initialCameraPosition = camera.position.clone();
        initialControlsTarget = controls.target.clone();
        controls.update();
        
        console.log("ÈXIT: Model carregat correctament");
    }, 
    undefined, 
    (error) => { 
        console.error("ERROR de càrrega:", error);
    });

    function animate() {
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.stopVisorAnimation = () => {
        if (animationId) cancelAnimationFrame(animationId);
    };

    return { renderer };
};

// Funcions globals que l'app.js necessita
window.resetCamera = function () {
    if (!camera || !controls) return;
    camera.position.copy(initialCameraPosition);
    controls.target.copy(initialControlsTarget);
    controls.update();
};

window.toggleVisorTheme = function () {
    if (!scene) return;
    isDarkMode = !isDarkMode;
    scene.background.set(isDarkMode ? 0x111111 : 0xf0f0f0);
};