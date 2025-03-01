# Solar System Simulation

An interactive 3D web-based simulation of our solar system built with Three.js that allows users to explore and learn about the planets in our solar system. The simulation includes accurate orbital periods, planet sizes (to scale), dynamic lighting, shaders for realistic effects, and interactive controls for time manipulation.

![image](https://github.com/user-attachments/assets/327778f7-3176-45b1-9f47-05567e85ee6b)

## Features

- Fully 3D solar system simulation with accurate orbital periods
- Realistic shaders for the Sun with dynamic noise patterns and glowing effects
- Interactive camera controls (orbit, pan, zoom) for immersive exploration
- Planet selection via sidepanel menu or by clicking directly on planets and their labels
- Camera follow mode to track planets and moons as they orbit
- Time controls with variable simulation speed
- Date and time picker to jump to specific points in time
- Detailed information panel for selected celestial bodies
- Special celestial features (Saturn's rings, Earth's moon, Uranus' axial tilt)
- Beautiful starfield background with parallax effect
- Responsive, modern UI with glass-panel design

## Technologies

- **Three.js** - For 3D rendering and animation
- **CSS2DRenderer** - For HTML/CSS planet labels in 3D space
- **GSAP** - For smooth animations and transitions
- **Custom Shaders** - For realistic Sun surface and glow effects
- **Modern CSS** - With glass morphism effects and responsive design

## Project Structure

```
Solar-System-Simulation/
├── css/
│   └── styles.css       # Main stylesheet with modern glass UI
├── js/
│   └── main.js          # Main JavaScript with Three.js implementation
├── index.html           # Main HTML structure
└── README.md            # Documentation
```

## Setup

1. Clone the repository:

```bash
git clone https://github.com/MrClue/Solar-System-Simulation.git
```

2. Open the project:

```bash
# Using Python
python -m http.server

# Using Node.js with http-server
npx http-server
```

3. Open your browser and navigate to `http://localhost:8000` (or the port provided by your server)

## Controls

- **Planet Selection**:
  - Click on planets or their labels in the 3D scene
  - Use the planet selection menu (top-right corner)
- **Camera Controls**:
  - Drag to orbit around the current view
  - Scroll to zoom in/out
  - Double-click to reset view
  - ESC to exit planet follow mode
- **Time Controls**:
  - Speed Slider: Control simulation speed (1-365 days/second)
  - Play/Pause: Toggle simulation
  - Date/Time Picker: Jump to specific date
  - NOW button: Reset to current date and time
- **Keyboard Shortcuts**:
  - R: Reset view
  - A: Toggle auto-rotation
  - ESC: Stop following planets

## Technical Details

### 3D Implementation

- Uses **Three.js** for 3D rendering and scene management
- Implements **OrbitControls** for smooth camera manipulation
- Uses **CSS2DRenderer** for planet labels that always face the camera
- Custom shader materials for the Sun with:
  - Dynamic noise patterns for surface details
  - Multiple glow layers for realistic corona effect
  - Bright emission for proper illumination

### Planetary Data

The simulation includes accurate data for:

- Orbital periods and distances (scaled)
- Relative planet sizes and colors
- Rotation periods and axial tilts
- Special features (rings, moons)

## Browser Compatibility

The simulation works best in modern browsers with WebGL support:

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

Feel free to submit issues and enhancement requests!
