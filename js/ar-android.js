/* ============================================================
   AR-ANDROID.JS
   Mode AR geolocalitzat per Android + Chrome (WebXR + GeoAnchors)
   ============================================================ */

console.log("[AR] ar-android.js carregat");

/* ============================================================
   COORDENADES DELS DOS POI
   ============================================================ */

// POI 1 — Entrada del jaciment
const ENTRY_LAT = 41.212214;
const ENTRY_LON = 1.714533;
const ENTRY_ALT = 0;

// POI 2 — Octaedre (sala de la vila)
const OCTA_LAT = 41.212436;
const OCTA_LON = 1.714681;
const OCTA_ALT = 0;

/* ============================================================
   MODEL ÚNIC DE LA VILA
   ============================================================ */

const MODEL_PATH = "assets/models/villa.darro.glb";

/* ============================================================
   VARIABLES GLOBALS
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
   Funció cridada des de ar-detect.js
   ============================================================ */
window.startGeoAR = async function () {
    console.log("[AR] Iniciant AR geolocalitzat a Android");

    if (!navigator.xr) {
        alert("Aquest dispositiu no suporta WebXR.");
        return;
    }

    try {
        xrSession = await navigator.xr.requestSession("immersive-ar", {
            requiredFeatures: ["local", "hit-test", "anchors", "geo-tracking"]
        });

        setupThreeJS();
        setupXRSession();
    } catch (err) {
        console.error("[AR] Error iniciant AR:", err);
        alert("No s'ha pogut iniciar la realitat augmentada.");
    }
};

/* ============================================================
   Configuració Three.js
   ============================================================ */
function setupThreeJS() {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.xr.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
}

/* ============================================================
   Configuració XR
   ============================================================ */
async function setupXRSession() {
    xrSession.addEventListener("end", () => {
        console.log("[AR] Sessió AR finalitzada");
        if (renderer && renderer.domElement) {
            renderer.domElement.remove();
        }
    });

    renderer.xr.setSession(xrSession);

    xrRefSpace = await xrSession.requestReferenceSpace("local");

    xrSession.requestAnimationFrame(onXRFrame);

    // Crear els dos GeoAnchors
    createGeoAnchors();

    // Carregar el model únic
    loadModel();
}

/* ============================================================
   Crear DOS GeoAnchors
   ============================================================ */
async function createGeoAnchors() {
    try {
        // Anchor 1 — Entrada
        const entryAnchor = await xrSession.requestGeoAnchor({
            latitude: ENTRY_LAT,
            longitude: ENTRY_LON,
            altitude: ENTRY_ALT
        });

        entryAnchorSpace = entryAnchor.anchorSpace;
        console.log("[AR] Anchor ENTRADA creat");

        // Anchor 2 — Octaedre
        const octaAnchor = await xrSession.requestGeoAnchor({
            latitude: OCTA_LAT,
            longitude: OCTA_LON,
            altitude: OCTA_ALT
        });

        octaAnchorSpace = octaAnchor.anchorSpace;
        console.log("[AR] Anchor OCTAEDRE creat");

    } catch (err) {
        console.error("[AR] Error creant GeoAnchors:", err);
    }
}

/* ============================================================
   Carregar model GLB (només un cop)
   ============================================================ */
function loadModel() {
    const loader = new THREE.GLTFLoader();

    loader.load(
        MODEL_PATH,
        (gltf) => {
            model = gltf.scene;
            model.scale.set(1, 1, 1);
            model.visible = false; // només visible quan hi ha pose
            scene.add(model);
        },
        undefined,
        (err) => console.error("[AR] Error carregant model:", err)
    );
}

/* ============================================================
   Render loop
   ============================================================ */
function onXRFrame(t, frame) {
    xrSession.requestAnimationFrame(onXRFrame);

    if (!model) return;

    let pose = null;

    // Prioritat: si estem a prop del POI 2 (octaedre), utilitza aquest
    if (octaAnchorSpace) {
        pose = frame.getPose(octaAnchorSpace, xrRefSpace);
    }

    // Si no hi ha pose, prova el POI 1 (entrada)
    if (!pose && entryAnchorSpace) {
        pose = frame.getPose(entryAnchorSpace, xrRefSpace);
    }

    // Si hi ha pose, posiciona el model
    if (pose) {
        const m = new THREE.Matrix4().fromArray(pose.transform.matrix);
        model.matrix = m;
        model.matrixAutoUpdate = false;
        model.visible = true;
    }

    renderer.render(scene, camera);
}
