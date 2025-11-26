import Zdog from 'zdog';

export class StarSystemEngine {
  constructor(canvasId, planets) {
    this.TAU = Zdog.TAU;
    this.planets = planets;
    this.isSpinning = true;
    this.selectedPlanet = null;
    this.pause = false;
    this.illo = null;
    this.init(canvasId);
  }

  init(canvasId) {
    this.illo = new Zdog.Illustration({
      element: `#${canvasId}`,
      dragRotate: true,
      resize: true,
      zoom: 5,
      rotate: { y: this.TAU * 0.4, x: -this.TAU / 10 },
      onDragStart: () => {
        this.isSpinning = false;
      },
      onDragEnd: () => {
        this.isSpinning = true;
      },
      onResize: (width, height) => {
        if (!this.illo) return;

        // Your reference point: zoom 5 at 1200px
        const REFERENCE_ZOOM = 10;
        const REFERENCE_SIZE = 1200;

        // Use the smallest dimension (width or height) for scaling
        const minDimension = Math.min(width, height);

        // Proportional scaling: (current size / reference size) * reference zoom
        this.illo.zoom = (minDimension / REFERENCE_SIZE) * REFERENCE_ZOOM;

        // Optional: Set min/max bounds to prevent extreme zooming
        this.illo.zoom = Math.max(5, Math.min(this.illo.zoom, 15)); // Example bounds
      },
    });

    this.createPlanets();
    this.animate();
  }

  createPlanets() {
    this.planets.forEach((planet) => {
      const parentBody = planet.satelliteOf
        ? this.planets.find((p) => p.name === planet.satelliteOf).planet
        : this.illo;
      planet.anchor = new Zdog.Anchor({
        addTo: parentBody,
        translate: { z: planet.orbitTranslateZ },
        rotate: { y: planet.orbitNode, z: planet.orbitTilt },
      });

      planet.orbitAnchor = new Zdog.Anchor({ addTo: planet.anchor });

      if (!planet.ring) planet.ring = 1;
      planet.orbits = [];

      this.createOrbits(planet);
      this.createPlanetShape(planet);
      if (planet.starColor) this.createStarLight(planet);
    });
  }

  createOrbits(planet) {
    if (planet.orbitDiameter > 0) {
      for (let i = 0; i < planet.ring; i++) {
        const orbit = new Zdog.Ellipse({
          addTo: planet.orbitAnchor,
          diameter: planet.orbitDiameter + i * 0.3,
          quarters: 4,
          rotate: { x: this.TAU / 4 },
          stroke: planet.name === 'sun' ? 0 : 0.1,
          color: '#fff3',
          name: planet.name,
        });
        planet.orbits.push(orbit);
      }
    }
  }

  createPlanetShape(planet) {
    if (planet.ring === 1) {
      planet.planet = new Zdog.Shape({
        addTo: planet.orbitAnchor,
        translate: { x: planet.orbitDiameter / 2 },
        stroke: planet.diameter,
        color: planet.color,
        name: planet.name,
      });
    }
  }

  createStarLight(planet) {
    planet.light = new Zdog.Shape({
      addTo: planet.orbitAnchor,
      translate: { x: planet.orbitDiameter / 2 },
      stroke: planet.diameter + planet.starLight,
      color: planet.starColor,
      name: planet.name,
    });
  }

  animate() {
    this.planets.forEach((planet) => {
      planet.orbitAnchor.rotate.y -= this.TAU / planet.orbitPeriod / 5;
      if (planet.satelliteOf && planet.satelliteOf !== 'sun') {
        const parent = this.planets.find((p) => p.name === planet.satelliteOf);
        planet.anchor.rotate.y += this.TAU / parent.orbitPeriod / 5;
      }
    });

    if (this.isSpinning) this.illo.rotate.y += 0.01;
    this.illo.updateRenderGraph();

    if (!this.pause) requestAnimationFrame(() => this.animate());
  }

  highlightPlanet(planetName) {
    const planetData = this.planets.find((p) => p.name === planetName);
    if (!planetData || !planetData.planet) return;

    const planet = planetData.planet;
    planet.originalColor = planet.color;
    planet.originalStroke = planet.stroke;

    planet.color = '#FFF';
    planet.stroke = planet.originalStroke * 1.5;
    this.selectedPlanet = planet;
    this.pause = true;
  }

  resetHighlight() {
    if (this.selectedPlanet) {
      this.selectedPlanet.color = this.selectedPlanet.originalColor;
      this.selectedPlanet.stroke = this.selectedPlanet.originalStroke;
      this.selectedPlanet = null;
      this.pause = false;
    }
    this.animate();
  }
}
