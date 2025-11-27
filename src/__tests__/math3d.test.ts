/**
 * Tests for 3D math utilities
 */

import {
  DEG_TO_RAD,
  RAD_TO_DEG,
  PARSEC_TO_LY,
  LY_TO_PARSEC,
  AU_TO_KM,
  EARTH_RADIUS_KM,
  JUPITER_RADIUS_KM,
  SOLAR_RADIUS_KM,
  sphericalToCartesian,
  cartesianToSpherical,
  getPosition3D,
  getPositionLY,
  distance3D,
  angularDistance,
  calculateOrbitalPosition,
  generateOrbitPath,
  getOrbitalElements,
  scalePlanetRadius,
  scaleStarRadius,
  scaleOrbitalDistance,
  normalizeDistance,
  getStarColor,
  getStarColorRGB,
  getPlanetColor,
} from '../utils/math3d';
import { mockPlanet } from '../test/mocks';

describe('Constants', () => {
  test('DEG_TO_RAD converts correctly', () => {
    expect(180 * DEG_TO_RAD).toBeCloseTo(Math.PI);
    expect(90 * DEG_TO_RAD).toBeCloseTo(Math.PI / 2);
    expect(360 * DEG_TO_RAD).toBeCloseTo(2 * Math.PI);
    expect(0 * DEG_TO_RAD).toBe(0);
  });

  test('RAD_TO_DEG converts correctly', () => {
    expect(Math.PI * RAD_TO_DEG).toBeCloseTo(180);
    expect((Math.PI / 2) * RAD_TO_DEG).toBeCloseTo(90);
    expect(2 * Math.PI * RAD_TO_DEG).toBeCloseTo(360);
    expect(0 * RAD_TO_DEG).toBe(0);
  });

  test('DEG_TO_RAD and RAD_TO_DEG are inverses', () => {
    expect(DEG_TO_RAD * RAD_TO_DEG).toBeCloseTo(1);
    const testAngle = 45;
    expect(testAngle * DEG_TO_RAD * RAD_TO_DEG).toBeCloseTo(testAngle);
  });

  test('PARSEC_TO_LY is correct', () => {
    expect(PARSEC_TO_LY).toBeCloseTo(3.26156, 4);
  });

  test('LY_TO_PARSEC is inverse of PARSEC_TO_LY', () => {
    expect(PARSEC_TO_LY * LY_TO_PARSEC).toBeCloseTo(1);
  });

  test('AU_TO_KM is correct', () => {
    expect(AU_TO_KM).toBeCloseTo(149597870.7, 0);
  });

  test('EARTH_RADIUS_KM is correct', () => {
    expect(EARTH_RADIUS_KM).toBe(6371);
  });

  test('JUPITER_RADIUS_KM is correct', () => {
    expect(JUPITER_RADIUS_KM).toBe(69911);
  });

  test('SOLAR_RADIUS_KM is correct', () => {
    expect(SOLAR_RADIUS_KM).toBe(695700);
  });

  test('Jupiter is about 11x Earth radius', () => {
    expect(JUPITER_RADIUS_KM / EARTH_RADIUS_KM).toBeCloseTo(11, 0);
  });
});

describe('sphericalToCartesian', () => {
  test('converts origin correctly', () => {
    const result = sphericalToCartesian({ ra: 0, dec: 0, distance: 1 });
    expect(result.x).toBeCloseTo(1);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(0);
  });

  test('converts north pole correctly', () => {
    const result = sphericalToCartesian({ ra: 0, dec: 90, distance: 1 });
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(1);
  });

  test('converts RA=90 correctly', () => {
    const result = sphericalToCartesian({ ra: 90, dec: 0, distance: 1 });
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(1);
    expect(result.z).toBeCloseTo(0);
  });

  test('scales by distance', () => {
    const result = sphericalToCartesian({ ra: 0, dec: 0, distance: 10 });
    expect(result.x).toBeCloseTo(10);
  });

  test('converts south pole correctly', () => {
    const result = sphericalToCartesian({ ra: 0, dec: -90, distance: 1 });
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(-1);
  });

  test('converts RA=180 correctly', () => {
    const result = sphericalToCartesian({ ra: 180, dec: 0, distance: 1 });
    expect(result.x).toBeCloseTo(-1);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(0);
  });

  test('converts RA=270 correctly', () => {
    const result = sphericalToCartesian({ ra: 270, dec: 0, distance: 1 });
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(-1);
    expect(result.z).toBeCloseTo(0);
  });

  test('handles arbitrary angles', () => {
    const result = sphericalToCartesian({ ra: 45, dec: 45, distance: 1 });
    // At 45° declination, the projection onto the equatorial plane is cos(45°)
    // At 45° RA, x and y components are equal
    const expectedXY = Math.cos(45 * DEG_TO_RAD) / Math.sqrt(2);
    const expectedZ = Math.sin(45 * DEG_TO_RAD);
    expect(result.x).toBeCloseTo(expectedXY);
    expect(result.y).toBeCloseTo(expectedXY);
    expect(result.z).toBeCloseTo(expectedZ);
  });

  test('maintains unit sphere magnitude', () => {
    const result = sphericalToCartesian({ ra: 123, dec: 45, distance: 1 });
    const magnitude = Math.sqrt(result.x ** 2 + result.y ** 2 + result.z ** 2);
    expect(magnitude).toBeCloseTo(1);
  });

  test('handles zero distance', () => {
    const result = sphericalToCartesian({ ra: 45, dec: 30, distance: 0 });
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
  });
});

describe('cartesianToSpherical', () => {
  test('converts back correctly', () => {
    const original = { ra: 45, dec: 30, distance: 10 };
    const cartesian = sphericalToCartesian(original);
    const result = cartesianToSpherical(cartesian);

    expect(result.ra).toBeCloseTo(original.ra);
    expect(result.dec).toBeCloseTo(original.dec);
    expect(result.distance).toBeCloseTo(original.distance);
  });

  test('handles negative RA', () => {
    const cartesian = { x: 1, y: -1, z: 0 };
    const result = cartesianToSpherical(cartesian);
    expect(result.ra).toBeCloseTo(315); // -45 + 360
  });

  test('converts origin point on X axis', () => {
    const result = cartesianToSpherical({ x: 10, y: 0, z: 0 });
    expect(result.ra).toBeCloseTo(0);
    expect(result.dec).toBeCloseTo(0);
    expect(result.distance).toBeCloseTo(10);
  });

  test('converts north pole', () => {
    const result = cartesianToSpherical({ x: 0, y: 0, z: 5 });
    expect(result.dec).toBeCloseTo(90);
    expect(result.distance).toBeCloseTo(5);
  });

  test('converts south pole', () => {
    const result = cartesianToSpherical({ x: 0, y: 0, z: -5 });
    expect(result.dec).toBeCloseTo(-90);
    expect(result.distance).toBeCloseTo(5);
  });

  test('round-trip conversion preserves values for multiple angles', () => {
    const testCases = [
      { ra: 0, dec: 0, distance: 1 },
      { ra: 90, dec: 45, distance: 100 },
      { ra: 180, dec: -30, distance: 50 },
      { ra: 270, dec: 60, distance: 25 },
      { ra: 359, dec: -89, distance: 1000 },
    ];

    testCases.forEach((original) => {
      const cartesian = sphericalToCartesian(original);
      const result = cartesianToSpherical(cartesian);
      expect(result.ra).toBeCloseTo(original.ra, 3);
      expect(result.dec).toBeCloseTo(original.dec, 3);
      expect(result.distance).toBeCloseTo(original.distance, 3);
    });
  });
});

describe('getPosition3D', () => {
  test('returns precomputed position if available', () => {
    const result = getPosition3D(mockPlanet);
    expect(result).not.toBeNull();
    expect(result!.x).toBe(mockPlanet.x_pc);
    expect(result!.y).toBe(mockPlanet.y_pc);
    expect(result!.z).toBe(mockPlanet.z_pc);
  });

  test('calculates from unit vector and distance', () => {
    const planet = { ...mockPlanet, x_pc: null, y_pc: null, z_pc: null };
    const result = getPosition3D(planet);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(mockPlanet.x * mockPlanet.sy_dist!);
  });

  test('returns null if no distance', () => {
    const planet = {
      ...mockPlanet,
      x_pc: null,
      y_pc: null,
      z_pc: null,
      sy_dist: null,
    };
    const result = getPosition3D(planet);
    expect(result).toBeNull();
  });
});

describe('getPositionLY', () => {
  test('converts parsecs to light-years', () => {
    const result = getPositionLY(mockPlanet);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(mockPlanet.x_pc! * PARSEC_TO_LY);
  });
});

describe('distance3D', () => {
  test('calculates distance between points', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 3, y: 4, z: 0 };
    expect(distance3D(a, b)).toBeCloseTo(5);
  });

  test('calculates 3D distance', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 1, y: 1, z: 1 };
    expect(distance3D(a, b)).toBeCloseTo(Math.sqrt(3));
  });

  test('returns 0 for same point', () => {
    const a = { x: 5, y: 10, z: 15 };
    expect(distance3D(a, a)).toBe(0);
  });

  test('is commutative', () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { x: 4, y: 5, z: 6 };
    expect(distance3D(a, b)).toBeCloseTo(distance3D(b, a));
  });

  test('handles negative coordinates', () => {
    const a = { x: -1, y: -1, z: -1 };
    const b = { x: 1, y: 1, z: 1 };
    expect(distance3D(a, b)).toBeCloseTo(Math.sqrt(12)); // 2*sqrt(3)
  });

  test('handles large distances', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 1000000, y: 0, z: 0 };
    expect(distance3D(a, b)).toBeCloseTo(1000000);
  });
});

describe('angularDistance', () => {
  test('same point returns 0', () => {
    expect(angularDistance(180, 45, 180, 45)).toBeCloseTo(0);
  });

  test('opposite sides of sky returns 180', () => {
    expect(angularDistance(0, 0, 180, 0)).toBeCloseTo(180);
  });

  test('poles are 180 apart', () => {
    expect(angularDistance(0, 90, 0, -90)).toBeCloseTo(180);
  });

  test('90 degrees apart on equator', () => {
    expect(angularDistance(0, 0, 90, 0)).toBeCloseTo(90);
  });

  test('is commutative', () => {
    const dist1 = angularDistance(45, 30, 120, -15);
    const dist2 = angularDistance(120, -15, 45, 30);
    expect(dist1).toBeCloseTo(dist2);
  });

  test('same RA different Dec', () => {
    expect(angularDistance(0, 0, 0, 45)).toBeCloseTo(45);
    expect(angularDistance(0, 0, 0, 90)).toBeCloseTo(90);
  });

  test('handles RA wrapping around 360', () => {
    // 350° and 10° should be 20° apart on the equator
    expect(angularDistance(350, 0, 10, 0)).toBeCloseTo(20);
  });

  test('handles north pole with any RA', () => {
    // At the pole, RA doesn't matter
    const dist1 = angularDistance(0, 90, 0, 0);
    const dist2 = angularDistance(180, 90, 0, 0);
    expect(dist1).toBeCloseTo(dist2);
    expect(dist1).toBeCloseTo(90);
  });
});

describe('calculateOrbitalPosition', () => {
  test('returns position on circular orbit', () => {
    const elements = {
      semiMajorAxis: 1,
      eccentricity: 0,
      inclination: 0,
      period: 365,
    };

    const pos0 = calculateOrbitalPosition(elements, 0);
    expect(pos0.x).toBeCloseTo(1);
    expect(pos0.y).toBeCloseTo(0);

    const pos90 = calculateOrbitalPosition(elements, 365 / 4);
    expect(pos90.x).toBeCloseTo(0, 1);
    expect(pos90.y).toBeCloseTo(1, 1);
  });

  test('half orbit returns opposite position', () => {
    const elements = {
      semiMajorAxis: 1,
      eccentricity: 0,
      inclination: 0,
      period: 365,
    };

    const pos0 = calculateOrbitalPosition(elements, 0);
    const posHalf = calculateOrbitalPosition(elements, 365 / 2);
    expect(posHalf.x).toBeCloseTo(-pos0.x, 1);
    expect(posHalf.y).toBeCloseTo(-pos0.y, 1);
  });

  test('eccentric orbit perihelion is at semiMajorAxis * (1 - e)', () => {
    const elements = {
      semiMajorAxis: 1,
      eccentricity: 0.5,
      inclination: 0,
      period: 365,
    };

    const pos0 = calculateOrbitalPosition(elements, 0);
    // At perihelion (t=0), distance should be a(1-e)
    const distance = Math.sqrt(pos0.x ** 2 + pos0.y ** 2 + pos0.z ** 2);
    expect(distance).toBeCloseTo(1 * (1 - 0.5), 1);
  });

  test('inclination tilts orbit out of xy plane', () => {
    const flatElements = {
      semiMajorAxis: 1,
      eccentricity: 0,
      inclination: 0,
      period: 365,
    };

    const tiltedElements = {
      ...flatElements,
      inclination: 45,
    };

    const flatPos = calculateOrbitalPosition(flatElements, 365 / 4);
    const tiltedPos = calculateOrbitalPosition(tiltedElements, 365 / 4);

    // Flat orbit should have z = 0
    expect(flatPos.z).toBeCloseTo(0);
    // Tilted orbit should have non-zero z
    expect(tiltedPos.z).not.toBeCloseTo(0);
  });

  test('full orbit returns to starting position', () => {
    const elements = {
      semiMajorAxis: 1,
      eccentricity: 0.3,
      inclination: 30,
      period: 365,
    };

    const posStart = calculateOrbitalPosition(elements, 0);
    const posEnd = calculateOrbitalPosition(elements, 365);

    expect(posEnd.x).toBeCloseTo(posStart.x, 3);
    expect(posEnd.y).toBeCloseTo(posStart.y, 3);
    expect(posEnd.z).toBeCloseTo(posStart.z, 3);
  });

  test('scales with semi-major axis', () => {
    const smallOrbit = {
      semiMajorAxis: 1,
      eccentricity: 0,
      inclination: 0,
      period: 365,
    };

    const largeOrbit = {
      ...smallOrbit,
      semiMajorAxis: 5,
    };

    const smallPos = calculateOrbitalPosition(smallOrbit, 0);
    const largePos = calculateOrbitalPosition(largeOrbit, 0);

    expect(largePos.x / smallPos.x).toBeCloseTo(5);
  });
});

describe('generateOrbitPath', () => {
  test('generates correct number of points', () => {
    const elements = {
      semiMajorAxis: 1,
      eccentricity: 0,
      inclination: 0,
      period: 365,
    };

    const path = generateOrbitPath(elements, 32);
    expect(path.length).toBe(33); // segments + 1 to close the loop
  });
});

describe('getOrbitalElements', () => {
  test('extracts elements from planet', () => {
    const elements = getOrbitalElements(mockPlanet);
    expect(elements).not.toBeNull();
    expect(elements!.semiMajorAxis).toBe(mockPlanet.pl_orbsmax);
    expect(elements!.eccentricity).toBe(mockPlanet.pl_orbeccen);
    expect(elements!.period).toBe(mockPlanet.pl_orbper);
  });

  test('returns null if missing data', () => {
    const planet = { ...mockPlanet, pl_orbsmax: null };
    expect(getOrbitalElements(planet)).toBeNull();
  });
});

describe('Scaling functions', () => {
  describe('scalePlanetRadius', () => {
    test('handles null', () => {
      expect(scalePlanetRadius(null)).toBe(1);
    });

    test('scales Earth', () => {
      const earth = scalePlanetRadius(1);
      const jupiter = scalePlanetRadius(11.2);
      expect(jupiter).toBeGreaterThan(earth);
    });

    test('uses custom base scale', () => {
      const result1 = scalePlanetRadius(1, 1);
      const result2 = scalePlanetRadius(1, 2);
      expect(result2).toBeGreaterThan(result1);
    });

    test('handles very small planets', () => {
      const result = scalePlanetRadius(0.1);
      expect(result).toBeGreaterThan(0);
    });

    test('handles very large planets', () => {
      const result = scalePlanetRadius(100);
      expect(result).toBeGreaterThan(scalePlanetRadius(10));
    });

    test('is monotonically increasing', () => {
      const sizes = [0.5, 1, 2, 5, 10, 20];
      for (let i = 1; i < sizes.length; i++) {
        expect(scalePlanetRadius(sizes[i])).toBeGreaterThan(
          scalePlanetRadius(sizes[i - 1])
        );
      }
    });
  });

  describe('scaleStarRadius', () => {
    test('handles null', () => {
      expect(scaleStarRadius(null)).toBe(5);
    });

    test('uses custom base scale', () => {
      const result1 = scaleStarRadius(1, 5);
      const result2 = scaleStarRadius(1, 10);
      expect(result2).toBeGreaterThan(result1);
    });

    test('larger stars get larger visual size', () => {
      const sun = scaleStarRadius(1);
      const giant = scaleStarRadius(10);
      expect(giant).toBeGreaterThan(sun);
    });

    test('handles very small stars (may return negative for tiny values)', () => {
      // Note: The current implementation uses log10(solarRadii + 0.1)
      // which can go negative for very small values. This documents actual behavior.
      const result = scaleStarRadius(0.1);
      expect(typeof result).toBe('number');
      expect(isNaN(result)).toBe(false);
    });

    test('returns positive values for typical star sizes', () => {
      // Most stars are > 0.5 solar radii
      expect(scaleStarRadius(0.5)).toBeGreaterThan(0);
      expect(scaleStarRadius(1)).toBeGreaterThan(0);
      expect(scaleStarRadius(10)).toBeGreaterThan(0);
    });
  });

  describe('scaleOrbitalDistance', () => {
    test('handles null', () => {
      expect(scaleOrbitalDistance(null)).toBe(10);
    });

    test('uses custom base scale', () => {
      const result1 = scaleOrbitalDistance(1, 10);
      const result2 = scaleOrbitalDistance(1, 20);
      expect(result2).toBeGreaterThan(result1);
    });

    test('larger distances get larger visual size', () => {
      const earth = scaleOrbitalDistance(1); // 1 AU
      const jupiter = scaleOrbitalDistance(5.2); // ~5.2 AU
      expect(jupiter).toBeGreaterThan(earth);
    });

    test('uses sqrt scale', () => {
      // sqrt(4) = 2 * sqrt(1), so 4 AU should be 2x 1 AU
      const au1 = scaleOrbitalDistance(1, 1);
      const au4 = scaleOrbitalDistance(4, 1);
      expect(au4 / au1).toBeCloseTo(2);
    });
  });

  describe('normalizeDistance', () => {
    test('maps to range', () => {
      const result = normalizeDistance(100, 1000, 100);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });

    test('zero distance returns small positive value', () => {
      const result = normalizeDistance(0, 1000, 100);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    test('max distance maps near target range', () => {
      const result = normalizeDistance(1000, 1000, 100);
      expect(result).toBeCloseTo(100, 0);
    });

    test('respects target range parameter', () => {
      const result50 = normalizeDistance(500, 1000, 50);
      const result100 = normalizeDistance(500, 1000, 100);
      expect(result100 / result50).toBeCloseTo(2);
    });

    test('uses logarithmic scale', () => {
      // With log scale, 10x distance should not be 10x result
      const d10 = normalizeDistance(10, 1000, 100);
      const d100 = normalizeDistance(100, 1000, 100);
      const ratio = d100 / d10;
      expect(ratio).toBeLessThan(10);
      expect(ratio).toBeGreaterThan(1);
    });
  });
});

describe('Color functions', () => {
  describe('getStarColor', () => {
    test('returns correct colors for all classes', () => {
      expect(getStarColor('O')).toBe('#9bb0ff');
      expect(getStarColor('B')).toBe('#aabfff');
      expect(getStarColor('A')).toBe('#cad7ff');
      expect(getStarColor('F')).toBe('#f8f7ff');
      expect(getStarColor('G')).toBe('#fff4ea');
      expect(getStarColor('K')).toBe('#ffd2a1');
      expect(getStarColor('M')).toBe('#ffcc6f');
      expect(getStarColor('L')).toBe('#ff6600');
      expect(getStarColor('T')).toBe('#cc3300');
      expect(getStarColor('Y')).toBe('#990000');
    });

    test('handles null', () => {
      expect(getStarColor(null)).toBe('#ffffff');
    });

    test('handles unknown class', () => {
      expect(getStarColor('X')).toBe('#ffffff');
      expect(getStarColor('Z')).toBe('#ffffff');
    });

    test('returns valid hex color format', () => {
      const color = getStarColor('G');
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('getStarColorRGB', () => {
    test('returns RGB values', () => {
      const [r, g, b] = getStarColorRGB('G');
      expect(r).toBeGreaterThan(0);
      expect(r).toBeLessThanOrEqual(1);
      expect(g).toBeGreaterThan(0);
      expect(g).toBeLessThanOrEqual(1);
      expect(b).toBeGreaterThan(0);
      expect(b).toBeLessThanOrEqual(1);
    });

    test('handles null', () => {
      const [r, g, b] = getStarColorRGB(null);
      expect(r).toBe(1);
      expect(g).toBe(1);
      expect(b).toBe(1);
    });

    test('hot stars are more blue', () => {
      const [rO, , bO] = getStarColorRGB('O'); // Hot, blue
      const [rM, , bM] = getStarColorRGB('M'); // Cool, red
      expect(bO).toBeGreaterThan(bM);
      expect(rM).toBeGreaterThan(rO);
    });

    test('returns array of 3 elements', () => {
      const rgb = getStarColorRGB('G');
      expect(rgb).toHaveLength(3);
    });
  });

  describe('getPlanetColor', () => {
    test('returns correct colors for all planet types', () => {
      expect(getPlanetColor('Sub-Earth')).toBe('#a0a0a0');
      expect(getPlanetColor('Earth-sized')).toBe('#4a7c59');
      expect(getPlanetColor('Super-Earth')).toBe('#8b7355');
      expect(getPlanetColor('Sub-Neptune')).toBe('#5da4a8');
      expect(getPlanetColor('Neptune-like')).toBe('#4169e1');
      expect(getPlanetColor('Gas Giant')).toBe('#cd853f');
    });

    test('handles null', () => {
      expect(getPlanetColor(null)).toBe('#808080');
    });

    test('handles unknown type', () => {
      expect(getPlanetColor('Unknown')).toBe('#808080');
    });

    test('returns valid hex color format', () => {
      const color = getPlanetColor('Earth-sized');
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
