# Solar System Simulation

An interactive web-based simulation of our solar system that allows users to explore and learn about the planets in our solar system. The simulation includes accurate orbital periods, planet sizes (to scale), and interactive controls for time manipulation.

## Features

- Real-time solar system simulation with accurate orbital periods
- Interactive controls for time manipulation (speed up/slow down time)
- Date and time picker to jump to specific points in time
- Zoom and pan controls for better exploration
- Planet selection with detailed information
- Realistic planet rendering with special effects (Sun glow, Saturn's rings, Earth's atmosphere)
- Beautiful starry background
- Responsive design that works on all screen sizes

## Project Structure

```
Solar-System-Simulation/
├── css/
│   └── styles.css       # Main stylesheet
├── js/
│   └── main.js         # Main JavaScript file with simulation logic
├── index.html          # Main HTML file
└── README.md          # Documentation
```

## Setup

1. Clone the repository:

```bash
git clone https://github.com/MrClue/Solar-System-Simulation.git
```

2. Open the project:

- Simply open `index.html` in a modern web browser
- Alternatively, use a local development server:
  ```bash
  python -m http.server
  # or
  php -S localhost:8000
  ```

## Controls

- **Speed Slider**: Control the simulation speed (1-365.25 days/second)
- **Date/Time Picker**: Jump to specific dates and times
- **Play/Pause**: Control simulation playback
- **Reset View**: Reset camera position and zoom
- **Current Position**: Jump to current date and time
- **Mouse Controls**:
  - Click on planets to select and focus
  - Scroll to zoom in/out
  - Drag to pan the view

## Technical Details

### Planetary Data

The simulation includes accurate data for:

- Orbital periods
- Relative planet sizes
- Planet colors and appearances
- Special effects (Sun's glow, Saturn's rings, Earth's atmosphere and moon)

### Implementation Details

- Uses HTML5 Canvas for rendering
- Implements smooth camera controls with zoom and pan
- Real-time date calculations based on J2000 epoch
- Efficient star background rendering
- Responsive design for all screen sizes

## Browser Compatibility

The simulation works best in modern browsers that support HTML5 Canvas and modern JavaScript features:

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

Feel free to submit issues and enhancement requests!
