import './types';
import Zdog from 'zdog';
import SolarSystemFactory from './solarsystem.factory';
//
const { TAU } = Zdog;
const PLANET_DATA = [
  {
    name: 'Host',
    value: 'Sol',
  },
  {
    name: 'Disovery Year',
    value: '2020',
  },
  {
    name: 'Reference',
    value: 'Shporer et al. 2020',
    link: true,
    href: 'https://ui.adsabs.harvard.edu/abs/2020ApJ...890L...7S/abstract',
  },
  {
    name: 'Disposition',
    value: 'Confirmed Planet',
  },
  {
    name: 'Orbital Period',
    value: '0.5182349',
  },
  {
    name: 'Planet Radius',
    value: '1.193±0.074',
  },
  {
    name: 'Transit Duration',
    value: '0.734',
  },
  {
    name: 'Planet Mass',
    value: '2.09±0.56',
  },
  {
    name: 'Inclination',
    value: '85.0',
  },
  {
    name: 'Radial Velocity',
    value: '3.17±0.85',
  },
];
//
const SOLAR_SYSTEM = [
  {
    name: 'sun',
    displayName: 'Sol',
    diameter: 8,
    color: '#eb710b',
    orbitDiameter: 0,
    starLight: 1.2,
    starColor: '#eb710b66',
    type: 'star',
  },
  {
    name: 'mercury',
    id: 1,
    displayName: 'Mercury',
    diameter: 1,
    color: '#ada8a5',
    orbitDiameter: 12,
    orbitPeriod: 88 / 2,
    orbitTilt: -TAU * 0.019,
    orbitNode: -TAU * 0.314,
    satelliteOf: 'sun',
    type: 'planet',
  },

  {
    name: 'venus',
    id: 2,
    displayName: 'Venus',
    diameter: 1.5,
    color: '#c18f17',
    orbitDiameter: 16,
    orbitPeriod: 225 / 3,
    orbitTilt: -TAU * 0.009,
    orbitNode: -TAU * 0.213,
    satelliteOf: 'sun',
    type: 'planet',
  },
  {
    name: 'earth',
    id: 3,
    displayName: 'Earth',
    diameter: 2,
    color: '#4f4cb0',
    orbitDiameter: 21,
    orbitPeriod: 365 / 4,
    satelliteOf: 'sun',
    type: 'planet',
  },
  {
    name: 'mars',
    id: 4,
    displayName: 'Mars',
    diameter: 1.25,
    color: '#bc420e',
    orbitDiameter: 26,
    orbitPeriod: 687 / 5,
    orbitTilt: -TAU * 0.005,
    orbitNode: -TAU * 0.138,
    satelliteOf: 'sun',
    type: 'planet',
  },
  {
    name: 'jupiter',
    id: 5,
    displayName: 'Jupiter',
    diameter: 4,
    color: '#ad7b5a',
    orbitDiameter: 40,
    orbitPeriod: 4333 / 7,
    orbitTilt: -TAU * 0.004,
    orbitNode: -TAU * 0.279,
    satelliteOf: 'sun',
    type: 'planet',
  },
  {
    name: 'saturn',
    id: 6,
    displayName: 'Saturn',
    diameter: 3,
    color: '#a37c33',
    orbitDiameter: 56,
    orbitPeriod: 10759 / 9,
    orbitTilt: -TAU * 0.007,
    orbitNode: -TAU * 0.316,
    satelliteOf: 'sun',
    type: 'planet',
  },
  {
    name: 'uranus',
    id: 7,
    displayName: 'Uranus',
    diameter: 2.75,
    color: '#5dacde',
    orbitDiameter: 72,
    orbitPeriod: 30689 / 13,
    orbitTilt: -TAU * 0.002,
    orbitNode: -TAU * 0.206,
    satelliteOf: 'sun',
    type: 'planet',
  },
  {
    name: 'neptune',
    id: 8,
    displayName: 'Neptune',
    diameter: 2.5,
    color: '#3d52b5',
    orbitDiameter: 88,
    orbitPeriod: 60182 / 17,
    orbitTilt: -TAU * 0.005,
    orbitNode: -TAU * 0.366,
    satelliteOf: 'sun',
    type: 'planet',
  },
  {
    name: 'pluto',
    id: 9,
    displayName: 'Pluto',
    diameter: 0.5,
    color: '#826e57',
    orbitDiameter: 106,
    orbitPeriod: 90560 / 25,
    orbitTilt: -TAU * 0.048,
    orbitNode: -TAU * 0.306,
    orbitTranslateZ: -5,
    satelliteOf: 'sun',
    type: 'planet',
  },
  {
    name: 'moon',
    id: 10,
    displayName: 'Moon',
    diameter: 0.5,
    color: '#d6d6d6',
    orbitDiameter: 3,
    orbitPeriod: 27 / 2,
    orbitTilt: -TAU * 0.065,
    orbitNode: -TAU * 0.347,
    satelliteOf: 'earth',
    type: 'moon',
  },
  {
    name: 'io',
    id: 11,
    displayName: 'Io',
    diameter: 0.5,
    color: '#eae565',
    orbitDiameter: 5,
    orbitPeriod: 1 * 20,
    orbitTilt: 0,
    satelliteOf: 'jupiter',
    type: 'moon',
  },
  {
    name: 'europa',
    id: 12,
    displayName: 'Europa',
    diameter: 0.5,
    color: '#9c7e5c',
    orbitDiameter: 6.5,
    orbitPeriod: 4 * 8,
    orbitTilt: -TAU * 0.001,
    satelliteOf: 'jupiter',
    type: 'moon',
  },
  {
    name: 'ganymede',
    id: 13,
    displayName: 'Ganymede',
    diameter: 0.75,
    color: '#a1907e',
    orbitDiameter: 8,
    orbitPeriod: 7 * 6,
    orbitTilt: -TAU * 0.001,
    satelliteOf: 'jupiter',
    type: 'moon',
  },
  {
    name: 'callisto',
    id: 14,
    displayName: 'Callisto',
    diameter: 0.5,
    color: '#4a4e4f',
    orbitDiameter: 10,
    orbitPeriod: 17 * 3,
    orbitTilt: -TAU * 0.01,
    satelliteOf: 'jupiter',
    type: 'moon',
  },
  {
    name: 'ringSaturn',
    color: '#edc98566',
    orbitDiameter: 4,
    orbitTilt: -TAU * 0.05,
    satelliteOf: 'saturn',
    ring: 4,
  },
];
/**
 * To simplify state transitions, I'm creating this "master" js file that will have all available states for the app.
  Components will reference AppData to get props and we'll need to manage this object as data gets loaded in.
 */
class AppDataImpl {
  constructor() {
    /**
     * NASA's API key
     * @type {string}
     */
    this.NASA_API_KEY = 'buEpNbTXwpkoPmCnvOBpGbDZgr5x5JgdmPoD8sfQ';
    /**
     * A model for the main navigation
     * @type {MainNav}
     */
    this.nav = {
      main: [
        {
          title: 'Home',
          key: '/',
        },
        {
          title: 'Stars',
          key: 'stars',
        },
        {
          title: 'Exoplanets',
          key: 'planets',
        },
        {
          title: 'Pic of the Day',
          key: 'apod',
        },
        {
          title: 'About',
          key: 'about',
        },
      ],
      dropdown: [
        {
          title: 'Random Planet',
          key: 'random-planet',
          show: 'always',
        },
        {
          title: 'Sign Out',
          key: 'signout',
          show: 'signedin',
          divider: true,
        },
      ],
    };
    /**
     * A model for the solar system
     */
    this.solarSystem = SOLAR_SYSTEM;
    /**
     * An array of stars
     * @type {Star[]}
     */
    this.stars = [];
    /**
     * An array of planets
     * @type {Planet[]}
     */
    this.exoplanets = [];
    /**
     * A boolean to express if the app is in a loading state
     * @type {boolean}
     */
    this.loading = true;
    /**
     * A list of fields with stellar properties.
     * These will be displayed in the table next to the star system.
     * @type {PlanetaryProperties[]}
     */
    this.stellarFields = [
      {
        id: 'distanceFromEarth',
        label: 'Distance from Earth',
        description: 'Distance of the star from Earth',
        link: 'https://en.wikipedia.org/wiki/Stellar_parallax#:~:text=The%20approximate%20distance%20is%20simply,parsecs%20(4.24%20ly)%20distant.',
      },
      {
        id: 'starType',
        label: 'Star Type',
        description: 'Star Type according to the XXX scale',
        link: 'https://en.wikipedia.org/wiki/Stellar_classification',
      },
      {
        id: 'constellation',
        label: 'Constellation',
        description: 'Constellation this star is part of',
        link: 'https://en.wikipedia.org/wiki/Constellation',
      },
      {
        id: 'disc_year',
        label: 'Discovery Year',
        description: 'The year the star was discovered',
        link: 'https://en.wikipedia.org/wiki/History_of_astronomy',
      },
      {
        id: 'sy_snum',
        label: 'Number of Stars',
        description: 'Number of stars in the planetary system',
        link: 'https://en.wikipedia.org/wiki/Star',
      },
      {
        id: 'sy_pnum',
        label: 'Number of Planets',
        description: 'Number of planets in the planetary system',
        link: 'https://en.wikipedia.org/wiki/Planet',
      },
      {
        id: 'sy_mnum',
        label: 'Number of Moons',
        description: 'Number of moons in the planetary system',
        link: 'https://en.wikipedia.org/wiki/Moon',
      },
      {
        id: 'st_teff',
        label: 'Stellar Effective Temperature [K]',
        description:
          'Temperature of the star as modeled by a black body emitting the same total amount of electromagnetic radiation',
        link: 'https://en.wikipedia.org/wiki/Stellar_classification',
      },
      {
        id: 'st_rad',
        label: 'Stellar Radius [Solar Radius]',
        description:
          'Length of a line segment from the center of the star to its surface, measured in units of radius of the Sun',
        link: 'https://en.wikipedia.org/wiki/Solar_radius',
      },
      {
        id: 'st_mass',
        label: 'Stellar Mass [Solar mass]',
        description:
          'Amount of matter contained in the star, measured in units of masses of the Sun',
        link: 'https://en.wikipedia.org/wiki/Stellar_mass',
      },
      {
        id: 'rastr',
        label: 'RA [sexagesimal]',
        description:
          'Right Ascension of the planetary system in sexagesimal format',
        link: 'https://en.wikipedia.org/wiki/Right_ascension',
      },
      {
        id: 'decstr',
        label: 'Dec [sexagesimal]',
        description:
          'Declination of the planetary system in sexagesimal notation',
        link: 'https://en.wikipedia.org/wiki/Declination',
      },
      {
        id: 'sy_dist',
        label: 'Distance [pc]',
        description: 'Distance to the planetary system in units of parsecs',
        link: 'https://pt.wikipedia.org/wiki/Parsec',
      },
      {
        id: 'sy_plx',
        label: 'Parallax [mas]',
        description:
          "Difference in the angular position of a star as measured at two opposite positions within the Earth's orbit",
        link: 'https://en.wikipedia.org/wiki/Stellar_parallax',
      },
      {
        id: 'elat',
        label: 'Ecliptic Latitude [deg]',
        description:
          'Ecliptic latitude of the planetary system in units of decimal degrees',
        link: 'https://en.wikipedia.org/wiki/Ecliptic_coordinate_system#:~:text=Ecliptic%20latitude%20or%20celestial%20latitude,celestial%20latitude%20of%20%2B90%C2%B0.',
      },
      {
        id: 'elon',
        label: 'Ecliptic Longitude [deg]',
        description:
          'Ecliptic longitude of the planetary system in units of decimal degrees',
        link: 'https://en.wikipedia.org/wiki/Ecliptic_coordinate_system#:~:text=Ecliptic%20latitude%20or%20celestial%20latitude,celestial%20latitude%20of%20%2B90%C2%B0.',
      },
      {
        id: 'glat',
        label: 'Galactic Latitude [deg]',
        description:
          'Galactic latitude of the planetary system in units of decimal degrees',
        link: 'https://en.wikipedia.org/wiki/Galactic_coordinate_system',
      },
      {
        id: 'glon',
        label: 'Galactic Longitude [deg]',
        description:
          'Galactic longitude of the planetary system in units of decimal degrees',
        link: 'https://en.wikipedia.org/wiki/Galactic_coordinate_system',
      },
      {
        id: 'sy_pmra',
        label: 'Proper Motion (RA) [mas/yr]',
        description:
          'Angular change in right ascension over time as seen from the center of mass of the Solar System',
        link: 'https://en.wikipedia.org/wiki/Proper_motion',
      },
      {
        id: 'sy_pmdec',
        label: 'Proper Motion (Dec) [mas/yr]',
        description:
          'Angular change in declination over time as seen from the center of mass of the Solar System',
        link: 'https://en.wikipedia.org/wiki/Proper_motion',
      },
      {
        id: 'sy_tmag',
        label: 'TESS Magnitude',
        description:
          'Brightness of the host star as measured using the TESS bandpass, in units of magnitudes',
        link: 'https://en.wikipedia.org/wiki/Transiting_Exoplanet_Survey_Satellite',
      },
      {
        id: 'sy_pm',
        label: 'Total Proper Motion [mas/yr]',
        description:
          'Angular change in position over time as seen from the center of mass of the Solar System',
        link: 'https://en.wikipedia.org/wiki/Proper_motion',
      },
      {
        id: 'st_met',
        label: 'Stellar Metallicity [dex]',
        description:
          'Measurement of the metal content of the photosphere of the star as compared to the hydrogen content',
        link: 'https://en.wikipedia.org/wiki/Stellar_metallicity',
      },
      {
        id: 'st_metratio',
        label: 'Stellar Metallicity Ratio',
        description:
          'Ratio for the Metallicity Value ([Fe/H] denotes iron abundance, [M/H] refers to a general metal content)',
        link: 'https://en.wikipedia.org/wiki/Stellar_metallicity',
      },
      {
        id: 'st_lum',
        label: 'Stellar Luminosity [log10(Solar)]',
        description:
          'Amount of energy emitted by a star per unit time, measured in units of solar luminosities',
        link: 'https://en.wikipedia.org/wiki/Stellar_luminosity',
      },
      {
        id: 'st_age',
        label: 'Stellar Age [Gyr]',
        description: 'The age of the host star',
        link: 'https://en.wikipedia.org/wiki/Stellar_age_estimation',
      },
      {
        id: 'st_dens',
        label: 'Stellar Density [g/cm**3]',
        description: 'Amount of mass per unit of volume of the star',
        link: 'https://en.wikipedia.org/wiki/Stellar_density',
      },
      {
        id: 'st_rotp',
        label: 'Stellar Rotational Period [days]',
        description:
          'The time required for the planet host star to complete one rotation, assuming it is a solid body',
        link: 'https://en.wikipedia.org/wiki/Rotation_period',
      },
    ];
    /**
     * A list of fields with the planetary properties.
     * These will be displayed in the table next to the planet description.
     * @type {PlanetaryProperties[]}
     */
    this.planetFields = [
      {
        id: 'pl_hostname',
        label: 'Host Star',
        description: 'The Star hosting this planet',
        link: 'https://en.wikipedia.org/wiki/Planet-hosting_star',
      },
      {
        id: 'planet_type',
        label: 'Planet Type',
        description: 'A description of the type of the planet',
        link: 'https://en.wikipedia.org/wiki/List_of_planet_types',
      },
      {
        id: 'plType',
        label: 'Sub-Type',
        description:
          "A description of the planet's visuals, according to NASA.",
        link: 'https://en.wikipedia.org/wiki/List_of_planet_types',
      },
      {
        id: 'mass_display',
        label: 'Mass',
        description: "A human readable display of the planet's mass",
        link: 'https://en.wikipedia.org/wiki/Planetary_mass',
      },
      {
        id: 'period_display',
        label: 'Period',
        description: "A human readable display of the planet's orbital period",
        link: 'https://en.wikipedia.org/wiki/Orbital_period#:~:text=The%20orbital%20period%20(also%20revolution,other%20stars%2C%20or%20binary%20stars.',
      },
      {
        id: 'disc_year',
        label: 'Discovery Year',
        description: 'The year the planet was discovered',
        link: 'https://en.wikipedia.org/wiki/Discoveries_of_exoplanets',
      },
      {
        id: 'pl_discmethod',
        label: 'Discovery Method',
        description: "Planet's discovery method",
        link: 'https://en.wikipedia.org/wiki/Methods_of_detecting_exoplanets',
      },
      {
        id: 'pl_facility',
        label: 'Facility',
        description: 'The facility that discovered the planet',
        link: 'https://exoplanets.psu.edu/category/facilities/',
      },
      {
        id: 'pl_radj',
        label: 'Radius J',
        description: "Planet's radius in Jupiter radii",
        link: 'https://en.wikipedia.org/wiki/Jupiter_radius',
      },
      {
        id: 'pl_rade',
        label: 'Radius E',
        description: "Planet's radius in Earth radii",
        link: 'https://en.wikipedia.org/wiki/Earth_radius',
      },
      {
        id: 'pl_orbeccen',
        label: 'Orbital Eccentricity',
        description:
          'In astrodynamics, the orbital eccentricity of an astronomical object is a dimensionless parameter that determines the amount by which its orbit around another body deviates from a perfect circle.',
        link: "https://en.wikipedia.org/wiki/Orbital_eccentricity#:~:text=The%20eccentricity%20of%20Earth's%20orbit,gravitational%20attractions%20among%20the%20planets.",
      },
    ];
    /**
     * A small map of star types and a link to an image representing them.
     * @type {{[type: string]: string}}
     */
    this.stellarImages = {
      M: 'static/M.webp',
      K: 'static/K.webp',
      L: 'static/L.webp',
      G: 'static/G.webp',
      F: 'static/F.webp',
      A: 'static/A.webp',
      B: 'static/B.webp',
      O: 'static/O.webp',
    };
  }
  getFormattedDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  /**
   * Controls weather the app is loading data.
   * @param {boolean} value - the value to set loading to
   */
  setLoading = (value) => {
    this.loading = value;
  };
  /**
   * Returns a visual representation for a star based on the type.
   * @param {{'M', 'K', 'L', 'G', 'F', 'A', 'B', 'O'}} stellarClass - The class of the star as per the luminosity class.
   * @returns {string} - An url to an image of the star.
   */
  getStellarImage = (stellarClass) => {
    return stellarClass in this.stellarImages
      ? this.stellarImages[stellarClass]
      : null;
  };
  /**
   * Loads the main App Data.
   * It consists of two JSOn files that are loaded in parallel.
   * Since this function is async, you need to use await to wait for it to finish.
   */
  loadData = async () => {
    this.setLoading(true);
    if (this.exoplanets.length == 0) {
      console.time('loading_exos');
      const binary = await fetch('/data/out/exoplanets.json');
      this.exoplanets = await binary.json();
      console.timeEnd('loading_exos');
    }
    //
    if (this.stars.length == 0) {
      console.time('loading_stars');
      const binary = await fetch('/data/out/exostars.json');
      this.stars = await binary.json();
      console.timeEnd('loading_stars');
      //console.log("Stars Loaded: ", this.stars.length);
    }
    this.setLoading(false);
  };
  /**
   * Returns the astronomy picture of the day for the given date.
   * @returns {Object} - the APOD response object
   */
  loadAstronomyPictureOfTheDay = async (date) => {
    console.time('loading_apod');
    if (!date) {
      //set date to today's date in YYYY-MM-DD format
      date = new Date().toISOString().split('T')[0];
    }
    const binary = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${this.NASA_API_KEY}&date=${date}`
    );
    const apod = await binary.json();
    console.timeEnd('loading_apod');
    return apod;
  };
  /**
   * Returns a star based on its id.
   * @param {string} id - The id, or hostname of the star as it is commonly known in literature.
   * @returns {Star} - the star object with that ID
   */
  getStar = (id) => {
    //console.log("this.stars", this.stars.length, id);
    return this.stars.find((s) => {
      //console.log(s.id);
      return s.id === id;
    });
  };
  /**
   * Returns a planet based on its id.
   * @param {string} id - the id of the planet as it is commonly known in literature.
   * @returns {Planet} - the planet object with that ID.
   */
  findExoplanetById = (id) => {
    return this.exoplanets.find((e) => {
      return e.id === id;
    });
  };
  /**
   * Creates a Solar system based on a host star.
   * This method returns an array
   * @param {Star} star - The star host of the solar system
   * @returns {Array<StellarBody>} - An array of stellar bodies of the solar system
   */
  generateSolarSystem = (star) => {
    return SolarSystemFactory.generate(star, this.exoplanets);
  };
  static getInstance() {
    if (!this.instance) {
      this.instance = new AppDataImpl();
    }

    return this.instance;
  }
}
const AppData = AppDataImpl.getInstance();
export default AppData;
