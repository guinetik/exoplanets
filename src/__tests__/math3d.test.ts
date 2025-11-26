/**
 * Tests for 3D math utilities
 */

import {
  DEG_TO_RAD,
  RAD_TO_DEG,
  PARSEC_TO_LY,
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
  });

  test('RAD_TO_DEG converts correctly', () => {
    expect(Math.PI * RAD_TO_DEG).toBeCloseTo(180);
    expect((Math.PI / 2) * RAD_TO_DEG).toBeCloseTo(90);
  });

  test('PARSEC_TO_LY is correct', () => {
    expect(PARSEC_TO_LY).toBeCloseTo(3.26156, 4);
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
    const planet = { ...mockPlanet, x_pc: null, y_pc: null, z_pc: null, sy_dist: null };
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
  test('scalePlanetRadius handles null', () => {
    expect(scalePlanetRadius(null)).toBe(1);
  });

  test('scalePlanetRadius scales Earth', () => {
    const earth = scalePlanetRadius(1);
    const jupiter = scalePlanetRadius(11.2);
    expect(jupiter).toBeGreaterThan(earth);
  });

  test('scaleStarRadius handles null', () => {
    expect(scaleStarRadius(null)).toBe(5);
  });

  test('scaleOrbitalDistance handles null', () => {
    expect(scaleOrbitalDistance(null)).toBe(10);
  });

  test('normalizeDistance maps to range', () => {
    const result = normalizeDistance(100, 1000, 100);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });
});

describe('Color functions', () => {
  test('getStarColor returns correct colors', () => {
    expect(getStarColor('G')).toBe('#fff4ea');
    expect(getStarColor('M')).toBe('#ffcc6f');
    expect(getStarColor('O')).toBe('#9bb0ff');
  });

  test('getStarColor handles null', () => {
    expect(getStarColor(null)).toBe('#ffffff');
  });

  test('getStarColorRGB returns RGB values', () => {
    const [r, g, b] = getStarColorRGB('G');
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThanOrEqual(1);
    expect(g).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(0);
  });

  test('getPlanetColor returns correct colors', () => {
    expect(getPlanetColor('Earth-sized')).toBe('#4a7c59');
    expect(getPlanetColor('Gas Giant')).toBe('#cd853f');
  });

  test('getPlanetColor handles null', () => {
    expect(getPlanetColor(null)).toBe('#808080');
  });
});
