// ==================== THREE.JS SETUP ====================
let scene, camera, renderer, labelRenderer, controls;
let sun,
  planets = {},
  orbits = {},
  labels = {};
let raycaster, mouse;
let showLabels = true;
let animationSpeed = 1; // Integer value for animation speed (days/sec)
let isPlaying = true;
let selectedPlanet = null; // Track the currently selected planet
let followingPlanet = false; // Whether camera is following a planet

// ==================== CONSTANTS ====================
const ORBITAL_FACTOR = 5000; // Spread planets out
const MIN_ORBIT_DISPLAY = 800; // Minimum orbit display size
const SIZE_FACTOR = 0.05; // Planet size factor
const SUN_SIZE_FACTOR = 0.005; // Sun size factor
const CAMERA_DISTANCE = 5000; // Initial camera distance
const MAX_ZOOM_DISTANCE = 500000; // Maximum zoom distance
const STARFIELD_SIZE = 1000000; // Starfield size
const AU = 149.6e6; // 1 Astronomical Unit in km
const MIN_ORBITAL_CLEARANCE = 1.2; // Minimum clearance factor for orbital objects (20% larger than parent radius)

const PLANET_DATA = {
  Sun: {
    radius: (1391400 / 2) * SUN_SIZE_FACTOR, // Half of diameter
    color: 0xfdb813,
    emissive: 0xfdb813,
    emissiveIntensity: 0.5,
    daysInYear: 0,
    rotationPeriod: 25,
    description:
      "The star at the center of our Solar System. Diameter: 1,391,400 km.",
    textureUrl: null,
  },
  Mercury: {
    radius: (4879 / 2) * SIZE_FACTOR, // Half of diameter
    orbitRadius: (0.39 * AU) / ORBITAL_FACTOR,
    color: 0xa37b7b,
    daysInYear: 88,
    rotationPeriod: 59,
    description:
      "The smallest and innermost planet in the Solar System. Diameter: 4,879 km. Distance from Sun: 0.39 AU.",
    textureUrl: null,
  },
  Venus: {
    radius: (12104 / 2) * SIZE_FACTOR, // Half of diameter
    orbitRadius: (0.72 * AU) / ORBITAL_FACTOR,
    color: 0xe2b15b,
    daysInYear: 225,
    rotationPeriod: 243,
    description:
      "The second planet from the Sun and the hottest in our Solar System. Diameter: 12,104 km. Distance from Sun: 0.72 AU.",
    textureUrl: null,
  },
  Earth: {
    radius: (12756 / 2) * SIZE_FACTOR, // Half of diameter
    orbitRadius: (1.0 * AU) / ORBITAL_FACTOR,
    color: 0x4ba8ff,
    daysInYear: 365.25,
    rotationPeriod: 1,
    description:
      "Our home planet and the only known planet to harbor life. Diameter: 12,756 km. Distance from Sun: 1.0 AU.",
    textureUrl: null,
    moons: [
      {
        name: "Moon",
        radius: (12756 / 2) * SIZE_FACTOR * 0.25, // 1/4 of Earth's size
        orbitRadius: ((0.00243 * AU) / ORBITAL_FACTOR) * 5, // Scaled up for visibility
        color: 0xcccccc,
        daysInYear: 27.3, // Orbital period in Earth days
        rotationPeriod: 27.3, // Tidally locked
        description:
          "Earth's only natural satellite. Diameter: 3,474 km. Distance from Earth: 0.002430 AU (384,400 km).",
      },
    ],
  },
  Mars: {
    radius: (6792 / 2) * SIZE_FACTOR, // Half of diameter
    orbitRadius: (1.52 * AU) / ORBITAL_FACTOR,
    color: 0xe27b58,
    daysInYear: 687,
    rotationPeriod: 1.03,
    description:
      "The Red Planet, fourth from the Sun. Diameter: 6,792 km. Distance from Sun: 1.52 AU.",
    textureUrl: null,
  },
  Jupiter: {
    radius: (142984 / 2) * SIZE_FACTOR, // Half of diameter
    orbitRadius: (5.2 * AU) / ORBITAL_FACTOR,
    color: 0xe1caa7,
    daysInYear: 4333,
    rotationPeriod: 0.41,
    description:
      "The largest planet in our Solar System. Diameter: 142,984 km. Distance from Sun: 5.2 AU.",
    textureUrl: null,
  },
  Saturn: {
    radius: (120536 / 2) * SIZE_FACTOR, // Half of diameter
    orbitRadius: (9.54 * AU) / ORBITAL_FACTOR,
    color: 0xf5e0b5,
    daysInYear: 10759,
    rotationPeriod: 0.45,
    description:
      "The ringed planet, sixth from the Sun. Diameter: 120,536 km. Distance from Sun: 9.54 AU.",
    textureUrl: null,
    rings: {
      innerRadius: 74500 * SIZE_FACTOR,
      outerRadius: 140000 * SIZE_FACTOR,
      color: 0xe1caa7,
    },
  },
  Uranus: {
    radius: (51118 / 2) * SIZE_FACTOR, // Half of diameter
    orbitRadius: (19.2 * AU) / ORBITAL_FACTOR,
    color: 0x9fe3de,
    daysInYear: 30688.5,
    rotationPeriod: 0.72,
    description:
      "The seventh planet from the Sun, an ice giant with a tilted axis. Diameter: 51,118 km. Distance from Sun: 19.2 AU.",
    textureUrl: null,
  },
  Neptune: {
    radius: (49528 / 2) * SIZE_FACTOR, // Half of diameter
    orbitRadius: (30.06 * AU) / ORBITAL_FACTOR,
    color: 0x5b5ddf,
    daysInYear: 60195,
    rotationPeriod: 0.67,
    description:
      "The eighth and most distant planet in our Solar System. Diameter: 49,528 km. Distance from Sun: 30.06 AU.",
    textureUrl: null,
  },
};

// ==================== INITIALIZATION ====================
function init() {
  initThreeJS();
  initRaycaster();
  createScene();
  initControls();
  initEventListeners();
  createStarfield();
  initUIControls();

  // Initialize speed display and set initial animation speed
  const speedSlider = document.getElementById("speed-slider");
  if (speedSlider) {
    // Set initial slider value
    speedSlider.value = 0;

    // Calculate initial animation speed using the logarithmic scale
    const logBase = 1.06;
    animationSpeed = Math.max(
      1,
      Math.round(Math.pow(logBase, parseInt(speedSlider.value)))
    );

    // Update the display
    updateSpeedDisplay();

    // Set the initial slider fill
    const percent =
      ((parseInt(speedSlider.value) - speedSlider.min) /
        (speedSlider.max - speedSlider.min)) *
      100;
    speedSlider.style.setProperty("--slider-fill", `${percent}%`);
  }

  // Log planet positions for debugging
  logPlanetPositions();

  // Set initial view to show the entire solar system
  zoomToShowEntireSolarSystem();

  // Remove loading screen immediately after initialization
  const loadingScreen = document.getElementById("loading-screen");
  loadingScreen.style.opacity = "0";
  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 500);

  animate();
}

function initThreeJS() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000); // Set black background
  camera = new THREE.PerspectiveCamera(
    60, // Increased FOV from 45 to 60
    window.innerWidth / window.innerHeight,
    0.1,
    STARFIELD_SIZE * 2 // Increased far clipping plane significantly
  );
  camera.position.set(CAMERA_DISTANCE, CAMERA_DISTANCE / 3, CAMERA_DISTANCE);

  // Main WebGL renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("solarSystem"),
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // CSS2D renderer for labels
  labelRenderer = new THREE.CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0";
  labelRenderer.domElement.style.pointerEvents = "none";
  document
    .getElementById("canvas-container")
    .appendChild(labelRenderer.domElement);
}

function initRaycaster() {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
}

function initControls() {
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 1.5; // Reduced for smoother zooming
  controls.minDistance = 10;
  controls.maxDistance = MAX_ZOOM_DISTANCE; // Using the new constant for maximum zoom
  controls.enableZoom = true;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.1;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN,
  };
}

// ==================== SCENE CREATION ====================
function createScene() {
  createSun();
  createPlanets();
  createOrbits();
  createLabels();
  setupLighting();
}

// Helper function to create a celestial body (planet, moon, sun)
function createCelestialBody(options) {
  const geometry = new THREE.SphereGeometry(
    options.radius,
    options.segments || 32,
    options.segments || 32
  );

  const material = new THREE.MeshPhongMaterial({
    color: options.color,
    emissive: options.emissive || options.color,
    emissiveIntensity: options.emissiveIntensity || 0.2,
    shininess: options.shininess || 30,
  });

  const body = new THREE.Mesh(geometry, material);

  // Set position if provided
  if (options.position) {
    body.position.copy(options.position);
  } else if (options.x !== undefined || options.z !== undefined) {
    body.position.set(options.x || 0, options.y || 0, options.z || 0);
  }

  // Set rotation if provided
  if (options.rotation) {
    body.rotation.copy(options.rotation);
  }

  // Add to parent or scene
  if (options.parent) {
    options.parent.add(body);
  } else if (options.addToScene !== false) {
    scene.add(body);
  }

  return body;
}

function createSun() {
  const sunData = PLANET_DATA.Sun;

  // Create the base sun mesh
  const sunGeometry = new THREE.SphereGeometry(sunData.radius, 64, 64);

  // Create a shader material for more realistic sun surface
  const sunMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color1: { value: new THREE.Color(0xffff33) }, // Pure bright yellow
      color2: { value: new THREE.Color(0xff7700) }, // More vivid orange
      color3: { value: new THREE.Color(0xffcc00) }, // Gold
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color3;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;

      // Simplex noise functions from https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        // Create dynamic noise pattern for sun surface with more variation
        float n1 = snoise(vUv * 10.0 + time * 0.1);
        float n2 = snoise(vUv * 20.0 - time * 0.05);
        float n3 = snoise(vUv * 5.0 + time * 0.15);
        float n4 = snoise(vUv * 50.0 + time * 0.2); // Added higher frequency detail
        
        // Combine noise for turbulent effect with more small-scale details
        float noise = n1 * 0.45 + n2 * 0.25 + n3 * 0.2 + n4 * 0.1;
        
        // Generate base color from noise only (no normal-based darkening)
        // Enhanced color mix for more vibrant appearance
        vec3 baseColor = mix(color2, color1, noise * 0.6 + 0.4);
        
        // Add bright spots/solar flares using only noise (no normal calculations)
        float spotNoise1 = snoise(vUv * 15.0 + time * 0.2);
        float spotNoise2 = snoise(vUv * 25.0 - time * 0.15);
        float brightSpots = max(0.0, (spotNoise1 * spotNoise2) * 1.8); // Increased intensity
        
        // Add more solar variation with purely noise-based patterns
        float flarePattern = snoise(vUv * 8.0 + time * 0.3) * snoise(vUv * 4.0 - time * 0.2);
        float flares = max(0.0, flarePattern * flarePattern * 1.0); // Increased intensity
        
        // Create a more dynamic sun surface with multiple layers of detail
        float smallDetails = snoise(vUv * 30.0 + time * 0.25) * 0.15; // Increased detail
        float mediumDetails = snoise(vUv * 12.0 - time * 0.15) * 0.2; // Increased detail
        
        // Combine all effects without any normal-based darkening
        vec3 finalColor = baseColor;
        finalColor += vec3(1.0, 0.9, 0.5) * brightSpots * brightSpots * 0.5; // Brighter spots
        finalColor += vec3(1.0, 0.7, 0.3) * flares * 0.4; // Brighter flares
        finalColor += vec3(1.0, 0.9, 0.5) * smallDetails; // Brighter details
        finalColor += vec3(1.0, 0.7, 0.3) * mediumDetails; // Brighter medium details
        
        // Ensure the sun is uniformly bright with a minimum brightness floor
        finalColor = max(finalColor, vec3(1.0, 0.7, 0.2)); // Higher yellow component
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    transparent: true,
    side: THREE.FrontSide,
    emissive: true, // Make the sun self-illuminating
  });

  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  // Create enhanced sun glow effects
  createEnhancedSunGlow(sunData.radius, sunMaterial);
}

function createEnhancedSunGlow(sunRadius, sunMaterial) {
  // Create a more sophisticated glow with multiple layers

  // Inner glow - close to the sun surface
  const innerGlowGeometry = new THREE.SphereGeometry(sunRadius * 1.1, 32, 32);
  const innerGlowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      viewVector: { value: new THREE.Vector3(0, 0, 1) },
      sunColor: { value: new THREE.Color(0xffcc33) },
    },
    vertexShader: `
      uniform vec3 viewVector;
      varying float intensity;
      void main() {
        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vNormel = normalize(normalMatrix * viewVector);
        intensity = pow(0.6 - dot(vNormal, vNormel), 1.5);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 sunColor;
      varying float intensity;
      void main() {
        float adjustedIntensity = intensity * 0.5 + 0.1;
        gl_FragColor = vec4(sunColor, adjustedIntensity);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });

  innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
  scene.add(innerGlow);

  // Outer glow - larger area around the sun
  const outerGlowGeometry = new THREE.SphereGeometry(sunRadius * 1.5, 32, 32);
  const outerGlowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      viewVector: { value: new THREE.Vector3(0, 0, 1) },
      sunColor: { value: new THREE.Color(0xff8833) },
    },
    vertexShader: `
      uniform vec3 viewVector;
      varying float intensity;
      void main() {
        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vNormel = normalize(normalMatrix * viewVector);
        intensity = pow(0.6 - dot(vNormal, vNormel), 1.8);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 sunColor;
      varying float intensity;
      void main() {
        float adjustedIntensity = intensity * 0.4 + 0.05;
        gl_FragColor = vec4(sunColor, adjustedIntensity);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });

  outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
  scene.add(outerGlow);

  // Corona - very large and subtle outermost layer
  const coronaGeometry = new THREE.SphereGeometry(sunRadius * 2.5, 32, 32);
  const coronaMaterial = new THREE.ShaderMaterial({
    uniforms: {
      viewVector: { value: new THREE.Vector3(0, 0, 1) },
      sunColor: { value: new THREE.Color(0xff5500) },
    },
    vertexShader: `
      uniform vec3 viewVector;
      varying float intensity;
      void main() {
        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vNormel = normalize(normalMatrix * viewVector);
        intensity = pow(0.7 - dot(vNormal, vNormel), 2.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 sunColor;
      varying float intensity;
      void main() {
        float adjustedIntensity = intensity * 0.15 + 0.03;
        gl_FragColor = vec4(sunColor, adjustedIntensity);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });

  corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
  scene.add(corona);

  // Function to update the glow based on camera position
  updateGlow = function () {
    // Update uniforms for all glow layers
    const viewVector = new THREE.Vector3()
      .subVectors(camera.position, sun.position)
      .normalize();
    innerGlowMaterial.uniforms.viewVector.value = viewVector;
    outerGlowMaterial.uniforms.viewVector.value = viewVector;
    coronaMaterial.uniforms.viewVector.value = viewVector;

    // Update positions to follow the sun
    innerGlow.position.copy(sun.position);
    outerGlow.position.copy(sun.position);
    corona.position.copy(sun.position);
  };
}

function createPlanets() {
  Object.entries(PLANET_DATA).forEach(([name, data]) => {
    if (name === "Sun") return;

    // Scale planets for visibility but ensure they're smaller than the sun
    const scaleFactor = getPlanetScaleFactor(name);
    const scaledRadius = data.radius * scaleFactor;

    // Position planet - use fixed angles for initial positions to ensure they're spread out
    const planetIndex = Object.keys(PLANET_DATA).indexOf(name) - 1; // -1 to skip Sun
    const angle =
      (planetIndex / (Object.keys(PLANET_DATA).length - 1)) * Math.PI * 2;

    // Calculate orbit radius
    const adjustedRadius = calculatePlanetOrbitRadius(name, data.orbitRadius);

    // Calculate position
    const position = calculatePlanetPosition(angle, adjustedRadius);

    // Create the planet
    const planet = createCelestialBody({
      radius: scaledRadius,
      color: data.color,
      emissiveIntensity: 0.2,
      x: position.x,
      z: position.z,
    });

    // Add rings for Saturn
    if (name === "Saturn") {
      const rings = createSaturnRings(data.rings);
      planet.add(rings);
    }

    // Add tilt for Uranus (97.77 degrees)
    if (name === "Uranus") {
      planet.rotation.z = THREE.MathUtils.degToRad(97.77);
    }

    planets[name] = planet;

    console.log(`Planet ${name} created at position:`, planet.position);

    // Create moons for a planet
    createMoons(planet, data);
  });
}

function createSaturnRings(ringsData) {
  // Get the planet's scaled radius from the Saturn data
  const planetName = "Saturn";
  const planetData = PLANET_DATA[planetName];
  const scaleFactor = 1.5; // Same scale factor used for gas giants in createPlanets
  const scaledPlanetRadius = planetData.radius * scaleFactor;

  // Calculate safe ring dimensions using the utility function
  const innerRadius = calculateSafeOrbitDistance(
    scaledPlanetRadius,
    ringsData.innerRadius * 0.2
  );

  // Ensure outer radius is larger than inner radius
  const outerRadius = Math.max(ringsData.outerRadius * 0.2, innerRadius * 1.5);

  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
  const material = new THREE.MeshBasicMaterial({
    color: ringsData.color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  const rings = new THREE.Mesh(geometry, material);
  rings.rotation.x = Math.PI / 2;

  console.log(
    `Saturn rings created with inner radius: ${innerRadius}, outer radius: ${outerRadius}, planet radius: ${scaledPlanetRadius}`
  );

  return rings;
}

function createOrbits() {
  Object.entries(PLANET_DATA).forEach(([name, data]) => {
    if (name === "Sun") return;

    // Calculate orbit radius
    const adjustedRadius = calculatePlanetOrbitRadius(name, data.orbitRadius);

    // Create orbit geometry using the helper function
    const orbitGeometry = createOrbitGeometry(adjustedRadius, 20, false);

    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: data.color, // Use the planet's color for its orbit
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5, // Slightly reduced opacity to prevent visual overload
    });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;

    // Store the default opacity for later use
    orbit.userData.defaultOpacity = 0.5;

    scene.add(orbit);
    orbits[name] = orbit;

    console.log(`Orbit for ${name} created with radius:`, adjustedRadius);
  });
}

// Helper function to create a label for a celestial body
function createLabel(name, parent, height, options = {}) {
  const label = document.createElement("div");
  label.className = "label";
  label.textContent = name;
  label.style.display = showLabels ? "block" : "none";

  // Add click event listener to the label
  label.addEventListener("click", function (event) {
    // Stop propagation to prevent double triggering from canvas click
    event.stopPropagation();

    // Find the object associated with this label
    let targetObject;

    if (name === "Sun") {
      targetObject = sun;
    } else if (planets[name]) {
      targetObject = planets[name];
    } else {
      // Check if it's a moon by looking through all planets' moons
      Object.entries(planets).forEach(([planetName, planet]) => {
        if (planet.moons && planet.moons[name]) {
          targetObject = planet.moons[name].moon;
        }
      });
    }

    // If we found the object, focus on it
    if (targetObject) {
      focusOnPlanet(targetObject);
      updateInfoPanel(targetObject);
    }
  });

  const labelObject = new THREE.CSS2DObject(label);
  labelObject.position.set(0, height, 0);

  if (parent) {
    parent.add(labelObject);
  }

  // Store special container for Uranus or other special cases
  if (options.useContainer) {
    const labelContainer = new THREE.Object3D();
    scene.add(labelContainer);

    // Store reference data
    labelContainer.userData = { planetName: name };

    // Add label to container
    labelContainer.add(labelObject);

    // Return both the label and container
    return {
      object: labelObject,
      container: labelContainer,
    };
  }

  return labelObject;
}

function createLabels() {
  Object.entries(PLANET_DATA).forEach(([name, data]) => {
    // Position labels above objects with appropriate scaling
    const labelHeight = name === "Sun" ? data.radius * 2 : data.radius * 4;

    // For Uranus, create a special handling due to its axial tilt
    if (name === "Uranus") {
      // Create a label with a container for Uranus
      labels[name] = createLabel(name, null, labelHeight, {
        useContainer: true,
      });
    } else {
      // Standard label positioning for other planets
      const parent = name === "Sun" ? sun : planets[name];
      labels[name] = createLabel(name, parent, labelHeight);
    }
  });

  // Add a function to update Uranus's label position during animation
  updateUranusLabel();
}

// Function to update Uranus's label position
function updateUranusLabel() {
  // Check if Uranus label exists and has a container
  if (labels["Uranus"] && labels["Uranus"].container) {
    const uranus = planets["Uranus"];
    if (!uranus) return;

    // Get Uranus's current world position
    uranus.updateWorldMatrix(true, false);
    const uranusPosition = new THREE.Vector3();
    uranusPosition.setFromMatrixPosition(uranus.matrixWorld);

    // Get the label height from the planet data
    const uranusData = PLANET_DATA["Uranus"];
    const labelHeight = uranusData.radius * 4; // Same as other planets

    // Position the container at Uranus's position
    labels["Uranus"].container.position.copy(uranusPosition);

    // Ensure the label is always positioned directly above the planet in world space
    // regardless of the planet's rotation
    labels["Uranus"].object.position.set(0, labelHeight, 0);
  }
}

function setupLighting() {
  // Add ambient light for better overall visibility
  const ambientLight = new THREE.AmbientLight(0x444444, 0.6); // Reduced intensity
  scene.add(ambientLight);

  // Add point light at the sun's position
  sunLight = new THREE.PointLight(0xffffcc, 1.5, 0, 1); // Warmer color, adjusted intensity
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // Add hemisphere light for better planet visibility
  const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.3); // Reduced intensity
  scene.add(hemisphereLight);
}

function createStarfield() {
  // Create a much larger starfield with more stars and better distribution

  // Store references to star materials for dynamic opacity adjustment
  window.starMaterials = {
    far: createStarLayer({
      count: 100000,
      size: 1.0,
      opacity: 0.4,
      sizeAttenuation: false,
      radiusMin: STARFIELD_SIZE * 0.8,
      radiusMax: STARFIELD_SIZE,
      distribution: "spherical",
    }),

    mid: createStarLayer({
      count: 50000,
      size: 2.5,
      opacity: 0.5,
      sizeAttenuation: true,
      radiusMin: STARFIELD_SIZE * 0.4,
      radiusMax: STARFIELD_SIZE * 0.7,
      distribution: "spherical",
    }),

    near: createStarLayer({
      count: 10000,
      size: 3.5,
      opacity: 0.6,
      sizeAttenuation: true,
      radiusMin: 0,
      radiusMax: STARFIELD_SIZE * 0.5,
      distribution: "uniform",
    }),
  };
}

// Helper function to create a star layer
function createStarLayer(options) {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: options.size,
    transparent: true,
    opacity: options.opacity,
    sizeAttenuation: options.sizeAttenuation,
  });

  const vertices = [];

  if (options.distribution === "spherical") {
    // Spherical distribution for distant and mid stars
    for (let i = 0; i < options.count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius =
        options.radiusMin +
        Math.random() * (options.radiusMax - options.radiusMin);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      vertices.push(x, y, z);
    }
  } else {
    // Uniform distribution for nearby stars
    for (let i = 0; i < options.count; i++) {
      const x = (Math.random() - 0.5) * options.radiusMax;
      const y = (Math.random() - 0.5) * options.radiusMax;
      const z = (Math.random() - 0.5) * options.radiusMax;

      vertices.push(x, y, z);
    }
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);

  return material;
}

// ==================== ANIMATION ====================
function animate() {
  requestAnimationFrame(animate);

  // Update the sun shader time uniform for animation
  if (sun && sun.userData.material && sun.userData.material.uniforms) {
    sun.userData.material.uniforms.time.value += 0.01;

    // Update sun glow effects to follow camera position
    if (sun.userData.updateGlow) {
      sun.userData.updateGlow();
    }
  }

  if (isPlaying) {
    updatePlanetPositions();
  }

  // Update camera position if following a planet or moon
  if (followingPlanet && selectedPlanet) {
    updateCameraFollow();
  }

  // Update Uranus label position
  updateUranusLabel();

  // Adjust star opacity based on camera distance
  adjustStarOpacity();

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

// Helper function to calculate rotation increment
function calculateRotationIncrement(rotationPeriod) {
  return (Math.PI * 2) / (rotationPeriod * 1000);
}

function updatePlanetPositions() {
  // Use a fixed time increment based on integer animation speed
  // Scale down by 100 to prevent too fast animation with higher values
  const timeIncrement = 0.01 * animationSpeed;
  window.currentSimTime = (window.currentSimTime || 0) + timeIncrement;
  const time = window.currentSimTime;

  Object.entries(planets).forEach(([name, planet]) => {
    const data = PLANET_DATA[name];
    const angle = (time / data.daysInYear) * Math.PI * 2;

    // Calculate orbit radius
    const adjustedRadius = calculatePlanetOrbitRadius(name, data.orbitRadius);

    // Calculate position
    const position = calculatePlanetPosition(angle, adjustedRadius);
    planet.position.x = position.x;
    planet.position.z = position.z;

    // Rotate planet with fixed increment to prevent jittering
    planet.rotation.y += calculateRotationIncrement(data.rotationPeriod);

    // Update moons if the planet has any
    if (planet.moons) {
      Object.entries(planet.moons).forEach(([moonName, moonObj]) => {
        const moonData = moonObj.data;

        // Calculate safe orbit distance using the utility function
        // Use a larger clearance factor (3.0) for moons to ensure good visibility
        const moonOrbitRadius = calculateSafeOrbitDistance(
          data.radius,
          moonData.orbitRadius,
          3.0
        );

        // Rotate the moon pivot to orbit the planet
        const moonAngle = (time / moonData.daysInYear) * Math.PI * 2;
        moonObj.pivot.rotation.y = moonAngle;

        // Update the moon's position to maintain proper distance
        moonObj.moon.position.set(moonOrbitRadius, 0, 0);

        // Rotate the moon itself
        moonObj.moon.rotation.y += calculateRotationIncrement(
          moonData.rotationPeriod
        );
      });
    }
  });

  // Rotate sun with fixed increment
  sun.rotation.y += calculateRotationIncrement(PLANET_DATA.Sun.rotationPeriod);
}

// Function to update camera position when following a planet or moon
function updateCameraFollow() {
  let targetObject = null;

  // Determine which object to follow
  if (selectedPlanet === "Sun") {
    targetObject = sun;
  } else if (planets[selectedPlanet]) {
    // It's a planet
    targetObject = planets[selectedPlanet];
  } else {
    // It might be a moon - search through all planets' moons
    for (const [planetName, planet] of Object.entries(planets)) {
      if (planet.moons && planet.moons[selectedPlanet]) {
        // Found the moon - get its world position
        const moonObj = planet.moons[selectedPlanet];
        moonObj.moon.updateMatrixWorld(true);

        // We need to work with the moon's actual position in world space
        targetObject = moonObj.moon;
        break;
      }
    }
  }

  if (!targetObject) return; // Safety check

  // For moons, we need to get their world position since they're in a nested hierarchy
  const position = new THREE.Vector3();
  targetObject.getWorldPosition(position);

  // Update the controls target to follow the object
  controls.target.lerp(position, 0.1);

  // Calculate the current offset vector from target to camera
  const offset = new THREE.Vector3().subVectors(
    camera.position,
    controls.target
  );

  // Maintain this relative offset as the target moves
  // This creates a smoother following effect while preserving the user's viewing angle
  const newCameraPosition = position.clone().add(offset);

  // Smoothly move the camera to maintain the same relative position
  camera.position.lerp(newCameraPosition, 0.1);

  // Update controls
  controls.update();
}

// ==================== UI CONTROLS ====================
function initUIControls() {
  // Speed slider
  const speedSlider = document.getElementById("speed-slider");
  speedSlider.addEventListener("input", function () {
    // Directly use the slider value (1-365) for animation speed
    const sliderValue = parseInt(this.value);
    animationSpeed = sliderValue;

    updateSpeedDisplay();

    // Update slider fill
    const percent = ((sliderValue - this.min) / (this.max - this.min)) * 100;
    this.style.setProperty("--slider-fill", `${percent}%`);
  });

  // Play/Pause button
  const playPauseBtn = document.getElementById("play-pause");
  playPauseBtn.addEventListener("click", function () {
    isPlaying = !isPlaying;
    this.innerHTML = isPlaying
      ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3H7V13H5V3ZM9 3H11V13H9V3Z" fill="currentColor"/></svg>PAUSE'
      : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 3L14 8L6 13V3Z" fill="currentColor"/></svg>PLAY';
  });

  // Reset button
  document.getElementById("reset").addEventListener("click", resetView);

  // Current position button
  document
    .getElementById("current-position")
    .addEventListener("click", setCurrentDate);

  // Toggle labels button
  document
    .getElementById("toggle-labels")
    .addEventListener("click", toggleLabels);

  // Date picker
  document.getElementById("set-date").addEventListener("click", setCustomDate);
}

function updateSpeedDisplay() {
  const speedValue = document.getElementById("speed-value");
  const speedNumber = document.getElementById("speed-number");

  // Update the speed number display
  if (speedNumber) {
    speedNumber.textContent = animationSpeed;
  }

  // Update the days/sec text
  speedValue.textContent = "days/sec";
}

function resetView() {
  // Reset camera position
  camera.position.set(0, 50, 150);
  controls.target.set(0, 0, 0);
  controls.update();

  // Reset selection
  resetOrbitHighlights();
  followingPlanet = false;
  selectedPlanet = null;

  // Reset panel header to "SOLAR SYSTEM"
  const panelHeader = document.querySelector("#info-panel .panel-header h2");
  if (panelHeader) {
    panelHeader.textContent = "SOLAR SYSTEM";
  }

  // Hide follow indicator
  const followIndicator = document.getElementById("follow-indicator");
  if (followIndicator) {
    followIndicator.style.display = "none";
  }

  // Use the same function to reset view
  zoomToShowEntireSolarSystem();
}

function setCurrentDate() {
  const now = new Date();
  document.getElementById("date-picker").valueAsDate = now;
  document.getElementById("time-picker").value = `${String(
    now.getHours()
  ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  updateDateDisplay();
}

function setCustomDate() {
  const datePicker = document.getElementById("date-picker");
  const timePicker = document.getElementById("time-picker");

  if (datePicker.value && timePicker.value) {
    const [hours, minutes] = timePicker.value.split(":");
    const date = new Date(datePicker.value);
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    updateDateDisplay(date);
  }
}

function updateDateDisplay(date = new Date()) {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  document.getElementById("date-display").textContent = date
    .toLocaleDateString("en-US", options)
    .toUpperCase();
}

// ==================== EVENT HANDLERS ====================
function initEventListeners() {
  window.addEventListener("resize", onWindowResize);
  renderer.domElement.addEventListener("click", onMouseClick);

  // Add event listener for the info panel minimize button
  const toggleInfoBtn = document.getElementById("toggle-info");
  if (toggleInfoBtn) {
    toggleInfoBtn.addEventListener("click", toggleInfoPanel);
  }

  // Ensure wheel events are properly handled
  renderer.domElement.addEventListener(
    "wheel",
    function (event) {
      event.preventDefault();
    },
    { passive: false }
  );

  // Add double-click to reset view
  renderer.domElement.addEventListener("dblclick", resetView);

  // Add keyboard controls
  window.addEventListener("keydown", function (event) {
    // Press 'R' to reset view
    if (event.key === "r" || event.key === "R") {
      resetView();
    }
    // Press 'A' to toggle auto-rotation
    if (event.key === "a" || event.key === "A") {
      controls.autoRotate = !controls.autoRotate;
    }
    // Press 'Escape' to stop following a planet
    if (event.key === "Escape") {
      if (followingPlanet) {
        followingPlanet = false;
        selectedPlanet = null;
        resetOrbitHighlights(); // Reset orbit highlights when stopping follow
        const followIndicator = document.getElementById("follow-indicator");
        if (followIndicator) {
          followIndicator.style.display = "none";
        }
      }
    }
  });

  // Update current time display
  setInterval(() => {
    const now = new Date();
    document.getElementById("current-time").textContent =
      "CURRENT: " +
      now
        .toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        .toUpperCase();
  }, 1000);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseClick(event) {
  // Check if the click was on a label element or its child
  // If it was, the label's own click handler will handle it
  const clickedElement = event.target;
  if (
    (clickedElement.classList && clickedElement.classList.contains("label")) ||
    (clickedElement.parentElement &&
      clickedElement.parentElement.classList &&
      clickedElement.parentElement.classList.contains("label"))
  ) {
    return; // Exit if clicked on a label
  }

  // Otherwise, process as a normal scene click
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Create a list of all objects that can be clicked
  const allObjects = [sun, ...Object.values(planets)];

  // Add all moons to the clickable objects
  Object.values(planets).forEach((planet) => {
    if (planet.moons) {
      Object.values(planet.moons).forEach((moonObj) => {
        allObjects.push(moonObj.moon);
      });
    }
  });

  const intersects = raycaster.intersectObjects(allObjects);

  if (intersects.length > 0) {
    const selectedObject = intersects[0].object;
    focusOnPlanet(selectedObject);
    updateInfoPanel(selectedObject);
  }
}

function toggleLabels() {
  showLabels = !showLabels;

  // Update all labels visibility
  Object.entries(labels).forEach(([name, label]) => {
    // Check if this is a special label with container (like Uranus)
    if (label.object && label.container) {
      label.object.element.style.display = showLabels ? "block" : "none";
    } else {
      // Regular label
      label.element.style.display = showLabels ? "block" : "none";
    }
  });
}

function focusOnPlanet(object) {
  // Determine if the clicked object is a planet, the sun, or a moon
  let objectName, objectType, parentPlanet;

  if (object === sun) {
    objectName = "Sun";
    objectType = "star";
  } else {
    // Check if it's a planet
    const planetName = Object.keys(planets).find(
      (key) => planets[key] === object
    );
    if (planetName) {
      objectName = planetName;
      objectType = "planet";
    } else {
      // It must be a moon - find which planet it belongs to
      for (const [planetName, planet] of Object.entries(planets)) {
        if (planet.moons) {
          for (const [moonName, moonObj] of Object.entries(planet.moons)) {
            if (moonObj.moon === object) {
              objectName = moonName;
              objectType = "moon";
              parentPlanet = planetName;
              break;
            }
          }
          if (objectType === "moon") break;
        }
      }
    }
  }

  if (!objectName) return; // Object not found

  // Reset all orbit lines to their default appearance
  resetOrbitHighlights();

  // Get the data for the selected object
  let data;
  let targetObject;

  if (objectType === "star") {
    targetObject = sun;
    data = PLANET_DATA.Sun;
    selectedPlanet = "Sun";
  } else if (objectType === "planet") {
    targetObject = planets[objectName];
    data = PLANET_DATA[objectName];
    selectedPlanet = objectName;

    // Highlight this planet's orbit
    highlightOrbit(objectName);
  } else if (objectType === "moon") {
    // For moons, we need to get the world position
    const moonObj = planets[parentPlanet].moons[objectName];
    targetObject = moonObj.moon;

    // Find moon data in the parent planet's data
    const parentData = PLANET_DATA[parentPlanet];
    data = parentData.moons.find((m) => m.name === objectName);

    // Set the selected planet to the moon's name for tracking
    selectedPlanet = objectName;

    // Highlight the parent planet's orbit when a moon is selected
    highlightOrbit(parentPlanet);
  }

  // Set following mode
  followingPlanet = true;

  // Get the object's world position
  const position = new THREE.Vector3();
  targetObject.getWorldPosition(position);

  // Calculate appropriate distance based on the object's size and type
  let distance;
  if (objectType === "star") {
    distance = data.radius * 20;
  } else if (objectType === "planet") {
    distance = data.radius * 15;
  } else if (objectType === "moon") {
    // For moons, use a smaller multiplier since they're usually smaller
    distance = data.radius * 20;
  }

  // Set the controls target to the object
  gsap.to(controls.target, {
    duration: 1,
    x: position.x,
    y: position.y,
    z: position.z,
    ease: "power2.inOut",
  });

  // Move the camera to a good viewing position
  const offset = new THREE.Vector3(distance, distance / 2, distance);
  const targetPosition = position.clone().add(offset);

  gsap.to(camera.position, {
    duration: 1,
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    ease: "power2.inOut",
    onComplete: function () {
      controls.update();
    },
  });

  // Add a "Following: [Object]" indicator to the UI
  const followIndicator =
    document.getElementById("follow-indicator") || createFollowIndicator();
  followIndicator.textContent = `Following: ${objectName}`;
  followIndicator.style.display = "block";
}

// Function to highlight a planet's orbit
function highlightOrbit(planetName) {
  if (orbits[planetName]) {
    // Increase opacity and add glow effect
    gsap.to(orbits[planetName].material, {
      opacity: 1.0,
      duration: 0.5,
    });

    // Make the orbit line slightly wider
    const orbit = orbits[planetName];
    const currentRadius = orbit.geometry.parameters.outerRadius;
    const innerRadius = orbit.geometry.parameters.innerRadius;
    const centerRadius = (innerRadius + currentRadius) / 2;
    const width = currentRadius - innerRadius;

    // Create a new geometry with slightly wider dimensions
    orbit.geometry.dispose();
    orbit.geometry = createOrbitGeometry(centerRadius, width * 0.6, true);
  }
}

// Function to reset all orbit highlights
function resetOrbitHighlights() {
  Object.entries(orbits).forEach(([name, orbit]) => {
    // Reset opacity to default
    gsap.to(orbit.material, {
      opacity: orbit.userData.defaultOpacity,
      duration: 0.5,
    });

    // Reset orbit width
    const currentRadius = orbit.geometry.parameters.outerRadius;
    const innerRadius = orbit.geometry.parameters.innerRadius;
    const centerRadius = (innerRadius + currentRadius) / 2;

    // Create a new geometry with original dimensions
    orbit.geometry.dispose();
    orbit.geometry = createOrbitGeometry(centerRadius, 20, false);
  });
}

// Helper function to create orbit geometry
function createOrbitGeometry(centerRadius, widthFactor, isHighlighted) {
  // For highlighted orbits, we use the width factor directly
  // For regular orbits, we use a fixed width
  const halfWidth = isHighlighted ? widthFactor : widthFactor;

  return new THREE.RingGeometry(
    centerRadius - halfWidth,
    centerRadius + halfWidth,
    128
  );
}

// Create a follow indicator element if it doesn't exist
function createFollowIndicator() {
  const indicator = document.createElement("div");
  indicator.id = "follow-indicator";
  indicator.style.position = "fixed";
  indicator.style.top = "10px";
  indicator.style.right = "10px";
  indicator.style.background = "rgba(0, 0, 0, 0.7)";
  indicator.style.color = "white";
  indicator.style.padding = "8px 12px";
  indicator.style.borderRadius = "4px";
  indicator.style.fontFamily = "Arial, sans-serif";
  indicator.style.zIndex = "1000";

  // Add a stop following button
  const stopButton = document.createElement("button");
  stopButton.textContent = "Stop Following";
  stopButton.style.marginLeft = "10px";
  stopButton.style.padding = "4px 8px";
  stopButton.style.background = "#e74c3c";
  stopButton.style.border = "none";
  stopButton.style.borderRadius = "4px";
  stopButton.style.color = "white";
  stopButton.style.cursor = "pointer";

  stopButton.addEventListener("click", function (e) {
    e.stopPropagation();
    followingPlanet = false;
    selectedPlanet = null;
    indicator.style.display = "none";
  });

  indicator.appendChild(stopButton);
  document.body.appendChild(indicator);
  return indicator;
}

function updateInfoPanel(object) {
  // Determine if the object is a planet, the sun, or a moon
  let objectData, objectName, objectType, parentPlanet;

  if (object === sun) {
    objectName = "Sun";
    objectType = "star";
    objectData = PLANET_DATA.Sun;
  } else {
    // Check if it's a planet
    const planetName = Object.keys(planets).find(
      (key) => planets[key] === object
    );
    if (planetName) {
      objectName = planetName;
      objectType = "planet";
      objectData = PLANET_DATA[planetName];
    } else {
      // It must be a moon - find which planet it belongs to
      for (const [planetName, planet] of Object.entries(planets)) {
        if (planet.moons) {
          for (const [moonName, moonObj] of Object.entries(planet.moons)) {
            if (moonObj.moon === object) {
              objectName = moonName;
              objectType = "moon";
              parentPlanet = planetName;
              objectData = PLANET_DATA[planetName].moons.find(
                (m) => m.name === moonName
              );
              break;
            }
          }
          if (objectType === "moon") break;
        }
      }
    }
  }

  if (!objectData) return; // Object data not found

  // Update the panel header with the object name
  const panelHeader = document.querySelector("#info-panel .panel-header h2");
  if (panelHeader) {
    panelHeader.textContent = objectName.toUpperCase();
  }

  // Update the description
  document.getElementById("selected-planet").textContent =
    objectData.description;

  // Display orbit period
  if (objectData.daysInYear > 0) {
    const orbitPeriodText =
      objectData.daysInYear > 1000
        ? `${(objectData.daysInYear / 365.25).toFixed(
            1
          )} years (${objectData.daysInYear.toFixed(1)} days)`
        : `${objectData.daysInYear.toFixed(1)} days`;
    document.getElementById("orbit-period").textContent = orbitPeriodText;
  } else {
    document.getElementById("orbit-period").textContent = "N/A";
  }

  // Display rotation period
  if (objectData.rotationPeriod < 1) {
    // Convert to hours for fast rotators
    const hours = objectData.rotationPeriod * 24;
    document.getElementById("rotation-period").textContent = `${hours.toFixed(
      1
    )} hours`;
  } else {
    document.getElementById(
      "rotation-period"
    ).textContent = `${objectData.rotationPeriod} days`;
  }

  // Display distance
  if (objectType === "planet") {
    // For planets, show distance from sun in AU
    const distanceAU = (objectData.orbitRadius * ORBITAL_FACTOR) / AU;
    document.getElementById(
      "distance-value"
    ).textContent = `${distanceAU.toFixed(2)} AU`;
  } else if (objectType === "moon") {
    // For moons, show distance from their planet in km
    document.getElementById("distance-value").textContent = `${
      objectData.orbitRadius * 1000
    } km`;
  } else {
    // For the sun
    document.getElementById("distance-value").textContent = "0 AU";
  }
}

function zoomToShowEntireSolarSystem() {
  // Find the farthest planet
  let maxDistance = 0;
  Object.values(PLANET_DATA).forEach((data) => {
    if (data.orbitRadius && data.orbitRadius > maxDistance) {
      maxDistance = data.orbitRadius;
    }
  });

  // Ensure we use at least the minimum orbit display size
  maxDistance = Math.max(maxDistance, MIN_ORBIT_DISPLAY);

  console.log("Max orbit distance:", maxDistance);

  // Set camera position to see all planets
  const viewDistance = maxDistance * 3.5; // Increased to ensure Neptune is visible
  camera.position.set(viewDistance, viewDistance / 2, viewDistance);
  controls.target.set(0, 0, 0);
  controls.update();

  console.log("Camera positioned at:", camera.position);
}

// Add a debug function to check planet positions
function logPlanetPositions() {
  console.log("Sun position:", sun.position);
  Object.entries(planets).forEach(([name, planet]) => {
    console.log(
      `${name} position:`,
      planet.position,
      "Distance from sun:",
      planet.position.length()
    );
  });
}

// Create moons for a planet
function createMoons(planet, planetData) {
  if (!planetData.moons || !planetData.moons.length) return;

  // Create a group to hold all moons for this planet
  const moonSystem = new THREE.Group();
  planet.add(moonSystem);

  // Create each moon
  planetData.moons.forEach((moonData) => {
    // Calculate safe orbit distance using the utility function
    // Use a larger clearance factor (3.0) for moons to ensure good visibility
    const moonOrbitRadius = calculateSafeOrbitDistance(
      planetData.radius,
      moonData.orbitRadius,
      3.0
    );

    // Create a pivot for the moon to orbit around
    const moonPivot = new THREE.Group();
    moonSystem.add(moonPivot);

    // Create the moon
    const moon = createCelestialBody({
      radius: moonData.radius,
      color: moonData.color,
      emissiveIntensity: 0.1,
      x: moonOrbitRadius,
      parent: moonPivot,
      addToScene: false,
    });

    // Store the moon and its pivot for animation
    if (!planet.moons) planet.moons = {};
    planet.moons[moonData.name] = {
      moon: moon,
      pivot: moonPivot,
      data: moonData,
    };

    // Create a label for the moon
    const labelHeight = moonData.radius * 2;
    labels[moonData.name] = createLabel(moonData.name, moon, labelHeight);

    console.log(
      `Moon ${moonData.name} created for ${planetData.name} at distance:`,
      moonOrbitRadius
    );
  });
}

// ==================== UTILITY FUNCTIONS ====================
// Calculate a safe orbital distance that ensures the orbiting object is outside its parent
function calculateSafeOrbitDistance(
  parentRadius,
  desiredOrbitRadius,
  minClearanceFactor = MIN_ORBITAL_CLEARANCE
) {
  const minSafeDistance = parentRadius * minClearanceFactor;
  return Math.max(desiredOrbitRadius, minSafeDistance);
}

// Helper function to calculate planet orbit radius with consistent positioning
function calculatePlanetOrbitRadius(planetName, orbitRadius) {
  // Get the planet index for consistent positioning
  const planetIndex = Object.keys(PLANET_DATA).indexOf(planetName) - 1; // -1 to skip Sun

  // Ensure minimum orbit distance for visibility
  const displayRadius = Math.max(orbitRadius, MIN_ORBIT_DISPLAY);

  // Add a small random offset to each planet's position to prevent overlap
  const randomOffset = planetIndex * 50 + 50;

  return displayRadius + randomOffset;
}

// Helper function to calculate planet position based on time and orbit radius
function calculatePlanetPosition(angle, orbitRadius) {
  return {
    x: Math.cos(angle) * orbitRadius,
    z: Math.sin(angle) * orbitRadius,
  };
}

// Helper function to get planet scale factor based on planet type
function getPlanetScaleFactor(planetName) {
  if (
    planetName === "Jupiter" ||
    planetName === "Saturn" ||
    planetName === "Uranus" ||
    planetName === "Neptune"
  ) {
    // Gas giants get a smaller scale factor
    return 1.5;
  } else {
    // Rocky planets get a larger scale factor for visibility
    return 2.0;
  }
}

// Function to toggle the info panel visibility
function toggleInfoPanel() {
  const infoPanel = document.getElementById("info-panel");
  const panelContent = infoPanel.querySelector(".panel-content");
  const toggleBtn = document.getElementById("toggle-info");

  // Toggle the minimized class
  panelContent.classList.toggle("minimized");

  // Check if panel is now minimized
  const isMinimized = panelContent.classList.contains("minimized");

  if (!isMinimized) {
    // Panel is maximized
    // Change button icon to minimize (horizontal line)
    toggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 8H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    `;
  } else {
    // Panel is minimized
    // Change button icon to maximize (plus sign)
    toggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 8H14M8 2V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    `;
  }
}

// Function to adjust star appearance based on camera distance
function adjustStarOpacity() {
  if (!window.starMaterials) return;

  // Get camera distance from origin (approximate center of solar system)
  const cameraDistance = camera.position.length();

  // Define distance thresholds for different zoom levels
  const closeDistance = 500; // When very close to planets
  const midDistance = 10000; // Normal viewing distance
  const farDistance = MAX_ZOOM_DISTANCE * 0.5; // Far zoom out

  // Define star layer properties
  const starLayers = [
    {
      material: window.starMaterials.far,
      minOpacity: 0.05,
      maxOpacity: 0.4,
      opacityFactor: 0.35,
      minSize: 0.5,
      maxSize: 1.0,
      sizeFactor: 0.5,
    },
    {
      material: window.starMaterials.mid,
      minOpacity: 0.1,
      maxOpacity: 0.5,
      opacityFactor: 0.4,
      minSize: 1.0,
      maxSize: 2.5,
      sizeFactor: 1.5,
    },
    {
      material: window.starMaterials.near,
      minOpacity: 0.15,
      maxOpacity: 0.6,
      opacityFactor: 0.45,
      minSize: 1.5,
      maxSize: 3.5,
      sizeFactor: 2.0,
    },
  ];

  // Calculate interpolation factor based on camera distance
  let t;
  if (cameraDistance < closeDistance) {
    // When very close to planets, use minimum values
    starLayers.forEach((layer) => {
      layer.material.opacity = layer.minOpacity;
      layer.material.size = layer.maxSize;
    });
    return;
  } else if (cameraDistance < midDistance) {
    // Normal viewing distance - linear interpolation between close and mid
    t = (cameraDistance - closeDistance) / (midDistance - closeDistance);

    starLayers.forEach((layer) => {
      layer.material.opacity =
        layer.minOpacity + t * (layer.maxOpacity - layer.minOpacity);
      layer.material.size = layer.maxSize; // Keep default size for normal viewing
    });
  } else {
    // Far zoom out - stars should fade and shrink as we zoom out further
    t = Math.min(
      (cameraDistance - midDistance) / (farDistance - midDistance),
      1
    );

    starLayers.forEach((layer) => {
      // Fade out opacity
      layer.material.opacity = Math.max(
        layer.maxOpacity - t * layer.opacityFactor,
        layer.minOpacity
      );

      // Reduce size
      layer.material.size = Math.max(
        layer.maxSize - t * layer.sizeFactor,
        layer.minSize
      );
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
