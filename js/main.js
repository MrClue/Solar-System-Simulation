// Canvas setup
const canvas = document.getElementById("solarSystem");
const ctx = canvas.getContext("2d");

// Create UI containers
const labelsContainer = document.createElement("div");
labelsContainer.style.position = "absolute";
labelsContainer.style.top = "0";
labelsContainer.style.left = "0";
labelsContainer.style.width = "100%";
labelsContainer.style.height = "100%";
labelsContainer.style.pointerEvents = "none";
document.getElementById("canvas-container").appendChild(labelsContainer);

// Create distance indicator elements
const distanceLine = document.createElement("canvas");
distanceLine.style.position = "absolute";
distanceLine.style.top = "0";
distanceLine.style.left = "0";
distanceLine.style.width = "100%";
distanceLine.style.height = "100%";
distanceLine.style.pointerEvents = "none";
document
  .getElementById("canvas-container")
  .insertBefore(distanceLine, labelsContainer);
const distanceCtx = distanceLine.getContext("2d");

const distanceInfo = document.createElement("div");
distanceInfo.className = "distance-info";
distanceInfo.style.display = "none";
labelsContainer.appendChild(distanceInfo);

// Set canvas dimensions
function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  distanceLine.width = canvas.width;
  distanceLine.height = canvas.height;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Solar system constants
const SUN_RADIUS = 50;
const EARTH_RADIUS = 15;
const EARTH_ORBIT_RADIUS = 200;
const MOON_RADIUS = 5;
const MOON_ORBIT_RADIUS = 30;
const VENUS_RADIUS = 14;
const VENUS_ORBIT_RADIUS = 150;
const MERCURY_RADIUS = 10;
const MERCURY_ORBIT_RADIUS = 100;
const MARS_RADIUS = 12;
const MARS_ORBIT_RADIUS = 250;
const JUPITER_RADIUS = 30;
const JUPITER_ORBIT_RADIUS = 350;
const SATURN_RADIUS = 25;
const SATURN_ORBIT_RADIUS = 450;
const SATURN_RING_SIZE = 15;

// Planetary data
const planets = [
  {
    name: "Sun",
    radius: SUN_RADIUS,
    color: "#FDB813",
    orbitRadius: 0,
    daysInYear: 0,
    rotationPeriod: 25, // days
    description: "The Sun is the star at the center of our Solar System.",
  },
  {
    name: "Mercury",
    radius: MERCURY_RADIUS,
    color: "#A37B7B",
    orbitRadius: MERCURY_ORBIT_RADIUS,
    daysInYear: 88,
    rotationPeriod: 59, // days
    description:
      "Mercury is the smallest and innermost planet in the Solar System.",
  },
  {
    name: "Venus",
    radius: VENUS_RADIUS,
    color: "#E2B15B",
    orbitRadius: VENUS_ORBIT_RADIUS,
    daysInYear: 225,
    rotationPeriod: 243, // days
    description:
      "Venus is the second planet from the Sun and the hottest in our Solar System.",
  },
  {
    name: "Earth",
    radius: EARTH_RADIUS,
    color: "#4BA8FF",
    orbitRadius: EARTH_ORBIT_RADIUS,
    daysInYear: 365.25, // More accurate for date calculations
    rotationPeriod: 1, // days
    description:
      "Earth is the third planet from the Sun and the only known planet to harbor life.",
  },
  {
    name: "Mars",
    radius: MARS_RADIUS,
    color: "#E27B58",
    orbitRadius: MARS_ORBIT_RADIUS,
    daysInYear: 687,
    rotationPeriod: 1.03, // days
    description:
      "Mars is the fourth planet from the Sun and is known as the Red Planet.",
  },
  {
    name: "Jupiter",
    radius: JUPITER_RADIUS,
    color: "#E1CAA7",
    orbitRadius: JUPITER_ORBIT_RADIUS,
    daysInYear: 4333,
    rotationPeriod: 0.41, // days
    description:
      "Jupiter is the largest planet in our Solar System and a gas giant.",
  },
  {
    name: "Saturn",
    radius: SATURN_RADIUS,
    color: "#F5E0B5",
    orbitRadius: SATURN_ORBIT_RADIUS,
    daysInYear: 10759,
    rotationPeriod: 0.45, // days
    description:
      "Saturn is the sixth planet from the Sun and is known for its prominent ring system.",
  },
];

// Date reference constants
const REFERENCE_DATE = new Date("2000-01-01T00:00:00"); // J2000 epoch as reference
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Animation variables
let currentSimDate = new Date(); // Default to current date
let animationSpeed = 1 / 60; // days per frame
let isPlaying = true;

// Camera/view variables
let cameraX = 0;
let cameraY = 0;
let zoom = 1;
const minZoom = 0.3;
const maxZoom = 3;
let selectedPlanet = null;
let followingPlanet = null;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Control elements
const datePicker = document.getElementById("date-picker");
const timePicker = document.getElementById("time-picker");
const setDateButton = document.getElementById("set-date");
const currentPositionButton = document.getElementById("current-position");
const dateDisplay = document.getElementById("date-display");
const currentTimeDisplay = document.getElementById("current-time");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const playPauseButton = document.getElementById("play-pause");
const resetButton = document.getElementById("reset");
const selectedPlanetInfo = document.getElementById("selected-planet");

// Initialize date picker to current date
function initDatePicker() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  datePicker.value = `${year}-${month}-${day}`;
  timePicker.value = `${hours}:${minutes}`;

  // Set initial simulation date to now
  currentSimDate = now;
  updateDateDisplay();
}

// Convert date to days since reference date
function dateToDays(date) {
  return (date - REFERENCE_DATE) / MS_PER_DAY;
}

// Format date for display
function formatDate(date) {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("en-US", options);
}

// Update the date display
function updateDateDisplay() {
  dateDisplay.textContent = formatDate(currentSimDate);
}

// Convert polar coordinates to Cartesian
function polarToCartesian(radius, angle) {
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
}

// Calculate planet positions
function calculatePlanetPosition(planet, date) {
  if (planet.name === "Sun") {
    return { x: 0, y: 0 };
  }

  // Calculate days since reference date
  const days = dateToDays(date);

  // Calculate angle based on days in year
  const angle = (2 * Math.PI * days) / planet.daysInYear;
  return polarToCartesian(planet.orbitRadius, angle);
}

// Calculate point on circle edge given center and radius
function getPointOnCircleEdge(centerX, centerY, radius, angle) {
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

// Draw a planet
function drawPlanet(planet, date) {
  const position = calculatePlanetPosition(planet, date);

  // Apply camera transformations
  const drawX = position.x * zoom + cameraX;
  const drawY = position.y * zoom + cameraY;
  const drawRadius = planet.radius * zoom;

  // Update planet label position
  const label = document.getElementById(`label-${planet.name.toLowerCase()}`);
  if (label) {
    label.style.left = `${drawX}px`;
    label.style.top = `${drawY - drawRadius - 20}px`;
    label.className = `planet-label${
      selectedPlanet && planet.name === selectedPlanet.name ? " selected" : ""
    }`;
  }

  // Draw orbit path (except for the Sun)
  if (planet.name !== "Sun") {
    ctx.beginPath();
    ctx.arc(cameraX, cameraY, planet.orbitRadius * zoom, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.stroke();
  }

  // Draw the planet
  ctx.beginPath();
  ctx.arc(drawX, drawY, drawRadius, 0, 2 * Math.PI);

  // Special case for Sun - add glow
  if (planet.name === "Sun") {
    const glow = ctx.createRadialGradient(
      drawX,
      drawY,
      drawRadius * 0.8,
      drawX,
      drawY,
      drawRadius * 2
    );
    glow.addColorStop(0, planet.color);
    glow.addColorStop(1, "rgba(253, 184, 19, 0)");

    ctx.fillStyle = planet.color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(drawX, drawY, drawRadius * 2, 0, 2 * Math.PI);
    ctx.fillStyle = glow;
    ctx.fill();
  }
  // Special case for Saturn - add rings
  else if (planet.name === "Saturn") {
    ctx.fillStyle = planet.color;
    ctx.fill();

    // Draw rings
    ctx.beginPath();
    ctx.ellipse(
      drawX,
      drawY,
      drawRadius + SATURN_RING_SIZE * zoom,
      (drawRadius + SATURN_RING_SIZE * zoom) * 0.3,
      Math.PI / 6,
      0,
      2 * Math.PI
    );
    ctx.strokeStyle = "rgba(231, 224, 181, 0.8)";
    ctx.lineWidth = 4 * zoom;
    ctx.stroke();
  }
  // Earth - add atmosphere effect
  else if (planet.name === "Earth") {
    const atmosphere = ctx.createRadialGradient(
      drawX,
      drawY,
      drawRadius * 0.9,
      drawX,
      drawY,
      drawRadius * 1.1
    );
    atmosphere.addColorStop(0, planet.color);
    atmosphere.addColorStop(1, "rgba(75, 168, 255, 0)");

    ctx.fillStyle = planet.color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(drawX, drawY, drawRadius * 1.1, 0, 2 * Math.PI);
    ctx.fillStyle = atmosphere;
    ctx.fill();

    // Calculate moon position based on the date
    // Moon orbits Earth every 27.3 days
    const moonDays = dateToDays(date);
    const moonAngle = (2 * Math.PI * moonDays) / 27.3;
    const moonPos = {
      x: drawX + MOON_ORBIT_RADIUS * zoom * Math.cos(moonAngle),
      y: drawY + MOON_ORBIT_RADIUS * zoom * Math.sin(moonAngle),
    };

    ctx.beginPath();
    ctx.arc(moonPos.x, moonPos.y, MOON_RADIUS * zoom, 0, 2 * Math.PI);
    ctx.fillStyle = "#CCC";
    ctx.fill();
  }
  // All other planets
  else {
    ctx.fillStyle = planet.color;
    ctx.fill();
  }

  // Highlight selected planet
  if (selectedPlanet && planet.name === selectedPlanet.name) {
    ctx.beginPath();
    ctx.arc(drawX, drawY, drawRadius + 5, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw distance line if this is the selected planet
  if (
    selectedPlanet &&
    planet.name === selectedPlanet.name &&
    planet.name !== "Sun"
  ) {
    const sunPos = calculatePlanetPosition(planets[0], date);
    const sunX = sunPos.x * zoom + cameraX;
    const sunY = sunPos.y * zoom + cameraY;
    const sunRadius = planets[0].radius * zoom;

    // Calculate angle between sun and planet
    const angle = Math.atan2(drawY - sunY, drawX - sunX);

    // Get points on the edges of both bodies
    const planetEdgePoint = getPointOnCircleEdge(
      drawX,
      drawY,
      drawRadius,
      angle + Math.PI
    );
    const sunEdgePoint = getPointOnCircleEdge(sunX, sunY, sunRadius, angle);

    // Clear previous line
    distanceCtx.clearRect(0, 0, distanceLine.width, distanceLine.height);

    // Draw dotted line
    distanceCtx.beginPath();
    distanceCtx.setLineDash([5, 5]);
    distanceCtx.moveTo(sunEdgePoint.x, sunEdgePoint.y);
    distanceCtx.lineTo(planetEdgePoint.x, planetEdgePoint.y);
    distanceCtx.strokeStyle = "rgba(79, 195, 247, 0.6)";
    distanceCtx.lineWidth = 2;
    distanceCtx.stroke();
    distanceCtx.setLineDash([]);

    // Calculate and display distance
    const distance = Math.sqrt(
      Math.pow(position.x - sunPos.x, 2) + Math.pow(position.y - sunPos.y, 2)
    );

    // Position distance info at middle of line
    const midX = (sunEdgePoint.x + planetEdgePoint.x) / 2;
    const midY = (sunEdgePoint.y + planetEdgePoint.y) / 2;

    distanceInfo.style.display = "block";
    distanceInfo.style.left = `${midX}px`;
    distanceInfo.style.top = `${midY}px`;
    distanceInfo.textContent = `Distance: ${(
      distance / EARTH_ORBIT_RADIUS
    ).toFixed(2)} AU`;
  }

  // Store drawn position and radius for click detection
  planet.drawnX = drawX;
  planet.drawnY = drawY;
  planet.drawnRadius = drawRadius;

  // Return position for camera follow
  return { x: drawX, y: drawY };
}

// Draw stars background
const stars = [];
function initStars() {
  stars.length = 0;
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5,
      opacity: Math.random() * 0.8 + 0.2,
    });
  }
}

function drawStars() {
  stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.fill();
  });
}

// Main draw function
function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  distanceCtx.clearRect(0, 0, distanceLine.width, distanceLine.height);

  // Calculate center point of canvas
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // If not following a planet, use center as camera position
  if (!followingPlanet) {
    cameraX = centerX;
    cameraY = centerY;
  }

  // Draw stars background
  drawStars();

  // Draw all planets
  planets.forEach((planet) => {
    const position = drawPlanet(planet, currentSimDate);

    // If following this planet, update camera position
    if (followingPlanet && planet.name === followingPlanet.name) {
      cameraX = centerX - (position.x - cameraX);
      cameraY = centerY - (position.y - cameraY);
    }
  });

  // Update date display
  updateDateDisplay();

  // Hide distance info if no planet is selected
  if (!selectedPlanet) {
    distanceInfo.style.display = "none";
  }

  // Update animation
  if (isPlaying) {
    // Advance time based on animation speed
    currentSimDate = new Date(
      currentSimDate.getTime() + animationSpeed * MS_PER_DAY
    );
    requestAnimationFrame(draw);
  }
}

// Set date from picker
function setDateFromPicker() {
  const dateValue = datePicker.value;
  const timeValue = timePicker.value;

  if (dateValue && timeValue) {
    const [hours, minutes] = timeValue.split(":");
    const newDate = new Date(dateValue);
    newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    currentSimDate = newDate;
    updateDateDisplay();

    if (!isPlaying) {
      draw();
    }
  }
}

// Initialize animation
function init() {
  // Initialize dates
  initDatePicker();

  // Initialize stars
  initStars();

  // Create planet labels
  planets.forEach((planet) => {
    const label = document.createElement("div");
    label.className = "planet-label";
    label.textContent = planet.name;
    label.id = `label-${planet.name.toLowerCase()}`;
    labelsContainer.appendChild(label);
  });

  // Center the view
  cameraX = canvas.width / 2;
  cameraY = canvas.height / 2;

  // Set up event listeners
  setDateButton.addEventListener("click", setDateFromPicker);

  currentPositionButton.addEventListener("click", function () {
    currentSimDate = new Date();
    datePicker.valueAsDate = currentSimDate;

    const hours = String(currentSimDate.getHours()).padStart(2, "0");
    const minutes = String(currentSimDate.getMinutes()).padStart(2, "0");
    timePicker.value = `${hours}:${minutes}`;

    updateDateDisplay();

    if (!isPlaying) {
      draw();
    }
  });

  speedSlider.addEventListener("input", function () {
    // Convert slider value (0-100) to range of 1 to 365.25 days per second
    const daysPerSecond = 1 + (365.25 - 1) * (parseFloat(this.value) / 100);
    // Convert days per second to days per frame (assuming 60fps)
    animationSpeed = daysPerSecond / 60;

    // Display speed in a readable format
    if (daysPerSecond >= 365) {
      speedValue.textContent = `${(daysPerSecond / 365.25).toFixed(
        1
      )} years/sec`;
    } else {
      speedValue.textContent = `${daysPerSecond.toFixed(1)} days/sec`;
    }
  });

  playPauseButton.addEventListener("click", function () {
    isPlaying = !isPlaying;
    this.textContent = isPlaying ? "Pause" : "Play";

    if (isPlaying) {
      requestAnimationFrame(draw);
    }
  });

  resetButton.addEventListener("click", function () {
    cameraX = canvas.width / 2;
    cameraY = canvas.height / 2;
    zoom = 1;
    followingPlanet = null;
    selectedPlanet = null;
    selectedPlanetInfo.textContent = "Select a planet to see details";
    distanceInfo.style.display = "none";
    distanceCtx.clearRect(0, 0, distanceLine.width, distanceLine.height);

    if (!isPlaying) {
      draw();
    }
  });

  // Click to select a planet
  canvas.addEventListener("click", function (event) {
    if (isDragging) {
      isDragging = false;
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Clear previous selection first
    selectedPlanet = null;
    followingPlanet = null;
    distanceInfo.style.display = "none";
    distanceCtx.clearRect(0, 0, distanceLine.width, distanceLine.height);

    // Check if a planet was clicked
    for (let i = planets.length - 1; i >= 0; i--) {
      const planet = planets[i];
      if (!planet.drawnX) continue;

      const distance = Math.sqrt(
        Math.pow(clickX - planet.drawnX, 2) +
          Math.pow(clickY - planet.drawnY, 2)
      );

      if (distance <= planet.drawnRadius) {
        selectedPlanet = planet;
        followingPlanet = planet;
        selectedPlanetInfo.innerHTML = `<strong>${planet.name}</strong><br>${
          planet.description
        }<br>
          Orbit period: ${planet.daysInYear.toFixed(1)} days<br>
          Rotation period: ${planet.rotationPeriod} days`;

        // Force an immediate camera update and redraw
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const position = calculatePlanetPosition(planet, currentSimDate);
        const drawX = position.x * zoom + cameraX;
        const drawY = position.y * zoom + cameraY;
        cameraX = centerX - (drawX - cameraX);
        cameraY = centerY - (drawY - cameraY);

        // Always trigger a redraw when selecting a planet
        draw();
        return;
      }
    }

    // If no planet was clicked, update the info panel
    selectedPlanetInfo.textContent = "Select a planet to see details";
    // Center the view when no planet is selected
    cameraX = canvas.width / 2;
    cameraY = canvas.height / 2;
    draw();
  });

  // Zoom with mouse wheel
  canvas.addEventListener("wheel", function (event) {
    event.preventDefault();
    const zoomAmount = event.deltaY * -0.001;
    zoom = Math.min(maxZoom, Math.max(minZoom, zoom + zoomAmount));

    if (!isPlaying) {
      draw();
    }
  });

  // Drag to pan
  canvas.addEventListener("mousedown", function (event) {
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  });

  canvas.addEventListener("mousemove", function (event) {
    if (isDragging) {
      const deltaX = event.clientX - lastMouseX;
      const deltaY = event.clientY - lastMouseY;

      if (followingPlanet) {
        followingPlanet = null; // Stop following planet when manually panning
      } else {
        cameraX += deltaX;
        cameraY += deltaY;
      }

      lastMouseX = event.clientX;
      lastMouseY = event.clientY;

      if (!isPlaying) {
        draw();
      }
    }
  });

  canvas.addEventListener("mouseup", function () {
    isDragging = false;
  });

  canvas.addEventListener("mouseleave", function () {
    isDragging = false;
  });

  // Real-time clock update
  setInterval(function () {
    const now = new Date();
    currentTimeDisplay.textContent = `Current: ${formatDate(now)}`;
  }, 1000);

  // Start animation
  requestAnimationFrame(draw);
}

// Remove the duplicate initialization code from the end of the file
document.addEventListener("DOMContentLoaded", init);
