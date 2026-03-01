/* ═══════════════════════════════════════════════════════════════
   MASHIUR RAHMAN TONMOY — 3D PORTFOLIO
   script.js — Three.js Scene + Full Interactivity
   Author: Mashiur Rahman Tonmoy
   Company: Neuroculas
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ═══════════════════════════════
// CONFIGURATION
// ═══════════════════════════════

const CFG = {
    roadStart:     12,     // Camera initial Z
    roadEnd:      -108,    // Road end Z
    maxScroll:     110,    // Max scroll units
    camHeight:     3.8,    // Camera Y position
    lerpSpeed:     0.065,  // Camera lerp speed (smoothness)
};

// House definitions: position, colour, section
const HOUSES = [
    {
        name: 'About Me',   section: 'about',
        x: -10, z: -22,     rotY: -0.28,
        color:   0x1e3a8a,  accent: 0x3b82f6,
        emissive: 0x0a1640, roofColor: 0x172a6e,
        label: '🏠 ABOUT ME'
    },
    {
        name: 'Skills',     section: 'skills',
        x:  10, z: -44,     rotY:  0.28,
        color:   0x0c4a6e,  accent: 0x0ea5e9,
        emissive: 0x041828, roofColor: 0x083350,
        label: '⚡ SKILLS'
    },
    {
        name: 'Projects',   section: 'projects',
        x: -10, z: -66,     rotY: -0.28,
        color:   0x3b1a78,  accent: 0x8b5cf6,
        emissive: 0x180a36, roofColor: 0x2e1460,
        label: '🚀 PROJECTS'
    },
    {
        name: 'AI Services',section: 'services',
        x:  10, z: -88,     rotY:  0.28,
        color:   0x0d3d22,  accent: 0x22c55e,
        emissive: 0x051a0e, roofColor: 0x092d18,
        label: '🤖 AI SERVICES'
    },
    {
        name: 'Contact',    section: 'contact',
        x: -10, z: -105,    rotY: -0.28,
        color:   0x6b2504,  accent: 0xf59e0b,
        emissive: 0x300f01, roofColor: 0x561e04,
        label: '📬 CONTACT'
    },
];

// ═══════════════════════════════
// SCENE SETUP
// ═══════════════════════════════

const container = document.getElementById('canvas-container');

/* Renderer */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
container.appendChild(renderer.domElement);

/* Scene */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x04040f, 0.006);

/* Camera */
const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, CFG.camHeight, CFG.roadStart);

/* Clock */
const clock = new THREE.Clock();

// ═══════════════════════════════
// CAMERA STATE (smooth controller)
// ═══════════════════════════════

const CAM = {
    pos:    new THREE.Vector3(0, CFG.camHeight, CFG.roadStart),
    look:   new THREE.Vector3(0, 2.5, CFG.roadStart - 18),
    tPos:   new THREE.Vector3(0, CFG.camHeight, CFG.roadStart),
    tLook:  new THREE.Vector3(0, 2.5, CFG.roadStart - 18),
    scroll: 0,
    zoomed: false,

    tick() {
        if (!this.zoomed) {
            const z = CFG.roadStart - this.scroll;
            this.tPos.set(0, CFG.camHeight, z);
            this.tLook.set(0, 2.5, z - 18);
        }
        this.pos.lerp(this.tPos, CFG.lerpSpeed);
        this.look.lerp(this.tLook, CFG.lerpSpeed);
        camera.position.copy(this.pos);
        camera.lookAt(this.look);
    },

    zoomTo(idx) {
        const h = HOUSES[idx];
        const isLeft = h.x < 0;
        this.zoomed = true;
        this.tPos.set(isLeft ? h.x + 7 : h.x - 7, 3.8, h.z + 8);
        this.tLook.set(h.x, 3, h.z);
    },

    reset() {
        this.zoomed = false;
        const z = CFG.roadStart - this.scroll;
        this.tPos.set(0, CFG.camHeight, z);
        this.tLook.set(0, 2.5, z - 18);
    }
};

// ═══════════════════════════════
// COLLECTIONS
// ═══════════════════════════════

const clickables  = [];   // Meshes that can be clicked
const houseGroups = [];   // House Group objects
const houseBodies = [];   // House body meshes (for hover glow)
const houseLights = [];   // House point lights
const clouds      = [];   // Cloud groups
const treeGroups  = [];   // Tree groups for subtle animation
let   particles   = null; // Particle system

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2(-9999, -9999);
let   hovered   = null;   // Currently hovered mesh

// ═══════════════════════════════
// LIGHTING
// ═══════════════════════════════

function setupLighting() {
    // Ambient fill
    const ambient = new THREE.AmbientLight(0x1a1a3a, 0.7);
    scene.add(ambient);

    // Main directional light (moon-like)
    const moon = new THREE.DirectionalLight(0xc8d8ff, 0.9);
    moon.position.set(25, 40, 20);
    moon.castShadow = true;
    moon.shadow.mapSize.width  = 2048;
    moon.shadow.mapSize.height = 2048;
    moon.shadow.camera.far  = 250;
    moon.shadow.camera.left = moon.shadow.camera.bottom = -80;
    moon.shadow.camera.right = moon.shadow.camera.top   =  80;
    moon.shadow.bias = -0.001;
    scene.add(moon);

    // Hemisphere (sky/ground colour bounce)
    const hemi = new THREE.HemisphereLight(0x2a3580, 0x0a1020, 0.5);
    scene.add(hemi);

    // Road glow — purple-tinted fill from below
    const roadGlow = new THREE.PointLight(0x4433aa, 2, 60);
    roadGlow.position.set(0, 0.5, -30);
    scene.add(roadGlow);
}

// ═══════════════════════════════
// SKY (gradient shader sphere)
// ═══════════════════════════════

function createSky() {
    const geo = new THREE.SphereGeometry(380, 32, 16);
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uTop:    { value: new THREE.Color(0x010108) },
            uMiddle: { value: new THREE.Color(0x0d0a2a) },
            uHorizon:{ value: new THREE.Color(0x1a0a2e) },
        },
        vertexShader: `
            varying vec3 vPos;
            void main() {
                vPos = normalize(position);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uTop;
            uniform vec3 uMiddle;
            uniform vec3 uHorizon;
            varying vec3 vPos;
            void main() {
                float h = vPos.y;
                vec3 col;
                if (h > 0.15) {
                    col = mix(uMiddle, uTop, smoothstep(0.15, 0.7, h));
                } else {
                    col = mix(uHorizon, uMiddle, smoothstep(-0.1, 0.15, h));
                }
                gl_FragColor = vec4(col, 1.0);
            }
        `,
        side: THREE.BackSide,
        depthWrite: false,
    });
    scene.add(new THREE.Mesh(geo, mat));
}

// ═══════════════════════════════
// ROAD & GROUND
// ═══════════════════════════════

function createRoad() {
    const grp = new THREE.Group();

    /* Wide ground */
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x060610 });
    const ground    = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.02, -50);
    ground.receiveShadow = true;
    grp.add(ground);

    /* Sidewalks */
    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x0c0c1e });
    [-8, 8].forEach(sx => {
        const sw = new THREE.Mesh(new THREE.PlaneGeometry(4, 160), sidewalkMat);
        sw.rotation.x = -Math.PI / 2;
        sw.position.set(sx < 0 ? -10 : 10, 0, -50);
        sw.receiveShadow = true;
        grp.add(sw);
    });

    /* Main road surface */
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x0f0f20 });
    const road    = new THREE.Mesh(new THREE.PlaneGeometry(15, 160), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.005, -50);
    road.receiveShadow = true;
    grp.add(road);

    /* Road center yellow dashes */
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    for (let z = CFG.roadStart; z > CFG.roadEnd - 10; z -= 7) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 3.5), dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(0, 0.015, z);
        grp.add(dash);
    }

    /* Edge white lines */
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    for (let side of [-6.8, 6.8]) {
        for (let z = CFG.roadStart; z > CFG.roadEnd - 10; z -= 5) {
            const seg = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 2), edgeMat.clone());
            seg.rotation.x = -Math.PI / 2;
            seg.position.set(side, 0.015, z);
            grp.add(seg);
        }
    }

    /* Glowing centre strip (subtle neon line) */
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x3a1aff, transparent: true, opacity: 0.25 });
    const glowLine = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 160), glowMat);
    glowLine.rotation.x = -Math.PI / 2;
    glowLine.position.set(0, 0.02, -50);
    grp.add(glowLine);

    scene.add(grp);
}

// ═══════════════════════════════
// HOUSE CREATION
// ═══════════════════════════════

function createHouse(i) {
    const d   = HOUSES[i];
    const grp = new THREE.Group();

    /* ─ Foundation step ─ */
    const foundMat = new THREE.MeshLambertMaterial({ color: 0x0d0d22 });
    const found    = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.38, 5.8), foundMat);
    found.position.y = 0.19;
    found.castShadow  = true;
    found.receiveShadow = true;
    grp.add(found);

    /* ─ Main body ─ */
    const bodyMat = new THREE.MeshPhongMaterial({
        color:    d.color,
        emissive: new THREE.Color(d.emissive),
        emissiveIntensity: 0.35,
        shininess: 15,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(6.8, 4.8, 5.2), bodyMat);
    body.position.y = 2.78;
    body.castShadow   = true;
    body.receiveShadow = true;
    // Attach metadata for click detection
    body.userData = { isHouse: true, idx: i, section: d.section, name: d.name, mat: bodyMat };
    grp.add(body);
    clickables.push(body);
    houseBodies.push(body);

    /* ─ Roof (4-sided cone) ─ */
    const roofMat = new THREE.MeshPhongMaterial({ color: d.roofColor, shininess: 5 });
    const roof    = new THREE.Mesh(new THREE.ConeGeometry(5.4, 2.8, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 7.0;
    roof.castShadow  = true;
    grp.add(roof);

    /* ─ Chimney ─ */
    const chimneyMat = new THREE.MeshLambertMaterial({ color: d.roofColor });
    const chimney    = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), chimneyMat);
    chimney.position.set(1.5, 8.1, -0.8);
    chimney.castShadow = true;
    grp.add(chimney);

    /* ─ Front decorative panel (holographic screen effect) ─ */
    const screenMat = new THREE.MeshBasicMaterial({
        color:   new THREE.Color(d.accent),
        transparent: true, opacity: 0.07,
        side: THREE.FrontSide
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.6), screenMat);
    screen.position.set(0, 2.9, 2.62);
    grp.add(screen);

    /* ─ Screen border glow lines ─ */
    const borderMat = new THREE.MeshBasicMaterial({ color: d.accent, transparent: true, opacity: 0.5 });
    // Top bar
    const topBar = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.06), borderMat);
    topBar.position.set(0, 4.7, 2.62);
    grp.add(topBar);
    // Bottom bar
    const botBar = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.06), borderMat.clone());
    botBar.position.set(0, 1.1, 2.62);
    grp.add(botBar);

    /* ─ Windows (2 on front) ─ */
    const winMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(d.accent), transparent: true, opacity: 0.9
    });
    [[-1.9, 3.2], [1.9, 3.2]].forEach(([wx, wy]) => {
        const win  = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.15, 0.08), winMat.clone());
        win.position.set(wx, wy, 2.62);
        grp.add(win);
        // Window cross divider
        const hBar = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.05), new THREE.MeshBasicMaterial({ color: 0x111122 }));
        hBar.position.set(wx, wy, 2.64);
        grp.add(hBar);
        const vBar = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1.15), new THREE.MeshBasicMaterial({ color: 0x111122 }));
        vBar.position.set(wx, wy, 2.64);
        grp.add(vBar);
    });

    /* ─ Side windows ─ */
    const sideWinMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(d.accent), transparent: true, opacity: 0.5 });
    [2.62, -2.62].forEach(sx => {
        const sw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 1.3), sideWinMat.clone());
        sw.position.set(sx < 0 ? -3.44 : 3.44, 3.2, 0);
        grp.add(sw);
    });

    /* ─ Door ─ */
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x080818 });
    const door    = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.1, 0.09), doorMat);
    door.position.set(0, 1.43, 2.62);
    grp.add(door);
    // Door knob
    const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 7, 7),
        new THREE.MeshBasicMaterial({ color: d.accent })
    );
    knob.position.set(0.38, 1.45, 2.72);
    grp.add(knob);

    /* ─ Steps in front of door ─ */
    const stepMat = new THREE.MeshLambertMaterial({ color: 0x0a0a1a });
    [{ h: 0.12, d: 0.35, y: 0.06, z: 2.79 }, { h: 0.08, d: 0.6, y: 0.04, z: 3.0 }].forEach(s => {
        const step = new THREE.Mesh(new THREE.BoxGeometry(1.6, s.h, s.d), stepMat.clone());
        step.position.set(0, s.y, s.z);
        grp.add(step);
    });

    /* ─ Point light from windows (glow) ─ */
    const pLight = new THREE.PointLight(new THREE.Color(d.accent), 2.2, 14);
    pLight.position.set(0, 3.5, 4.0);
    grp.add(pLight);
    houseLights.push(pLight);

    /* ─ Place in world ─ */
    grp.position.set(d.x, 0, d.z);
    grp.rotation.y = d.rotY;

    scene.add(grp);
    houseGroups.push(grp);
    return grp;
}

// ═══════════════════════════════
// TREE
// ═══════════════════════════════

function createTree(x, z, scale = 1.0) {
    const grp = new THREE.Group();

    const trunkMat  = new THREE.MeshLambertMaterial({ color: 0x3d2008 });
    const trunk     = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.28 * scale, 2.2 * scale, 7), trunkMat);
    trunk.position.y = 1.1 * scale;
    trunk.castShadow  = true;
    grp.add(trunk);

    const leafColors = [0x1a5c28, 0x1e7230, 0x256a2a, 0x184d20];
    const layers = [
        { r: 1.6 * scale, h: 2.0 * scale, y: 2.6 * scale, sides: 8 },
        { r: 1.2 * scale, h: 1.8 * scale, y: 3.8 * scale, sides: 7 },
        { r: 0.8 * scale, h: 1.5 * scale, y: 4.8 * scale, sides: 6 },
    ];

    layers.forEach((l, li) => {
        const mat  = new THREE.MeshLambertMaterial({ color: leafColors[li] });
        const cone = new THREE.Mesh(new THREE.ConeGeometry(l.r, l.h, l.sides), mat);
        cone.position.y = l.y;
        cone.castShadow   = true;
        grp.add(cone);
    });

    grp.position.set(x, 0, z);
    grp.userData.swayOffset = Math.random() * Math.PI * 2;
    scene.add(grp);
    treeGroups.push(grp);
    return grp;
}

// ═══════════════════════════════
// STREET LAMP
// ═══════════════════════════════

function createLamp(x, z) {
    const grp = new THREE.Group();

    // Pole
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x778899 });
    const pole    = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 7.5, 8), poleMat);
    pole.position.y = 3.75;
    pole.castShadow  = true;
    grp.add(pole);

    // Horizontal arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.8), poleMat.clone());
    arm.position.set(0, 7.5, 0.9);
    grp.add(arm);

    // Lamp head
    const headMat = new THREE.MeshBasicMaterial({ color: 0x99bbff });
    const head    = new THREE.Mesh(new THREE.SphereGeometry(0.28, 9, 9), headMat);
    head.position.set(0, 7.5, 1.8);
    grp.add(head);

    // Lamp shade (small cylinder above bulb)
    const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.28, 0.25, 8, 1, true),
        new THREE.MeshLambertMaterial({ color: 0x555566, side: THREE.DoubleSide })
    );
    shade.position.set(0, 7.65, 1.8);
    grp.add(shade);

    // Actual light
    const light = new THREE.PointLight(0x6688ee, 1.5, 20);
    light.position.set(0, 7.3, 1.8);
    light.castShadow = false;
    grp.add(light);

    grp.position.set(x, 0, z);
    scene.add(grp);
}

// ═══════════════════════════════
// CLOUD CLUSTER
// ═══════════════════════════════

function createCloud(x, y, z) {
    const grp = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({
        color: 0x3a2266, transparent: true, opacity: 0.22
    });

    const blobs = [
        [0, 0, 0, 2.8], [-2.5, -0.6, 0.3, 2.0], [2.4, -0.4, -0.2, 2.2],
        [0.8, 0.7, 0.6, 1.7], [-1.2, 0.4, -0.8, 1.5],
    ];

    blobs.forEach(([bx, by, bz, r]) => {
        const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat.clone());
        blob.position.set(bx, by, bz);
        grp.add(blob);
    });

    grp.position.set(x, y, z);
    grp.userData.floatPhase  = Math.random() * Math.PI * 2;
    grp.userData.floatSpeed  = 0.25 + Math.random() * 0.35;
    grp.userData.driftSpeed  = (Math.random() - 0.5) * 0.008;
    scene.add(grp);
    clouds.push(grp);
    return grp;
}

// ═══════════════════════════════
// PARTICLES (AI theme — coloured floating dots)
// ═══════════════════════════════

function createParticles() {
    const count = 900;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);
    const vel   = new Float32Array(count);   // per-particle y velocity phase

    // Colour palette: cyan, purple, green, orange
    const palettes = [
        [0.0, 0.9, 1.0],   // cyan
        [0.54, 0.36, 0.98], // purple
        [0.13, 0.96, 0.42], // green
        [1.0, 0.62, 0.04],  // orange
    ];

    for (let i = 0; i < count; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * 90;
        pos[i * 3 + 1] = 1.5 + Math.random() * 22;
        pos[i * 3 + 2] = Math.random() * -(CFG.maxScroll + 30);
        vel[i]         = Math.random() * Math.PI * 2;

        const c = palettes[Math.floor(Math.random() * palettes.length)];
        col[i * 3]     = c[0];
        col[i * 3 + 1] = c[1];
        col[i * 3 + 2] = c[2];
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.11, vertexColors: true,
        transparent: true, opacity: 0.65,
        sizeAttenuation: true,
    });

    particles = new THREE.Points(geo, mat);
    scene.add(particles);
}

// ═══════════════════════════════
// WORLD BUILDER
// ═══════════════════════════════

function buildWorld() {
    setupLighting();
    createSky();
    createRoad();

    // Build all 5 houses
    HOUSES.forEach((_, i) => createHouse(i));

    // Trees — scatter along both sides
    const treeZones = [];
    for (let z = CFG.roadStart - 2; z > CFG.roadEnd - 15; z -= 6) {
        treeZones.push(z);
    }
    treeZones.forEach(z => {
        const scale = 0.75 + Math.random() * 0.6;
        // Left side
        const lx = -(14 + Math.random() * 5);
        const lz = z + (Math.random() - 0.5) * 3;
        createTree(lx, lz, scale);
        // Right side
        const rx = 14 + Math.random() * 5;
        const rz = z + (Math.random() - 0.5) * 3;
        createTree(rx, rz, scale * (0.8 + Math.random() * 0.4));
    });

    // Street lamps — every 16 units
    for (let z = 4; z > CFG.roadEnd - 5; z -= 16) {
        createLamp(-8.5, z);
        createLamp( 8.5, z);
    }

    // Clouds
    for (let i = 0; i < 16; i++) {
        const cx = (Math.random() - 0.5) * 120;
        const cy = 18 + Math.random() * 20;
        const cz = Math.random() * -(CFG.maxScroll + 30);
        createCloud(cx, cy, cz);
    }

    // Particles
    createParticles();
}

// ═══════════════════════════════
// SCROLL HANDLING
// ═══════════════════════════════

window.addEventListener('wheel', e => {
    if (CAM.zoomed) return;
    CAM.scroll = Math.max(0, Math.min(CFG.maxScroll, CAM.scroll + e.deltaY * 0.06));
    updateProgress();
    hideScrollHint();
}, { passive: true });

let touchY0 = 0;
window.addEventListener('touchstart', e => { touchY0 = e.touches[0].clientY; }, { passive: true });
window.addEventListener('touchmove', e => {
    if (CAM.zoomed) return;
    const dy = touchY0 - e.touches[0].clientY;
    touchY0 = e.touches[0].clientY;
    CAM.scroll = Math.max(0, Math.min(CFG.maxScroll, CAM.scroll + dy * 0.12));
    updateProgress();
    hideScrollHint();
}, { passive: true });

function updateProgress() {
    const pct = CAM.scroll / CFG.maxScroll;
    document.getElementById('progress-fill').style.width = (pct * 100) + '%';

    const nodes = document.querySelectorAll('.prog-node');
    HOUSES.forEach((h, i) => {
        // Activate node when camera gets within 12 units of house
        const camZ = CFG.roadStart - CAM.scroll;
        nodes[i].classList.toggle('active', camZ < h.z + 12);
    });
}

let scrollHintHidden = false;
function hideScrollHint() {
    if (!scrollHintHidden && CAM.scroll > 1) {
        scrollHintHidden = true;
        const el = document.getElementById('scroll-bottom-hint');
        if (el) el.style.opacity = '0';
    }
}

// ═══════════════════════════════
// MOUSE / CLICK
// ═══════════════════════════════

window.addEventListener('mousemove', e => {
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('click', () => {
    if (CAM.zoomed) return;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(clickables);
    if (hits.length > 0) {
        const obj = hits[0].object;
        if (obj.userData.isHouse) {
            CAM.zoomTo(obj.userData.idx);
            showPanel(obj.userData.section, obj.userData.name);
        }
    }
});

/* Hover — detect & highlight */
function checkHover() {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(clickables);

    if (hits.length > 0 && !CAM.zoomed) {
        const obj = hits[0].object;
        if (hovered !== obj) {
            // Restore previous
            if (hovered) setHouseGlow(hovered, false);
            hovered = obj;
            setHouseGlow(hovered, true);
            document.body.style.cursor = 'pointer';
            showTooltip(`Click to enter ${obj.userData.name}`);
        }
    } else {
        if (hovered) {
            setHouseGlow(hovered, false);
            hovered = null;
            document.body.style.cursor = 'default';
            hideTooltip();
        }
    }
}

function setHouseGlow(mesh, on) {
    if (!mesh || !mesh.userData.mat) return;
    mesh.userData.mat.emissiveIntensity = on ? 0.85 : 0.35;
    const i = mesh.userData.idx;
    if (houseLights[i]) houseLights[i].intensity = on ? 4.5 : 2.2;
}

// ═══════════════════════════════
// TOOLTIP
// ═══════════════════════════════

const tooltip = document.getElementById('tooltip');

function showTooltip(text) {
    tooltip.textContent = text;
    tooltip.classList.add('show');
}

function hideTooltip() {
    tooltip.classList.remove('show');
}

// ═══════════════════════════════
// 3D → 2D LABEL PROJECTION
// ═══════════════════════════════

function updateLabels() {
    const camZ = CAM.pos.z;
    const vec  = new THREE.Vector3();

    HOUSES.forEach((h, i) => {
        const el = document.getElementById(`label-${i}`);
        if (!el) return;

        // Label floats above the house
        vec.set(h.x, 10.5, h.z);
        vec.project(camera);

        // Only show if in front of camera and within a certain distance
        const dist      = Math.abs(camZ - h.z);
        const inFrustum = vec.z < 1.0 && dist < 55;

        if (inFrustum) {
            const sx = ( vec.x * 0.5 + 0.5) * window.innerWidth;
            const sy = (-vec.y * 0.5 + 0.5) * window.innerHeight;
            el.style.left    = sx + 'px';
            el.style.top     = sy + 'px';
            el.style.display = 'block';
            // Fade based on distance
            const alpha = Math.max(0, 1 - dist / 50);
            el.style.opacity = (CAM.zoomed ? 0 : alpha).toFixed(2);
            el.classList.add('visible');
        } else {
            el.style.opacity = '0';
        }
    });
}

// ═══════════════════════════════
// PANEL CONTENT DEFINITIONS
// ═══════════════════════════════

const PANEL_CONTENT = {

    about: /* html */`
        <div style="--sec-accent:#3b82f6">
            <div class="sec-header">
                <div class="sec-tag">▸ SECTION 01 / 05</div>
                <div class="sec-title">About Me</div>
                <div class="sec-bar"></div>
            </div>
            <div class="about-hero">
                <div class="about-avatar">👨‍💻</div>
                <div class="about-intro">
                    <h2>Mashiur Rahman Tonmoy</h2>
                    <div class="subtitle">CSE STUDENT · AI DEVELOPER · FOUNDER</div>
                    <p>Passionate Computer Science & Engineering student driven by a deep obsession with AI-powered systems and automation. I believe technology should eliminate repetition and amplify human potential.</p>
                </div>
            </div>
            <div class="about-cards">
                <div class="acard">
                    <div class="acard-icon">🏢</div>
                    <h4>FOUNDER & CEO</h4>
                    <p>Founded <strong style="color:#a78bfa">Neuroculas</strong>, an AI solutions agency building intelligent automation systems for modern businesses.</p>
                </div>
                <div class="acard">
                    <div class="acard-icon">🎓</div>
                    <h4>EDUCATION</h4>
                    <p>Bachelor of Science in Computer Science & Engineering — studying the fundamentals that power tomorrow's AI.</p>
                </div>
                <div class="acard">
                    <div class="acard-icon">🤖</div>
                    <h4>AI INTEGRATION</h4>
                    <p>Specializing in OpenAI, Anthropic, and open-source LLM integrations with real-world production applications.</p>
                </div>
                <div class="acard">
                    <div class="acard-icon">⚙️</div>
                    <h4>AUTOMATION</h4>
                    <p>Building n8n, Make.com, and custom scripted workflows that connect everything and automate the rest.</p>
                </div>
            </div>
        </div>
    `,

    skills: /* html */`
        <div style="--sec-accent:#0ea5e9">
            <div class="sec-header">
                <div class="sec-tag">▸ SECTION 02 / 05</div>
                <div class="sec-title">Skills</div>
                <div class="sec-bar"></div>
            </div>
            <div class="skills-grid" id="skills-grid-container">
                ${[
                    { name: 'JavaScript',       icon: '🟨', pct: 92 },
                    { name: 'React',            icon: '⚛️', pct: 88 },
                    { name: 'Next.js',          icon: '▲',  pct: 85 },
                    { name: 'Node.js',          icon: '🟢', pct: 87 },
                    { name: 'Express.js',       icon: '🚂', pct: 84 },
                    { name: 'MongoDB',          icon: '🍃', pct: 81 },
                    { name: 'SQL',              icon: '🗃️', pct: 78 },
                    { name: 'TypeScript',       icon: '🔷', pct: 80 },
                    { name: 'AI Integration',   icon: '🧠', pct: 91 },
                    { name: 'Automation',       icon: '⚡', pct: 89 },
                ].map((s, i) => `
                    <div class="scard" style="animation-delay:${i * 0.06}s">
                        <span class="scard-icon">${s.icon}</span>
                        <div class="scard-name">${s.name}</div>
                        <div class="scard-bar-wrap">
                            <div class="scard-bar" data-pct="${s.pct}" style="width:0"></div>
                        </div>
                        <div class="scard-pct">${s.pct}%</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `,

    projects: /* html */`
        <div style="--sec-accent:#8b5cf6">
            <div class="sec-header">
                <div class="sec-tag">▸ SECTION 03 / 05</div>
                <div class="sec-title">Projects</div>
                <div class="sec-bar"></div>
            </div>
            <div class="proj-grid">
                ${[
                    {
                        icon: '🤖', name: 'AI Chatbot Platform',
                        paccent: '#8b5cf6',
                        desc: 'Multi-model AI chatbot with streaming responses, conversation memory, and custom knowledge base injection via RAG.',
                        tags: ['OpenAI', 'LangChain', 'React', 'Node.js'],
                        delay: 0.05
                    },
                    {
                        icon: '⚡', name: 'Automation Workflows',
                        paccent: '#22c55e',
                        desc: '50+ end-to-end business automation pipelines connecting CRMs, payment gateways, emails, and analytics dashboards.',
                        tags: ['n8n', 'Make.com', 'Webhooks', 'APIs'],
                        delay: 0.1
                    },
                    {
                        icon: '📰', name: 'LCBA News Platform',
                        paccent: '#0ea5e9',
                        desc: 'Full-featured news publishing platform with headless CMS, real-time updates, SEO optimisation, and admin dashboard.',
                        tags: ['Next.js', 'MongoDB', 'Sanity CMS', 'Vercel'],
                        delay: 0.15
                    },
                    {
                        icon: '🏗️', name: 'Full Stack SaaS Apps',
                        paccent: '#f59e0b',
                        desc: 'Production-ready SaaS applications featuring auth systems, Stripe payments, role-based access, and analytics.',
                        tags: ['React', 'Express', 'PostgreSQL', 'Stripe'],
                        delay: 0.2
                    },
                    {
                        icon: '🧠', name: 'RAG Knowledge System',
                        paccent: '#ec4899',
                        desc: 'Retrieval-Augmented Generation system for company document Q&A — PDF ingestion, vector search, and LLM synthesis.',
                        tags: ['Python', 'Pinecone', 'LangChain', 'FastAPI'],
                        delay: 0.25
                    },
                    {
                        icon: '📊', name: 'AI Analytics Dashboard',
                        paccent: '#06b6d4',
                        desc: 'Real-time data visualisation with predictive AI insights, anomaly detection, and automated report generation.',
                        tags: ['React', 'D3.js', 'TensorFlow.js', 'WebSockets'],
                        delay: 0.3
                    },
                ].map(p => `
                    <div class="pcard" style="--paccent:${p.paccent}; animation-delay:${p.delay}s">
                        <div class="pcard-icon">${p.icon}</div>
                        <h3>${p.name}</h3>
                        <p>${p.desc}</p>
                        <div class="pcard-tags">
                            ${p.tags.map(t => `<span class="ptag">${t}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `,

    services: /* html */`
        <div style="--sec-accent:#22c55e">
            <div class="sec-header">
                <div class="sec-tag">▸ SECTION 04 / 05</div>
                <div class="sec-title">AI Services</div>
                <div class="sec-bar"></div>
            </div>
            <div class="neuroculas-banner">
                <div class="nb-icon">🧬</div>
                <div class="nb-text">
                    <h3>NEUROCULAS — AI AUTOMATION AGENCY</h3>
                    <p>We build intelligent systems that help businesses automate repetitive work, scale operations, and unlock the power of AI — without the complexity.</p>
                </div>
            </div>
            <div class="srv-grid">
                ${[
                    { icon: '🤖', name: 'CUSTOM AI CHATBOTS',    desc: 'Trained on your data. Deployed on your platform. Handles customer support, onboarding, and FAQs 24/7.',       delay: 0.05 },
                    { icon: '⚙️', name: 'WORKFLOW AUTOMATION',   desc: 'Connect and automate any combination of tools — CRMs, emails, spreadsheets, Slack, Notion, and more.',        delay: 0.1  },
                    { icon: '🌐', name: 'AI-POWERED WEB APPS',   desc: 'Full stack web applications with AI capabilities built in — from concept to deployment on scalable infra.',     delay: 0.15 },
                    { icon: '📊', name: 'INTELLIGENT PIPELINES', desc: 'Data collection, transformation, enrichment, and AI-driven insights — all automated and visualised in real time.',delay: 0.2  },
                    { icon: '🔗', name: 'API INTEGRATION',        desc: 'Seamlessly stitch together any combination of third-party APIs into unified, maintainable automation systems.',   delay: 0.25 },
                    { icon: '🧠', name: 'CUSTOM LLM SOLUTIONS',  desc: 'Fine-tuned models, RAG pipelines, and agent orchestration tailored to your specific domain and use case.',      delay: 0.3  },
                ].map(s => `
                    <div class="srvc" style="animation-delay:${s.delay}s">
                        <div class="srvc-icon">${s.icon}</div>
                        <h4>${s.name}</h4>
                        <p>${s.desc}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `,

    contact: /* html */`
        <div style="--sec-accent:#f59e0b">
            <div class="sec-header">
                <div class="sec-tag">▸ SECTION 05 / 05</div>
                <div class="sec-title">Let's Build AI Together</div>
                <div class="sec-bar"></div>
            </div>
            <p class="contact-headline">
                Have a project in mind? Want to automate your workflows? 
                Looking to hire a <span>Full Stack AI Developer</span>?
                Let's make it happen.
            </p>
            <div class="clink-grid">
                ${[
                    { icon: '📧', title: 'EMAIL',     desc: 'tonmoy@neuroculas.com',          href: 'mailto:tonmoy@neuroculas.com', delay: 0.05 },
                    { icon: '🌐', title: 'WEBSITE',   desc: 'neuroculas.com — Agency website', href: '#',                           delay: 0.1  },
                    { icon: '💼', title: 'LINKEDIN',  desc: 'linkedin.com/in/tonmoy',          href: '#',                           delay: 0.15 },
                    { icon: '🐙', title: 'GITHUB',    desc: 'github.com/tonmoy',               href: '#',                           delay: 0.2  },
                    { icon: '📱', title: 'WHATSAPP',  desc: 'Quick project discussions',       href: '#',                           delay: 0.25 },
                    { icon: '🐦', title: 'TWITTER/X', desc: '@tonmoy_dev',                     href: '#',                           delay: 0.3  },
                ].map(c => `
                    <a href="${c.href}" class="clink" style="animation-delay:${c.delay}s">
                        <span class="clink-icon">${c.icon}</span>
                        <div class="clink-body">
                            <h4>${c.title}</h4>
                            <p>${c.desc}</p>
                        </div>
                        <span class="clink-arrow">→</span>
                    </a>
                `).join('')}
            </div>
        </div>
    `,
};

// ═══════════════════════════════
// PANEL SHOW / HIDE
// ═══════════════════════════════

const panelOverlay  = document.getElementById('panel-overlay');
const panelContent  = document.getElementById('panel-content');

function showPanel(section) {
    panelContent.innerHTML = PANEL_CONTENT[section] || '';
    panelOverlay.classList.add('open');

    // Trigger skill bar animations after a short delay
    if (section === 'skills') {
        setTimeout(() => {
            document.querySelectorAll('.scard-bar').forEach(bar => {
                bar.style.width = bar.dataset.pct + '%';
            });
        }, 300);
    }
}

function hidePanel() {
    panelOverlay.classList.remove('open');
    setTimeout(() => CAM.reset(), 600);
}

document.getElementById('close-btn').addEventListener('click', hidePanel);
// Close on backdrop click
panelOverlay.addEventListener('click', e => {
    if (e.target === panelOverlay || e.target.classList.contains('panel-bg-blur')) {
        hidePanel();
    }
});

// ═══════════════════════════════
// INTRO STARS GENERATION
// ═══════════════════════════════

function generateIntroStars() {
    const container = document.getElementById('intro-stars');
    if (!container) return;
    for (let i = 0; i < 180; i++) {
        const star   = document.createElement('div');
        star.className = 'star';
        star.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: ${Math.random() * 0.6 + 0.1};
            animation-delay: ${Math.random() * 4}s;
            animation-duration: ${2 + Math.random() * 3}s;
            width: ${1 + Math.random() * 2}px;
            height: ${1 + Math.random() * 2}px;
        `;
        container.appendChild(star);
    }
}

// ═══════════════════════════════
// INTRO BUTTON
// ═══════════════════════════════

document.getElementById('enter-btn').addEventListener('click', () => {
    const intro = document.getElementById('intro-screen');
    intro.classList.add('fade-out');
    document.getElementById('hud').classList.add('visible');
    document.getElementById('scroll-bottom-hint').style.opacity = '1';
    setTimeout(() => { intro.style.display = 'none'; }, 1300);
});

// ═══════════════════════════════
// ANIMATION LOOP
// ═══════════════════════════════

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // ─ Camera ─
    CAM.tick();

    // ─ Clouds float ─
    clouds.forEach(c => {
        c.position.y   += Math.sin(t * c.userData.floatSpeed + c.userData.floatPhase) * 0.003;
        c.position.x   += c.userData.driftSpeed;
        // Wrap clouds laterally
        if (c.position.x >  70) c.position.x = -70;
        if (c.position.x < -70) c.position.x =  70;
    });

    // ─ Particles drift ─
    if (particles) {
        const pos = particles.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            // Subtle y oscillation
            pos.setY(i, pos.getY(i) + Math.sin(t * 0.4 + i * 0.7) * 0.0015);
        }
        pos.needsUpdate = true;
        particles.rotation.y = Math.sin(t * 0.02) * 0.01;
    }

    // ─ House point lights pulse ─
    houseLights.forEach((light, i) => {
        light.intensity *= 0.96;
        light.intensity += (hovered && hovered.userData.idx === i ? 4.5 : 2.2) * 0.04;
        // Subtle flicker
        light.intensity += (Math.random() - 0.5) * 0.05;
    });

    // ─ Tree gentle sway ─
    treeGroups.forEach((t2, i) => {
        t2.rotation.z = Math.sin(t * 0.6 + t2.userData.swayOffset) * 0.018;
    });

    // ─ House label projection ─
    updateLabels();

    // ─ Progress ─
    updateProgress();

    // ─ Check hover ─
    checkHover();

    renderer.render(scene, camera);
}

// ═══════════════════════════════
// RESIZE
// ═══════════════════════════════

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ═══════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════

window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && CAM.zoomed) {
        hidePanel();
    }
    // Arrow key scroll
    if (!CAM.zoomed) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            CAM.scroll = Math.min(CFG.maxScroll, CAM.scroll + 8);
            updateProgress();
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            CAM.scroll = Math.max(0, CAM.scroll - 8);
            updateProgress();
        }
    }
});

// ═══════════════════════════════
// INITIALISE
// ═══════════════════════════════

generateIntroStars();
buildWorld();
animate();

console.log('%c🤖 NEUROCULAS — Mashiur Rahman Tonmoy Portfolio', 'color:#8b5cf6;font-size:14px;font-weight:bold');
console.log('%cBuilt with Three.js · Scroll to explore the 3D world', 'color:#6b7280');