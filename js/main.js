// ==================== THREE.JS SETUP ====================
let scene, camera, renderer, labelRenderer, controls;
let sun,
  planets = {},
  orbits = {},
  labels = {};
let raycaster, mouse;
let showLabels = true;
let animationSpeed = 1.0;
let isPlaying = true;
let selectedPlanet = null; // Track the currently selected planet
let followingPlanet = false; // Whether camera is following a planet

// ==================== CONSTANTS ====================
const ORBITAL_FACTOR = 10000; // Spread planets out
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

function createSun() {
  const sunGeometry = new THREE.SphereGeometry(PLANET_DATA.Sun.radius, 64, 64);
  const sunMaterial = new THREE.MeshPhongMaterial({
    color: PLANET_DATA.Sun.color,
    emissive: PLANET_DATA.Sun.emissive,
    emissiveIntensity: 1.0, // Increased for better visibility
  });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  // Create a simpler sun glow that won't cause animation issues
  createSimpleSunGlow();
}

function createSimpleSunGlow() {
  // Create a simple glow using a sphere with additive blending
  const glowGeometry = new THREE.SphereGeometry(
    PLANET_DATA.Sun.radius * 1.5, // Increased glow size relative to sun
    32,
    32
  );

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xfdb813,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  sun.add(glow);
}

function createPlanets() {
  Object.entries(PLANET_DATA).forEach(([name, data]) => {
    if (name === "Sun") return;

    // Scale planets for visibility but ensure they're smaller than the sun
    // Use a scaling factor based on planet type
    let scaleFactor;
    if (
      name === "Jupiter" ||
      name === "Saturn" ||
      name === "Uranus" ||
      name === "Neptune"
    ) {
      // Gas giants get a smaller scale factor
      scaleFactor = 1.5;
    } else {
      // Rocky planets get a larger scale factor for visibility
      scaleFactor = 2.0;
    }

    const scaledRadius = data.radius * scaleFactor;
    const geometry = new THREE.SphereGeometry(scaledRadius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: data.color,
      emissive: data.color,
      emissiveIntensity: 0.2, // Reduced for more realistic appearance
      shininess: 30,
    });
    const planet = new THREE.Mesh(geometry, material);

    // Position planet - use fixed angles for initial positions to ensure they're spread out
    const planetIndex = Object.keys(PLANET_DATA).indexOf(name) - 1; // -1 to skip Sun
    const angle =
      (planetIndex / (Object.keys(PLANET_DATA).length - 1)) * Math.PI * 2;

    // Ensure minimum orbit distance for visibility and to prevent orbiting inside sun
    const displayRadius = Math.max(data.orbitRadius, MIN_ORBIT_DISPLAY);

    // Add a small random offset to each planet's position to prevent overlap
    const randomOffset = planetIndex * 50 + 50;
    const adjustedRadius = displayRadius + randomOffset;

    planet.position.x = Math.cos(angle) * adjustedRadius;
    planet.position.z = Math.sin(angle) * adjustedRadius;

    // Add rings for Saturn
    if (name === "Saturn") {
      const rings = createSaturnRings(data.rings);
      planet.add(rings);
    }

    // Add tilt for Uranus (97.77 degrees)
    if (name === "Uranus") {
      planet.rotation.z = THREE.MathUtils.degToRad(97.77);
    }

    scene.add(planet);
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

    // Get the planet index for consistent positioning
    const planetIndex = Object.keys(PLANET_DATA).indexOf(name) - 1; // -1 to skip Sun
    const randomOffset = planetIndex * 50 + 50;

    // Ensure minimum orbit size for visibility
    const displayRadius = Math.max(data.orbitRadius, MIN_ORBIT_DISPLAY);
    const adjustedRadius = displayRadius + randomOffset;

    const orbitGeometry = new THREE.RingGeometry(
      adjustedRadius - 20, // Wider orbit line (increased from 10 to 20)
      adjustedRadius + 20, // Wider orbit line (increased from 10 to 20)
      128
    );
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

function createLabels() {
  Object.entries(PLANET_DATA).forEach(([name, data]) => {
    const label = document.createElement("div");
    label.className = "label";
    label.textContent = name;
    label.style.display = showLabels ? "block" : "none";

    const labelObject = new THREE.CSS2DObject(label);

    // Position labels above objects with appropriate scaling
    const labelHeight = name === "Sun" ? data.radius * 2 : data.radius * 4;

    // For Uranus, create a special handling due to its axial tilt
    if (name === "Uranus") {
      // Create a non-rotating container for the label that will follow the planet
      const labelContainer = new THREE.Object3D();
      scene.add(labelContainer);

      // Store the planet reference for updating the container position
      labelContainer.userData = { planetName: name };

      // Position the label above the planet
      labelObject.position.set(0, labelHeight, 0);
      labelContainer.add(labelObject);

      // Store the label container for updates
      labels[name] = {
        object: labelObject,
        container: labelContainer,
      };
    } else {
      // Standard label positioning for other planets
      labelObject.position.set(0, labelHeight, 0);

      if (name === "Sun") {
        sun.add(labelObject);
      } else {
        planets[name].add(labelObject);
      }

      labels[name] = labelObject;
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
  // Add ambient light for overall scene brightness
  const ambientLight = new THREE.AmbientLight(0x777777, 1.0);
  scene.add(ambientLight);

  // Add directional light to simulate sunlight
  const sunLight = new THREE.PointLight(0xffffff, 2.0, 0, 1);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // Add a hemisphere light for better planet visibility
  const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
  scene.add(hemisphereLight);
}

function createStarfield() {
  // Create a much larger starfield with more stars and better distribution

  // First layer - distant stars (small and numerous)
  const farStarGeometry = new THREE.BufferGeometry();
  const farStarMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2.0,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: false, // No size attenuation for distant stars
  });

  const farStarVertices = [];
  for (let i = 0; i < 100000; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = STARFIELD_SIZE * 0.8 + Math.random() * STARFIELD_SIZE * 0.2;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    farStarVertices.push(x, y, z);
  }

  farStarGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(farStarVertices, 3)
  );
  const farStars = new THREE.Points(farStarGeometry, farStarMaterial);
  scene.add(farStars);

  // Second layer - mid-distance stars (medium size, with attenuation)
  const midStarGeometry = new THREE.BufferGeometry();
  const midStarMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 4.0,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });

  const midStarVertices = [];
  for (let i = 0; i < 50000; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = STARFIELD_SIZE * 0.4 + Math.random() * STARFIELD_SIZE * 0.3;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    midStarVertices.push(x, y, z);
  }

  midStarGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(midStarVertices, 3)
  );
  const midStars = new THREE.Points(midStarGeometry, midStarMaterial);
  scene.add(midStars);

  // Third layer - nearby stars (larger, with attenuation)
  const nearStarGeometry = new THREE.BufferGeometry();
  const nearStarMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 6.0,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
  });

  const nearStarVertices = [];
  for (let i = 0; i < 10000; i++) {
    // More uniform distribution for nearby stars
    const x = (Math.random() - 0.5) * STARFIELD_SIZE * 0.5;
    const y = (Math.random() - 0.5) * STARFIELD_SIZE * 0.5;
    const z = (Math.random() - 0.5) * STARFIELD_SIZE * 0.5;

    nearStarVertices.push(x, y, z);
  }

  nearStarGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(nearStarVertices, 3)
  );
  const nearStars = new THREE.Points(nearStarGeometry, nearStarMaterial);
  scene.add(nearStars);
}

// ==================== ANIMATION ====================
function animate() {
  requestAnimationFrame(animate);
  if (isPlaying) {
    updatePlanetPositions();
  }

  // Update camera position if following a planet
  if (followingPlanet && selectedPlanet) {
    updateCameraFollow();
  }

  // Update Uranus label position
  updateUranusLabel();

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

function updatePlanetPositions() {
  // Use a fixed time increment to prevent jittering
  const timeIncrement = 0.01 * animationSpeed;
  window.currentSimTime = (window.currentSimTime || 0) + timeIncrement;
  const time = window.currentSimTime;

  Object.entries(planets).forEach(([name, planet]) => {
    const data = PLANET_DATA[name];
    const angle = (time / data.daysInYear) * Math.PI * 2;

    // Ensure minimum orbit distance for visibility and to prevent orbiting inside sun
    const displayRadius = Math.max(data.orbitRadius, MIN_ORBIT_DISPLAY);

    // Get the planet index for consistent positioning
    const planetIndex = Object.keys(PLANET_DATA).indexOf(name) - 1; // -1 to skip Sun
    const randomOffset = planetIndex * 50 + 50;
    const adjustedRadius = displayRadius + randomOffset;

    // Use precise positioning to prevent jittering
    planet.position.x = Math.cos(angle) * adjustedRadius;
    planet.position.z = Math.sin(angle) * adjustedRadius;

    // Rotate planet with fixed increment to prevent jittering
    planet.rotation.y += (Math.PI * 2) / (data.rotationPeriod * 1000);

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
        moonObj.moon.rotation.y +=
          (Math.PI * 2) / (moonData.rotationPeriod * 1000);
      });
    }
  });

  // Rotate sun with fixed increment
  sun.rotation.y += (Math.PI * 2) / (PLANET_DATA.Sun.rotationPeriod * 1000);
}

// Function to update camera position when following a planet
function updateCameraFollow() {
  const planet = selectedPlanet === "Sun" ? sun : planets[selectedPlanet];
  if (!planet) return;

  const position = planet.position.clone();

  // Only update the controls target to follow the planet
  // This allows the user to still zoom and pan while following
  controls.target.lerp(position, 0.1);

  // We don't automatically move the camera position anymore
  // This allows the user to maintain their relative position while the target updates
}

// ==================== UI CONTROLS ====================
function initUIControls() {
  // Speed slider
  const speedSlider = document.getElementById("speed-slider");
  speedSlider.addEventListener("input", function () {
    const value = parseFloat(this.value);
    animationSpeed = 1 + (365.25 - 1) * (value / 100);
    updateSpeedDisplay();

    // Update slider fill
    const percent = ((value - this.min) / (this.max - this.min)) * 100;
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
  if (animationSpeed >= 365) {
    speedValue.textContent = `${(animationSpeed / 365.25).toFixed(
      1
    )} years/sec`;
  } else {
    speedValue.textContent = `${animationSpeed.toFixed(1)} days/sec`;
  }
}

function resetView() {
  // Reset orbit highlights
  resetOrbitHighlights();

  // Reset following state
  followingPlanet = false;
  selectedPlanet = null;

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

  // Get the position of the object
  let position;
  let data;

  if (objectType === "star") {
    position = sun.position.clone();
    data = PLANET_DATA.Sun;
    selectedPlanet = "Sun";
  } else if (objectType === "planet") {
    position = planets[objectName].position.clone();
    data = PLANET_DATA[objectName];
    selectedPlanet = objectName;

    // Highlight this planet's orbit
    highlightOrbit(objectName);
  } else if (objectType === "moon") {
    // For moons, we need to get the world position
    const moonObj = planets[parentPlanet].moons[objectName];
    moonObj.moon.updateMatrixWorld();
    position = new THREE.Vector3();
    position.setFromMatrixPosition(moonObj.moon.matrixWorld);
    data = PLANET_DATA[parentPlanet].moons.find((m) => m.name === objectName);
    selectedPlanet = objectName;

    // Highlight the parent planet's orbit when a moon is selected
    highlightOrbit(parentPlanet);
  }

  // Set following mode
  followingPlanet = true;

  // Calculate appropriate distance based on the object's size
  const distance = objectType === "star" ? data.radius * 20 : data.radius * 15;

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
    orbit.geometry = new THREE.RingGeometry(
      centerRadius - width * 0.6,
      centerRadius + width * 0.6,
      128
    );
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
    orbit.geometry = new THREE.RingGeometry(
      centerRadius - 20,
      centerRadius + 20,
      128
    );
  });
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
    const moonGeometry = new THREE.SphereGeometry(moonData.radius, 32, 32);
    const moonMaterial = new THREE.MeshPhongMaterial({
      color: moonData.color,
      emissive: moonData.color,
      emissiveIntensity: 0.1,
      shininess: 30,
    });

    const moon = new THREE.Mesh(moonGeometry, moonMaterial);

    // Calculate safe orbit distance using the utility function
    // Use a larger clearance factor (3.0) for moons to ensure good visibility
    const moonOrbitRadius = calculateSafeOrbitDistance(
      planetData.radius,
      moonData.orbitRadius,
      3.0
    );

    // Initial position
    moon.position.set(moonOrbitRadius, 0, 0);

    // Create a pivot for the moon to orbit around
    const moonPivot = new THREE.Group();
    moonSystem.add(moonPivot);
    moonPivot.add(moon);

    // Store the moon and its pivot for animation
    if (!planet.moons) planet.moons = {};
    planet.moons[moonData.name] = {
      moon: moon,
      pivot: moonPivot,
      data: moonData,
    };

    // Create a label for the moon
    const moonLabel = document.createElement("div");
    moonLabel.className = "label";
    moonLabel.textContent = moonData.name;
    moonLabel.style.display = showLabels ? "block" : "none";

    const moonLabelObject = new THREE.CSS2DObject(moonLabel);
    moonLabelObject.position.set(0, moonData.radius * 2, 0);
    moon.add(moonLabelObject);

    // Add the label to the global labels object
    labels[moonData.name] = moonLabelObject;

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

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
