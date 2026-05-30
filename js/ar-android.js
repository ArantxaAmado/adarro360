// ==========================================================================
// AR-ANDROID.JS – ADARRÓ 360 (MODERN WEBXR EARTH REF SPACE)
// Mode AR geolocalitzat per Android + Chrome
// ==========================================================================
import * as THREE from 'https://cdn.skypack.dev/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

console.log("[AR] ar-android.js carregat com a mòdul modern");

/* ============================================================
   COORDENADES DELS DOS POI (JACIMENT D'ADARRÓ)
   ============================================================ */
const ENTRY_LAT = 41.212214;
const ENTRY_LON = 1.714533;
const ENTRY_ALT = 0;

const OCTA_LAT = 41.212436;
const OCTA_LON = 1.714681;
const OCTA_ALT = 0;

/* ============================================================
   CAMÍ DEL MODEL 3D
   ============================================================ */
const MODEL_PATH = "assets/models/villa_darro.glb";

/* ============================================================
   VARIABLES GLOBALS DE SESSIÓ
   ============================================================ */
let xrSession = null;
let xrRefSpace = null;
let renderer = null;
let scene = null;
let camera = null;
let model = null;

let entryAnchorSpace = null;
let octaAnchorSpace = null;

/* ============================================================
   Funció global cridada des de ar-detect.js
   ============================================================ */
window.startARSessionAndroid = async function () {
    console.log("[AR] Sol·licitant sessió AR moderna amb referència espacial terrestre...");

    if (!navigator.xr) {
        alert("Aquest dispositiu no suporta l'estàndard WebXR.");
        return;
    }

    try {
        xrSession = await navigator.xr.requestSession("immersive-ar", {
            requiredFeatures: ["local", "anchors"],
            optionalFeatures: ["local-floor"]
        });

        setupThreeJS();
        setupXRSession();
    } catch (err) {
        console.error("[AR] Error crític en iniciar la sessió WebXR:", err);
        alert("No s'ha pogut llançar l'experiència XR. Assegura't de donar permisos de càmera.");
    }
};

/* ============================================================
   Configuració de Three.js i llums de l'entorn
   ============================================================ */
function setupThreeJS() {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.xr.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 25, 10);
    scene.add(dirLight);

    camera = new THREE.PerspectiveCamera();
}

/* ============================================================
   Gestió i escolta del cicle de vida XR
   ============================================================ */
async function setupXRSession() {
    xrSession.addEventListener("end", () => {
        console.log("[AR] Cicle de vida WebXR finalitzat. Netejant instàncies...");
        
        if (renderer) {
            renderer.setAnimationLoop(null);
            if (renderer.domElement) renderer.domElement.remove();
            renderer.dispose();
            renderer = null;
        }

        xrSession = null;
        xrRefSpace = null;
        entryAnchorSpace = null;
        octaAnchorSpace = null;
        scene = null;
        camera = null;
        model = null;

        if (window.navigateTo) window.navigateTo('home');
    });

    renderer.xr.setSession(xrSession);
    xrRefSpace = await xrSession.requestReferenceSpace("local");
    renderer.setAnimationLoop(onXRFrame);

    createGeoAnchorsWithEarthSpace();
    loadModel();
}

/* ============================================================
   Creació d'espais d'ancoratge amb l'API Earth Space
   ============================================================ */
async function createGeoAnchorsWithEarthSpace() {
    try {
        const earthSpace = await xrSession.requestReferenceSpace("earth");

        const entryAnchor = await earthSpace.createAnchor({
            latitude: ENTRY_LAT,
            longitude: ENTRY_LON,
            altitude: ENTRY_ALT
        });
        entryAnchorSpace = entryAnchor.anchorSpace;

        const octaAnchor = await earthSpace.createAnchor({
            latitude: OCTA_LAT,
            longitude: OCTA_LON,
            altitude: OCTA_ALT
        });
        octaAnchorSpace = octaAnchor.anchorSpace;
        console.log("[AR] Anchors geolocalitzats fixats mitjançant Earth Space de manera exitosa.");
    } catch (err) {
        console.error("[AR] L'espai 'earth' o la creació d'anchors ha fallat:", err);
    }
}

/* ============================================================
   Càrrega asíncrona del model GLB comprimit de la vila
   ============================================================ */
function loadModel() {
    const loader = new GLTFLoader();
    loader.load(MODEL_PATH, (gltf) => {
        model = gltf.scene;
        model.scale.set(1, 1, 1);
        model.visible = false; 
        scene.add(model);
        console.log("[AR] Model GLB de la vila carregat.");
    }, undefined, (err) => console.error("[AR] Error carregant GLB:", err));
}

/* ============================================================
   Bucle d'actualització de fotogrames i poses (Render Loop)
   ============================================================ */
function onXRFrame(t, frame) {
    if (!xrSession || !model) return;

    let pose = null;
    if (octaAnchorSpace) pose = frame.getPose(octaAnchorSpace, xrRefSpace);
    if (!pose && entryAnchorSpace) pose = frame.getPose(entryAnchorSpace, xrRefSpace);

    if (pose) {
        const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
        model.position.setFromMatrixPosition(matrix);
        model.quaternion.setFromRotationMatrix(matrix);
        model.matrixAutoUpdate = true;

        if (!model.visible) {
            model.visible = true;
            console.log("[AR] Vila visible sota coordenades GPS estabilitzades.");
        }
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}