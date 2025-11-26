import Zdog from 'zdog';
import SolarSystemFactory from '../data/solarsystem.factory';

class PlanetGenerator {
  constructor() {
    // Constants
    this.planet_radius = 125;
    this.atmosphere_thickness = 30;
    this.offset_x = 0;
    this.offset_y = -50;
    this.TAU = Zdog.TAU;

    // State
    this.isSpinning = true;
    this.regenerate = false;
    this.space = null;
    this.viewRotation = new Zdog.Vector();
    this.animationId = null;
  }

  // Main generation function
  generate_world(space, randomMass, planetData) {
    this.space = space;
    console.log('generate_world', planetData);

    let planetColor = SolarSystemFactory.getPlanetColor(planetData, 0);
    if (planetData.visType.toLowerCase() === 'lavaatmos') {
      planetColor = SolarSystemFactory.getPlanetColor(planetData, 4);
    }
    const query = planetData.planet_type.toLowerCase();

    // Create planet base
    const topHempishere = new Zdog.Hemisphere({
      addTo: this.space,
      diameter: this.planet_radius * 2,
      translate: { x: this.offset_x, y: this.offset_y },
      color: planetColor,
      stroke: false,
    });

    topHempishere.copy({
      rotate: { y: Zdog.TAU / 2 },
    });

    // Create poles
    const north_pole = new Zdog.Shape({
      addTo: this.space,
      translate: { x: this.offset_x, y: this.offset_y },
      path: [
        { y: this.planet_radius * -1 },
        { y: (this.planet_radius + 50) * -1 },
      ],
      stroke: 2,
      color: 'firebrick',
    });

    const north_pole_mark = new Zdog.Ellipse({
      addTo: north_pole,
      translate: { y: (this.planet_radius - 1) * -1 },
      rotate: { x: this.TAU / 4 },
      diameter: 20,
      stroke: 8,
      fill: true,
      color: 'rgba(200,190,190,1)',
    });

    // South pole
    north_pole.copy({
      path: [{ y: this.planet_radius }, { y: this.planet_radius + 50 }],
      color: 'blue',
    });

    north_pole_mark.copy({
      addTo: north_pole,
      translate: { y: this.planet_radius - 3 },
      color: 'rgba(100,100,255,1)',
    });

    // Generate clouds if needed
    let cloudCount = 0;
    if (planetData.visType.toLowerCase() === 'lavaatmos') {
      for (var i = 0; i < this.atmosphere_thickness * Math.random() * 10; i++) {
        this.create_cloud_cluster({
          lat: this.random(-50, 50),
          lng: this.random(-180, 180),
          altitude: this.random(10, 30),
          count: this.random(10, 30),
          strokeMaxMin: [8, 25],
        });
      }
    }

    // Generate land masses
    const interval = 90;
    const stroke = 2;
    const radShift = 0;
    const maxGrow = -1;
    const maxShrink = -3;
    const cols = [
      'rgba(255,255,255,0.1)',
      'rgba(255,255,255,0.2)',
      'rgba(255,255,255,0.3)',
      'rgba(160,130,52,1)',
      'rgba(160,130,52,1)',
      'rgba(0,128,0,1)',
      'rgba(85,107,47,1)',
      'rgba(67,85,37,1)',
      'rgba(160,100,42,1)',
      'rgba(140,80,42,1)',
      'rgba(120,60,42,1)',
      'rgba(170,110,92,1)',
      'rgba(200,180,200,1)',
    ];

    if (randomMass) {
      for (var i = 0; i < 8; i++) {
        this.buildLandMass(
          {
            sLat: this.random(-75, 75),
            sLng: this.random(0, 180),
            stages: this.random(4, 12),
          },
          cols
        );
      }
      for (var i = 0; i < 20; i++) {
        this.buildLandMass(
          {
            sLat: this.random(-55, 55),
            sLng: this.random(-179, 180),
            stages: this.random(1, 2),
          },
          cols
        );
      }
    } else {
      switch (query) {
        case 'terrestrial':
          this.generateTerrestrial(cols);
          break;
        case 'neptune-like':
          this.generateNeptuneLike();
          break;
        case 'super earth':
          this.generateSuperEarth();
          break;
        case 'gas giant':
          this.generateGasGiant();
          break;
      }
    }

    // Set up drag interaction
    let dragStartRX, dragStartRY;
    new Zdog.Dragger({
      startElement: this.space.element,
      onDragStart: () => {
        dragStartRX = this.viewRotation.x;
        dragStartRY = this.viewRotation.y;
        this.isSpinning = false;
      },
      onDragMove: (pointer, moveX, moveY) => {
        const moveRX = (moveY / this.space.width) * Zdog.TAU * -1;
        const moveRY = (moveX / this.space.width) * Zdog.TAU * -1;
        this.viewRotation.x = dragStartRX + moveRX;
        this.viewRotation.y = dragStartRY + moveRY;
      },
      onDragEnd: () => {
        this.isSpinning = true;
      },
    });

    // Start animation
    this.animate();
  }

  create_cloud_cluster(cords) {
    for (var i = 0; i < cords.count; i++) {
      this.set_cordinate_mark({
        lat: cords.lat + this.random(0, cords.count / 3),
        lng: cords.lng + this.random(0, cords.count),
        stroke: this.random(cords.strokeMaxMin[0], cords.strokeMaxMin[1]),
        color: 'rgba(200,200,200,' + this.random(0, 5) / 10 + ')',
        altitude: cords.altitude + this.random(5, 15),
        shape: 'dot',
      });
    }
  }

  buildLandMass({ sLat, sLng, stages }, colorz, mountains) {
    const interval = 90;
    const stroke = 2;
    const lngI = 360 / interval;
    const d = (Math.PI * this.planet_radius) / interval;
    const r = d / 2;
    const r2 = r / 2;
    const pr = Math.sqrt(r * r + r2 * r2);
    const latI = Math.sqrt(r * 2 * (r * 2) - r * r);

    const hexWheel = [
      { TR: (s, i) => [latI * s - latI * i, (lngI / 2) * s + (lngI * i) / 2] },
      { R: (s, i) => [-(latI * i), lngI * s - (lngI * i) / 2] },
      { BR: (s, i) => [-latI * s, (lngI / 2) * s - lngI * i] },
      {
        BL: (s, i) => [-latI * s + latI * i, (-lngI / 2) * s - (lngI * i) / 2],
      },
      { L: (s, i) => [latI * i, -lngI * s + (lngI * i) / 2] },
      { TL: (s, i) => [latI * s, (-lngI / 2) * s + lngI * i] },
    ];

    const landKey = { '0-TR-0': stages };
    this.set_cordinate_mark({
      lat: sLat,
      lng: sLng,
      radius: pr * 2,
      stroke,
      altitude: stages * 0.75,
      color: colorz ? colorz[stages] : cols[stages],
      shape: 'poly',
      sides: 6,
    });

    for (let stage = 0; stage <= stages; stage++) {
      for (let hw = 0; hw < hexWheel.length; hw++) {
        const key = Object.keys(hexWheel[hw])[0];
        for (let i = 1; i <= stage; i++) {
          let look = i <= 2 ? 0 : i - 2;
          let land =
            stage != 1
              ? landKey[stage - 1 + '-' + key + '-' + look]
              : landKey['0-TR-0'];
          const [lat, lng] = hexWheel[hw][key](stage, i - 1);
          const setStk = stages - stage < 1 ? 0 : stroke;
          let newAlt = land + this.random(-3, -1);

          if (newAlt > -1) {
            this.set_cordinate_mark({
              lat: lat + sLat,
              lng: lng + sLng,
              radius: pr * 2,
              stroke: setStk,
              altitude: newAlt * 0.75,
              color: colorz ? colorz[newAlt] : cols[newAlt],
              shape: 'poly',
              sides: 6,
            });

            if (mountains) {
              for (var a = 0; a < newAlt; a++) {
                this.set_cordinate_mark({
                  lat: lat + sLat,
                  lng: lng + sLng,
                  radius: pr * 2,
                  stroke: setStk,
                  altitude: a,
                  color: colorz ? colorz[newAlt] : cols[newAlt],
                  shape: 'poly',
                  sides: 6,
                });
              }
            }
          }
          landKey[stage + '-' + key + '-' + (i - 1)] = newAlt;
        }
      }
    }
  }

  generateTerrestrial(cols) {
    this.buildLandMass({ sLat: 20, sLng: 37, stages: 10 }, cols);
    this.buildLandMass({ sLat: 40, sLng: -37, stages: 10 }, cols);
    this.buildLandMass({ sLat: 30, sLng: -27, stages: 10 }, cols);
    this.buildLandMass({ sLat: 0, sLng: 150, stages: 5 }, cols);
    this.buildLandMass({ sLat: 60, sLng: -70, stages: 10 }, cols);
    this.buildLandMass({ sLat: 10, sLng: -10, stages: 5 }, cols);
    this.buildLandMass({ sLat: -50, sLng: -130, stages: 8 }, cols);
    this.buildLandMass({ sLat: 20, sLng: -90, stages: 5 }, cols);
    this.buildLandMass({ sLat: -10, sLng: 10, stages: 10 }, cols);
    this.buildLandMass({ sLat: -15, sLng: 180, stages: 10 }, cols);
    this.buildLandMass({ sLat: 35, sLng: 80, stages: 8 }, cols);
    this.buildLandMass({ sLat: -35, sLng: 80, stages: 3 }, cols);
    this.buildLandMass({ sLat: -40, sLng: 90, stages: 3 }, cols);
    this.buildLandMass({ sLat: -43, sLng: 90, stages: 2 }, cols);
    this.buildLandMass({ sLat: 33, sLng: 180, stages: 2 }, cols);
    this.buildLandMass({ sLat: 30, sLng: 170, stages: 3 }, cols);
    this.buildLandMass({ sLat: 32, sLng: 150, stages: 2 }, cols);
    this.buildLandMass({ sLat: 25, sLng: -130, stages: 3 }, cols);
  }

  generateNeptuneLike() {
    const neptuneColors = [
      'rgba(255,255,255,0.2)',
      'rgba(200,200,200,0.1)',
      '#6FA5B1',
      '#5E8A93',
      '#6FA5B1',
      '#0c2325',
      '#1e5359',
      'rgba(0,0,0,0.1)',
    ];

    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: 110, sLng: index * 10, stages: 1 },
        neptuneColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: 100, sLng: index * 10, stages: 1 },
        neptuneColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: 120, sLng: index * 10, stages: 1 },
        neptuneColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: 130, sLng: index * 10, stages: 1 },
        neptuneColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: 140, sLng: index * 10, stages: 1 },
        neptuneColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: 150, sLng: index * 10, stages: 1 },
        neptuneColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: 180, sLng: index * 10, stages: 3 },
        neptuneColors.reverse()
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: -100, sLng: index * 10, stages: 1 },
        neptuneColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: -110, sLng: index * 10, stages: 1 },
        neptuneColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: -120, sLng: index * 10, stages: 1 },
        neptuneColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: -130, sLng: index * 10, stages: 1 },
        neptuneColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: -140, sLng: index * 10, stages: 1 },
        neptuneColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: -150, sLng: index * 10, stages: 1 },
        neptuneColors
      );
    }
  }

  generateSuperEarth() {
    const superEarthColors = [
      'rgba(0,0,0,0.1)',
      'rgba(255,255,255,0.2)',
      '#6a351a',
      '#824121',
      '#6a351a',
      '#a32e2c',
      '#3c1010',
      '#361b0e',
      'rgba(160,100,42,1)',
      'rgba(140,80,42,1)',
      'rgba(120,60,42,1)',
      'rgba(170,110,92,1)',
      'rgba(200,200,200,0.5)',
    ];

    this.buildLandMass(
      { sLat: 20, sLng: 37, stages: 12 },
      superEarthColors,
      false
    );
    this.buildLandMass(
      { sLat: 40, sLng: -37, stages: 12 },
      superEarthColors,
      false
    );
    this.buildLandMass(
      { sLat: 30, sLng: -27, stages: 12 },
      superEarthColors,
      false
    );
    this.buildLandMass(
      { sLat: 0, sLng: 150, stages: 8 },
      superEarthColors,
      false
    );
    this.buildLandMass(
      { sLat: 60, sLng: -70, stages: 12 },
      superEarthColors,
      false
    );
    this.buildLandMass(
      { sLat: 10, sLng: -10, stages: 8 },
      superEarthColors,
      false
    );
    this.buildLandMass(
      { sLat: -50, sLng: -130, stages: 9 },
      superEarthColors,
      true
    );
    this.buildLandMass(
      { sLat: 20, sLng: -90, stages: 6 },
      superEarthColors,
      true
    );
    this.buildLandMass(
      { sLat: -10, sLng: 10, stages: 12 },
      superEarthColors,
      false
    );
    this.buildLandMass(
      { sLat: -15, sLng: 180, stages: 12 },
      superEarthColors,
      false
    );
    this.buildLandMass(
      { sLat: 35, sLng: 80, stages: 9 },
      superEarthColors,
      true
    );
  }

  generateGasGiant() {
    const gasGiantColors = [
      'rgba(0,0,0,0.1)',
      '#dbc8cf',
      '#e1bda6',
      '#be947b',
      '#a66d65',
      '#e87849',
      '#ab4219',
      '#be5c2a',
      '#a54426',
      '#a54426',
    ];
    const darkColors = [
      '#402323',
      '#613734',
      'rgba(255,255,255,0.5)',
      '#dbc8cf',
    ];

    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: 180, sLng: index * 10, stages: 4 },
        gasGiantColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: 140, sLng: index * 10, stages: 1 },
        darkColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: 130, sLng: index * 10, stages: 1 },
        darkColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: 120, sLng: index * 10, stages: 1 },
        darkColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: 110, sLng: index * 10, stages: 1 },
        darkColors.reverse()
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: 100, sLng: index * 10, stages: 1 },
        darkColors.reverse()
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: -100, sLng: index * 10, stages: 1 },
        darkColors.reverse()
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: -110, sLng: index * 10, stages: 1 },
        darkColors.reverse()
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: -120, sLng: index * 10, stages: 1 },
        darkColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: -130, sLng: index * 10, stages: 1 },
        darkColors
      );
    }
    for (let index = 0; index < 36; index++) {
      this.buildLandMass(
        { sLat: -140, sLng: index * 10, stages: 1 },
        darkColors
      );
    }
    this.buildLandMass({ sLat: -5, sLng: 0, stages: 10 }, gasGiantColors, true);
  }

  set_cordinate_mark(mark) {
    const lat_radians = this.TAU / 4 - mark.lat * (Math.PI / 180) * -1;
    const lng_radians = mark.lng * (Math.PI / 180) * -1;

    const rotor1 = new Zdog.Anchor({
      addTo: this.space,
      translate: { x: this.offset_x, y: this.offset_y },
      rotate: { y: lng_radians },
    });

    const rotor2 = new Zdog.Anchor({
      addTo: rotor1,
      rotate: { x: lat_radians },
    });

    if (mark.shape === 'dot') {
      new Zdog.Shape({
        addTo: rotor2,
        translate: { y: this.planet_radius + (mark.altitude || 0) },
        stroke: mark.stroke,
        color: mark.color,
      });
    } else if (mark.shape === 'poly') {
      new Zdog.Polygon({
        addTo: rotor2,
        sides: mark.sides,
        radius: mark.radius,
        translate: { y: this.planet_radius + (mark.altitude || 0) },
        rotate: { x: this.TAU * 0.75 },
        stroke: mark.stroke,
        fill: true,
        color: mark.color,
        backface: mark.backface,
      });
    }
  }

  animate() {
    if (!this.regenerate && this.space) {
      if (this.isSpinning) {
        this.space.rotate.y += 0.01;
      } else {
        this.space.rotate.y = this.viewRotation.y;
        this.space.rotate.x = this.getRotY(this.viewRotation.x);
      }

      this.space.updateRenderGraph();
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }

  getRotY(angle) {
    const min = -0.5;
    const max = 0.5;
    if (angle / 10 < min) return min;
    else if (angle / 10 > max) return max;
    else return angle / 10;
  }

  random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  cleanup() {
    cancelAnimationFrame(this.animationId);
    if (this.space) {
      this.space.remove();
      this.space = null;
    }
  }
}

export default PlanetGenerator;
