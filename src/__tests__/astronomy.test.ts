/**
 * Tests for astronomy utilities
 */

import {
  ASTRONOMY_CONSTANTS,
  STAR_COLORS,
  degToRad,
  radToDeg,
  getJulianDate,
  getGMST,
  getLST,
  equatorialToHorizontal,
  horizontalTo3D,
  starTo3D,
  getStarColorHex,
  magnitudeToSize,
  isNakedEyeVisible,
  formatLatitude,
  formatLongitude,
  formatAzimuth,
  formatAltitude,
  azimuthToCompass,
  LOCATIONS,
} from '../utils/astronomy';

// =============================================================================
// ANGLE CONVERSION TESTS
// =============================================================================

describe('Angle Conversion', () => {
  describe('degToRad', () => {
    test('converts 0 degrees to 0 radians', () => {
      expect(degToRad(0)).toBe(0);
    });

    test('converts 180 degrees to PI radians', () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI);
    });

    test('converts 90 degrees to PI/2 radians', () => {
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
    });

    test('converts 360 degrees to 2*PI radians', () => {
      expect(degToRad(360)).toBeCloseTo(2 * Math.PI);
    });

    test('handles negative angles', () => {
      expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2);
    });

    test('handles decimal angles', () => {
      expect(degToRad(45.5)).toBeCloseTo((45.5 * Math.PI) / 180);
    });
  });

  describe('radToDeg', () => {
    test('converts 0 radians to 0 degrees', () => {
      expect(radToDeg(0)).toBe(0);
    });

    test('converts PI radians to 180 degrees', () => {
      expect(radToDeg(Math.PI)).toBeCloseTo(180);
    });

    test('converts PI/2 radians to 90 degrees', () => {
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
    });

    test('converts 2*PI radians to 360 degrees', () => {
      expect(radToDeg(2 * Math.PI)).toBeCloseTo(360);
    });

    test('handles negative radians', () => {
      expect(radToDeg(-Math.PI / 2)).toBeCloseTo(-90);
    });

    test('round-trip conversion is accurate', () => {
      const original = 123.456;
      expect(radToDeg(degToRad(original))).toBeCloseTo(original);
    });
  });
});

// =============================================================================
// JULIAN DATE AND SIDEREAL TIME TESTS
// =============================================================================

describe('Julian Date and Sidereal Time', () => {
  describe('getJulianDate', () => {
    test('calculates J2000.0 epoch correctly', () => {
      // J2000.0 is January 1, 2000, 12:00 TT (approximately 11:58:55.816 UTC)
      const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
      const jd = getJulianDate(j2000);
      expect(jd).toBeCloseTo(2451545.0, 1);
    });

    test('calculates known date correctly', () => {
      // January 1, 2024, 00:00 UTC
      const date = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
      const jd = getJulianDate(date);
      // Expected JD is approximately 2460310.5
      expect(jd).toBeCloseTo(2460310.5, 1);
    });

    test('handles Unix epoch', () => {
      const unixEpoch = new Date(Date.UTC(1970, 0, 1, 0, 0, 0));
      const jd = getJulianDate(unixEpoch);
      expect(jd).toBeCloseTo(ASTRONOMY_CONSTANTS.JULIAN_DATE_OFFSET, 1);
    });
  });

  describe('getGMST', () => {
    test('returns a value between 0 and 360', () => {
      const date = new Date();
      const gmst = getGMST(date);
      expect(gmst).toBeGreaterThanOrEqual(0);
      expect(gmst).toBeLessThan(360);
    });

    test('changes over time', () => {
      const date1 = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
      const date2 = new Date(Date.UTC(2024, 0, 1, 6, 0, 0));
      const gmst1 = getGMST(date1);
      const gmst2 = getGMST(date2);
      expect(gmst1).not.toBe(gmst2);
    });

    test('increases by approximately 360 degrees per sidereal day', () => {
      const date1 = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
      // A sidereal day is about 23h 56m 4s
      const date2 = new Date(date1.getTime() + 23 * 3600000 + 56 * 60000 + 4000);
      const gmst1 = getGMST(date1);
      const gmst2 = getGMST(date2);
      // After one sidereal day, GMST should be nearly the same (within a few degrees)
      const diff = Math.abs(gmst2 - gmst1);
      expect(diff).toBeLessThan(5);
    });
  });

  describe('getLST', () => {
    test('returns value between 0 and 360', () => {
      const date = new Date();
      const lst = getLST(date, 0);
      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(360);
    });

    test('differs from GMST by longitude', () => {
      const date = new Date();
      const gmst = getGMST(date);
      const longitude = 45; // 45 degrees east
      const lst = getLST(date, longitude);
      // LST should be GMST + longitude (normalized)
      const expected = ((gmst + longitude) % 360 + 360) % 360;
      expect(lst).toBeCloseTo(expected, 5);
    });

    test('Greenwich LST equals GMST', () => {
      const date = new Date();
      const gmst = getGMST(date);
      const lst = getLST(date, 0);
      expect(lst).toBeCloseTo(gmst, 5);
    });

    test('handles negative longitudes', () => {
      const date = new Date();
      const lst = getLST(date, -74); // New York
      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(360);
    });
  });
});

// =============================================================================
// COORDINATE TRANSFORMATION TESTS
// =============================================================================

describe('Coordinate Transformations', () => {
  describe('equatorialToHorizontal', () => {
    const observer = { latitude: 51.4772, longitude: 0 }; // Greenwich

    test('returns altitude and azimuth', () => {
      const coords = { ra: 180, dec: 45 };
      const result = equatorialToHorizontal(coords, observer);
      expect(result).toHaveProperty('altitude');
      expect(result).toHaveProperty('azimuth');
    });

    test('altitude is within valid range', () => {
      const coords = { ra: 0, dec: 0 };
      const result = equatorialToHorizontal(coords, observer);
      expect(result.altitude).toBeGreaterThanOrEqual(-90);
      expect(result.altitude).toBeLessThanOrEqual(90);
    });

    test('azimuth is within valid range', () => {
      const coords = { ra: 0, dec: 0 };
      const result = equatorialToHorizontal(coords, observer);
      expect(result.azimuth).toBeGreaterThanOrEqual(0);
      expect(result.azimuth).toBeLessThanOrEqual(360);
    });

    test('celestial pole is at altitude equal to latitude', () => {
      // North celestial pole (dec = 90) should be at altitude = observer latitude
      const coords = { ra: 0, dec: 90 };
      const result = equatorialToHorizontal(coords, observer);
      expect(result.altitude).toBeCloseTo(observer.latitude, 0);
    });

    test('southern hemisphere observer sees south pole elevated', () => {
      const southernObserver = { latitude: -33.8688, longitude: 151.2093 }; // Sydney
      const coords = { ra: 0, dec: -90 }; // South celestial pole
      const result = equatorialToHorizontal(coords, southernObserver);
      expect(result.altitude).toBeCloseTo(Math.abs(southernObserver.latitude), 0);
    });

    test('handles equator observer', () => {
      const equatorObserver = { latitude: 0, longitude: 0 };
      const coords = { ra: 0, dec: 0 };
      const result = equatorialToHorizontal(coords, equatorObserver);
      expect(result.altitude).toBeGreaterThanOrEqual(-90);
      expect(result.altitude).toBeLessThanOrEqual(90);
    });
  });

  describe('horizontalTo3D', () => {
    test('zenith is straight up (y=1)', () => {
      const result = horizontalTo3D({ altitude: 90, azimuth: 0 }, 1);
      expect(result.y).toBeCloseTo(1);
      expect(result.x).toBeCloseTo(0);
      expect(result.z).toBeCloseTo(0);
    });

    test('nadir is straight down (y=-1)', () => {
      const result = horizontalTo3D({ altitude: -90, azimuth: 0 }, 1);
      expect(result.y).toBeCloseTo(-1);
      expect(result.x).toBeCloseTo(0);
      expect(result.z).toBeCloseTo(0);
    });

    test('horizon north is negative Z', () => {
      const result = horizontalTo3D({ altitude: 0, azimuth: 0 }, 1);
      expect(result.y).toBeCloseTo(0);
      expect(result.z).toBeCloseTo(-1);
    });

    test('horizon south is positive Z', () => {
      const result = horizontalTo3D({ altitude: 0, azimuth: 180 }, 1);
      expect(result.y).toBeCloseTo(0);
      expect(result.z).toBeCloseTo(1);
    });

    test('scales by radius', () => {
      const result = horizontalTo3D({ altitude: 90, azimuth: 0 }, 100);
      expect(result.y).toBeCloseTo(100);
    });

    test('default radius is 1', () => {
      const result = horizontalTo3D({ altitude: 90, azimuth: 0 });
      expect(result.y).toBeCloseTo(1);
    });

    test('maintains unit sphere for all directions', () => {
      const testCases = [
        { altitude: 0, azimuth: 0 },
        { altitude: 0, azimuth: 90 },
        { altitude: 0, azimuth: 180 },
        { altitude: 0, azimuth: 270 },
        { altitude: 45, azimuth: 45 },
        { altitude: -30, azimuth: 120 },
      ];

      testCases.forEach((coords) => {
        const result = horizontalTo3D(coords, 1);
        const magnitude = Math.sqrt(result.x ** 2 + result.y ** 2 + result.z ** 2);
        expect(magnitude).toBeCloseTo(1, 5);
      });
    });
  });

  describe('starTo3D', () => {
    const observer = { latitude: 40.7128, longitude: -74.006 }; // New York

    test('returns x, y, z, and visible properties', () => {
      const result = starTo3D(180, 45, observer);
      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
      expect(result).toHaveProperty('z');
      expect(result).toHaveProperty('visible');
    });

    test('visible is true for stars above horizon', () => {
      // Polaris (approximately) - should always be visible from New York
      const result = starTo3D(37.95, 89.26, observer);
      expect(result.visible).toBe(true);
    });

    test('scales by radius parameter', () => {
      const result1 = starTo3D(180, 45, observer, new Date(), 1);
      const result2 = starTo3D(180, 45, observer, new Date(), 100);
      expect(Math.abs(result2.x / result1.x)).toBeCloseTo(100, 0);
    });

    test('default radius is 100', () => {
      const result = starTo3D(180, 0, observer);
      const magnitude = Math.sqrt(result.x ** 2 + result.y ** 2 + result.z ** 2);
      expect(magnitude).toBeCloseTo(100, 0);
    });
  });
});

// =============================================================================
// STAR PROPERTIES TESTS
// =============================================================================

describe('Star Properties', () => {
  describe('getStarColorHex', () => {
    test('returns correct color for O class', () => {
      expect(getStarColorHex('O')).toBe(STAR_COLORS['O']);
    });

    test('returns correct color for G class (Sun-like)', () => {
      expect(getStarColorHex('G')).toBe(STAR_COLORS['G']);
    });

    test('returns correct color for M class (red dwarf)', () => {
      expect(getStarColorHex('M')).toBe(STAR_COLORS['M']);
    });

    test('handles full spectral type strings', () => {
      expect(getStarColorHex('G2V')).toBe(STAR_COLORS['G']);
      expect(getStarColorHex('M5')).toBe(STAR_COLORS['M']);
    });

    test('returns white for null', () => {
      expect(getStarColorHex(null)).toBe(0xffffff);
    });

    test('returns white for unknown class', () => {
      expect(getStarColorHex('X')).toBe(0xffffff);
    });

    test('handles lowercase', () => {
      expect(getStarColorHex('g')).toBe(STAR_COLORS['G']);
    });

    test('all star classes have colors defined', () => {
      const classes = ['O', 'B', 'A', 'F', 'G', 'K', 'M', 'L', 'T', 'Y'];
      classes.forEach((cls) => {
        expect(getStarColorHex(cls)).not.toBe(0xffffff);
      });
    });
  });

  describe('magnitudeToSize', () => {
    test('returns larger size for brighter (lower magnitude) stars', () => {
      const bright = magnitudeToSize(0);
      const dim = magnitudeToSize(10);
      expect(bright).toBeGreaterThan(dim);
    });

    test('returns default for null', () => {
      expect(magnitudeToSize(null)).toBe(0.5);
    });

    test('returns default for NaN', () => {
      expect(magnitudeToSize(NaN)).toBe(0.5);
    });

    test('clamps to minimum size', () => {
      const result = magnitudeToSize(20);
      expect(result).toBeGreaterThanOrEqual(ASTRONOMY_CONSTANTS.MAGNITUDE_CLAMP_MIN);
    });

    test('clamps to maximum size', () => {
      const result = magnitudeToSize(-5);
      expect(result).toBeLessThanOrEqual(ASTRONOMY_CONSTANTS.MAGNITUDE_CLAMP_MAX);
    });

    test('handles negative magnitudes (very bright)', () => {
      const result = magnitudeToSize(-1);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(ASTRONOMY_CONSTANTS.MAGNITUDE_CLAMP_MAX);
    });

    test('returns reasonable values for typical star magnitudes', () => {
      // Sirius: -1.46
      // Sun: -26.74 (but we'd never see it in this context)
      // Naked eye limit: ~6
      // Faint stars: 15+

      const sirius = magnitudeToSize(-1.46);
      const polaris = magnitudeToSize(1.98);
      const nakedEyeLimit = magnitudeToSize(6);
      const faint = magnitudeToSize(15);

      expect(sirius).toBeGreaterThan(polaris);
      expect(polaris).toBeGreaterThan(nakedEyeLimit);
      expect(nakedEyeLimit).toBeGreaterThan(faint);
    });
  });

  describe('isNakedEyeVisible', () => {
    test('returns true for bright stars', () => {
      expect(isNakedEyeVisible(0)).toBe(true);
      expect(isNakedEyeVisible(3)).toBe(true);
      expect(isNakedEyeVisible(6)).toBe(true);
    });

    test('returns true at exactly the naked eye limit', () => {
      expect(isNakedEyeVisible(ASTRONOMY_CONSTANTS.NAKED_EYE_LIMIT)).toBe(true);
    });

    test('returns false for dim stars', () => {
      expect(isNakedEyeVisible(7)).toBe(false);
      expect(isNakedEyeVisible(10)).toBe(false);
      expect(isNakedEyeVisible(15)).toBe(false);
    });

    test('returns false for null', () => {
      expect(isNakedEyeVisible(null)).toBe(false);
    });

    test('handles negative magnitudes (very bright)', () => {
      expect(isNakedEyeVisible(-1)).toBe(true);
      expect(isNakedEyeVisible(-26)).toBe(true); // Sun
    });
  });
});

// =============================================================================
// FORMATTING TESTS
// =============================================================================

describe('Formatting Functions', () => {
  describe('formatLatitude', () => {
    test('formats positive latitude with N', () => {
      expect(formatLatitude(45)).toBe('45.00°N');
    });

    test('formats negative latitude with S', () => {
      expect(formatLatitude(-45)).toBe('45.00°S');
    });

    test('formats zero as N', () => {
      expect(formatLatitude(0)).toBe('0.00°N');
    });

    test('formats with correct decimal places', () => {
      expect(formatLatitude(45.678)).toBe('45.68°N');
    });
  });

  describe('formatLongitude', () => {
    test('formats positive longitude with E', () => {
      expect(formatLongitude(90)).toBe('90.00°E');
    });

    test('formats negative longitude with W', () => {
      expect(formatLongitude(-74)).toBe('74.00°W');
    });

    test('formats zero as E', () => {
      expect(formatLongitude(0)).toBe('0.00°E');
    });

    test('formats with correct decimal places', () => {
      expect(formatLongitude(-74.006)).toBe('74.01°W');
    });
  });

  describe('formatAzimuth', () => {
    test('formats azimuth with degrees symbol', () => {
      expect(formatAzimuth(180)).toBe('180.00°');
    });

    test('formats with correct decimal places', () => {
      expect(formatAzimuth(45.5)).toBe('45.50°');
    });

    test('formats zero', () => {
      expect(formatAzimuth(0)).toBe('0.00°');
    });
  });

  describe('formatAltitude', () => {
    test('formats positive altitude', () => {
      expect(formatAltitude(45)).toBe('45.00°');
    });

    test('formats negative altitude', () => {
      expect(formatAltitude(-10)).toBe('-10.00°');
    });

    test('formats zero', () => {
      expect(formatAltitude(0)).toBe('0.00°');
    });
  });

  describe('azimuthToCompass', () => {
    test('returns N for 0 degrees', () => {
      expect(azimuthToCompass(0)).toBe('N');
    });

    test('returns N for 360 degrees', () => {
      expect(azimuthToCompass(360)).toBe('N');
    });

    test('returns E for 90 degrees', () => {
      expect(azimuthToCompass(90)).toBe('E');
    });

    test('returns S for 180 degrees', () => {
      expect(azimuthToCompass(180)).toBe('S');
    });

    test('returns W for 270 degrees', () => {
      expect(azimuthToCompass(270)).toBe('W');
    });

    test('returns NE for 45 degrees', () => {
      expect(azimuthToCompass(45)).toBe('NE');
    });

    test('returns SE for 135 degrees', () => {
      expect(azimuthToCompass(135)).toBe('SE');
    });

    test('returns SW for 225 degrees', () => {
      expect(azimuthToCompass(225)).toBe('SW');
    });

    test('returns NW for 315 degrees', () => {
      expect(azimuthToCompass(315)).toBe('NW');
    });

    test('handles boundary cases', () => {
      // Just past 22.5 should round to NE
      expect(azimuthToCompass(23)).toBe('NE');
      // Just before 22.5 should round to N
      expect(azimuthToCompass(22)).toBe('N');
    });
  });
});

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('Constants', () => {
  describe('ASTRONOMY_CONSTANTS', () => {
    test('DEGREES_TO_RADIANS is correct', () => {
      expect(ASTRONOMY_CONSTANTS.DEGREES_TO_RADIANS).toBeCloseTo(Math.PI / 180);
    });

    test('RADIANS_TO_DEGREES is correct', () => {
      expect(ASTRONOMY_CONSTANTS.RADIANS_TO_DEGREES).toBeCloseTo(180 / Math.PI);
    });

    test('FULL_CIRCLE is 360', () => {
      expect(ASTRONOMY_CONSTANTS.FULL_CIRCLE).toBe(360);
    });

    test('J2000_JULIAN_DATE is correct', () => {
      expect(ASTRONOMY_CONSTANTS.J2000_JULIAN_DATE).toBe(2451545.0);
    });

    test('NAKED_EYE_LIMIT is reasonable', () => {
      expect(ASTRONOMY_CONSTANTS.NAKED_EYE_LIMIT).toBe(6.5);
    });
  });

  describe('STAR_COLORS', () => {
    test('has all main sequence classes', () => {
      expect(STAR_COLORS).toHaveProperty('O');
      expect(STAR_COLORS).toHaveProperty('B');
      expect(STAR_COLORS).toHaveProperty('A');
      expect(STAR_COLORS).toHaveProperty('F');
      expect(STAR_COLORS).toHaveProperty('G');
      expect(STAR_COLORS).toHaveProperty('K');
      expect(STAR_COLORS).toHaveProperty('M');
    });

    test('has brown dwarf classes', () => {
      expect(STAR_COLORS).toHaveProperty('L');
      expect(STAR_COLORS).toHaveProperty('T');
      expect(STAR_COLORS).toHaveProperty('Y');
    });

    test('all colors are valid hex numbers', () => {
      Object.values(STAR_COLORS).forEach((color) => {
        expect(typeof color).toBe('number');
        expect(color).toBeGreaterThanOrEqual(0);
        expect(color).toBeLessThanOrEqual(0xffffff);
      });
    });
  });

  describe('LOCATIONS', () => {
    test('contains expected cities', () => {
      expect(LOCATIONS).toHaveProperty('New York');
      expect(LOCATIONS).toHaveProperty('London');
      expect(LOCATIONS).toHaveProperty('Tokyo');
      expect(LOCATIONS).toHaveProperty('Sydney');
    });

    test('all locations have valid coordinates', () => {
      Object.values(LOCATIONS).forEach((loc) => {
        expect(loc.latitude).toBeGreaterThanOrEqual(-90);
        expect(loc.latitude).toBeLessThanOrEqual(90);
        expect(loc.longitude).toBeGreaterThanOrEqual(-180);
        expect(loc.longitude).toBeLessThanOrEqual(180);
      });
    });

    test('Greenwich has longitude 0', () => {
      expect(LOCATIONS['Greenwich'].longitude).toBe(0);
    });
  });
});
