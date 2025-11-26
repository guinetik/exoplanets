import './types';
import Zdog from 'zdog';
const { TAU } = Zdog;
const SolarSystemFactory = {
  stellarColors: {
    M: '#fe0000',
    K: '#ff6600  ',
    G: '#ffff00',
    F: '#feff99',
    A: '#ffffff',
    B: '#99cdff',
    O: '#0071c1',
  },
  neptuneLikeColors: ['#30838C', '#44A6A6', '#7AF4FE', '#4681A6', '#2B5F8C'],
  gasGiantColors: ['#734040', '#A67360', '#D9A384', '#8C311C', '#D98825'],
  terrestrialColors: ['#ce4436', '#b13230', '#a32e2c', '#ff4847', '#ff6443'],
  superEarthColors: ['#736048', '#736048', '#627173', '#A9C2D9'],
  getPlanetColor: (planet, id) => {
    const planetColors = {
      'neptune-like': ['#30838C', '#44A6A6', '#7AF4FE', '#4681A6', '#2B5F8C'],
      terrestrial: ['#ce4436', '#b13230', '#a32e2c', '#ff4847', '#ff6443'],
      'super earth': ['#736048', '#736048', '#627173', '#A9C2D9'],
      'gas giant': ['#734040', '#A67360', '#D9A384', '#8C311C', '#D98825'],
    };
    const query = planet.planet_type.toLowerCase();
    return planetColors[query][id % planetColors[query].length];
  },
  getStarColorByStarType(type) {
    return SolarSystemFactory.stellarColors[type]
      ? SolarSystemFactory.stellarColors[type]
      : '#eb710b';
  },
  findExoplanetById: (id, exoplanets) => {
    return exoplanets.find((e) => {
      return e.id === id;
    });
  },
  /**
   * Creates a Solar system based on a host star.
   * This method returns an array
   * @param {Star} star - The star host of the solar system
   * @returns {Array<StellarBody>} - An array of stellar bodies of the solar system
   */
  generate: function (star, exoplanets) {
    //console.log("star_radius", star.st_rad);
    const solarSystem = [
      {
        name: star.id,
        displayName: `${star.displayName} - Type: ${star.starType}. ${star.st_teff}K`,
        diameter: 8 * (1 + star.st_rad), //multiplying 8 (default value for our Sun) by st_rad which is the radius of the star measured in units of radius of the Sun
        color: SolarSystemFactory.getStarColorByStarType(star.starType),
        orbitDiameter: 0,
        starLight: 1.2 * star.st_lum, //multplying 1.2 (default value for our Sun) by st_lum which is the luminosity of the star measured in units of solar luminosities
        starColor: '#eb710b66',
        type: 'star',
      },
    ];
    //
    const planetCounts = {
      neptuneLike: 0,
      terrestrial: 0,
      superEarth: 0,
      gasGiant: 0,
    };
    star.planets.forEach((p) => {
      const planet = SolarSystemFactory.findExoplanetById(p, exoplanets);
      if (planet) {
        const pp = SolarSystemFactory.generatePlanet(
          planet,
          planetCounts,
          star
        );
        if (pp.length) {
          pp.forEach((k) => {
            solarSystem.push(k);
          });
        } else {
          solarSystem.push(pp);
        }
      }
    });
    return solarSystem;
  },
  /**
   * Generates a planet render for Zdog based on a planet's data
   * TODO: refactor this code so it's less imperative and more functional. think of creating a function that receives exo and returns a value for each parameter
   * @param {Planet} planet - The planet to generate
   * @returns {StellarBody} - The stellar body of the solar system
   */
  generatePlanet: function (exo, planetCounts, star) {
    /*
    lets try a less imperative way of doing this. return a single obj once and have functions to determine the value of params from the exo object
    return {
      name: exo.id,
      id: exo.id,
      displayName: `${exo.display_name} - ${exo.planet_type}`,
      diameter: getPlanetDiameter(exo),
      color: getColor(exo),
      orbitDiameter: getOrbitDiameter(exo),
      orbitPeriod: getOrbitPeriod(exo),
      orbitTilt: getOrbitTilt(exo),
      orbitNode: getOrbitNode(exo),
      satelliteOf: star.id,
      type: "planet",
    };
    */
    switch (exo.planet_type.toLowerCase()) {
      case 'neptune-like':
        /* console.log(
          "processing Neptune-like...",
          planetCounts.neptuneLike,
          exo.plType,
          exo.pl_radj,
          exo.pl_orbper,
          exo.pl_orbeccen
        ); */
        planetCounts.neptuneLike++;
        if ('sub-neptunian' === exo.plType.toLowerCase()) {
          //console.log("rendering sub neptunian");
          // if counter is divisible by 2, then we render a Pluto-like planet
          if (planetCounts.neptuneLike % 2 === 0) {
            return {
              name: exo.id,
              id: exo.id,
              displayName: `${exo.display_name} - ${exo.planet_type}`,
              diameter: 4 * exo.pl_radj * 2,
              color:
                SolarSystemFactory.neptuneLikeColors[
                  planetCounts.neptuneLike %
                    SolarSystemFactory.neptuneLikeColors.length
                ],
              orbitDiameter:
                72 * (planetCounts.neptuneLike / 2 + star.st_rad / 2),
              orbitPeriod: 365 / exo.pl_orbper + 365 / 2,
              orbitTilt: -TAU * exo.pl_orbeccen,
              orbitNode: -TAU * (0.206 * planetCounts.neptuneLike),
              satelliteOf: star.id,
              type: 'planet',
              exo: exo,
            };
          } else {
            //console.log("rendering pluto-like");
            return {
              name: exo.id,
              id: exo.id,
              displayName: `${exo.display_name} - ${exo.planet_type}`,
              diameter: 4 * exo.pl_radj * 2,
              color:
                SolarSystemFactory.neptuneLikeColors[
                  planetCounts.neptuneLike %
                    SolarSystemFactory.neptuneLikeColors.length
                ],
              orbitDiameter:
                90 * (planetCounts.neptuneLike / 2 + star.st_rad / 2),
              orbitPeriod: 365 / exo.pl_orbper + 365 / 2,
              orbitTilt: -TAU * exo.pl_orbeccen,
              orbitNode: -TAU * 0.306,
              orbitTranslateZ: -5, //weird-ass pluto orbit
              satelliteOf: star.id,
              type: 'planet',
              exo: exo,
            };
          }
        } else {
          // if counter not divisible by 2, render a neptune-like planet
          return {
            name: exo.id,
            id: exo.id,
            displayName: `${exo.display_name} - ${exo.planet_type}`,
            diameter: 4 * exo.pl_radj * 2,
            color:
              SolarSystemFactory.neptuneLikeColors[
                planetCounts.neptuneLike %
                  SolarSystemFactory.neptuneLikeColors.length
              ],
            orbitDiameter:
              80 * (planetCounts.neptuneLike / 2 + star.st_rad / 2), //large orbital diameters
            orbitPeriod: 365 / exo.pl_orbper + 365 / 2,
            orbitTilt: -TAU * exo.pl_orbeccen,
            orbitNode: -TAU * (0.366 * planetCounts.neptuneLike),
            satelliteOf: star.id,
            type: 'planet',
            exo: exo,
          };
        }
        break;
      case 'terrestrial':
        planetCounts.terrestrial++;
        /* console.log(
          "processing Terrestrial...",
          planetCounts.terrestrial,
          exo.visType
        ); */
        return {
          name: exo.id,
          id: exo.id,
          displayName: `${exo.display_name} - ${exo.planet_type}`,
          diameter: 4 * exo.pl_radj * 6,
          color:
            exo.visType.toLowerCase() === 'lavaatmos'
              ? SolarSystemFactory.terrestrialColors[
                  planetCounts.terrestrial %
                    SolarSystemFactory.terrestrialColors.length
                ]
              : SolarSystemFactory.superEarthColors[
                  planetCounts.terrestrial %
                    SolarSystemFactory.superEarthColors.length
                ],
          orbitDiameter: 26 * (1 + planetCounts.terrestrial + star.st_rad / 2),
          orbitPeriod: 365 / exo.pl_orbper + 365,
          orbitTilt: -TAU * exo.pl_orbeccen,
          orbitNode: -TAU * (0.138 * planetCounts.terrestrial),
          satelliteOf: star.id,
          type: 'planet',
          exo: exo,
        };
        break;
      case 'super earth':
        planetCounts.superEarth++;
        /* console.log(
          "processing super earth...",
          planetCounts.superEarth,
          exo.visType
        ); */
        return {
          name: exo.id,
          id: exo.id,
          displayName: `${exo.display_name} - ${exo.planet_type}`,
          diameter: 4 * exo.pl_radj * 6,
          color:
            exo.visType.toLowerCase() === 'lavaatmos'
              ? SolarSystemFactory.terrestrialColors[
                  planetCounts.superEarth %
                    SolarSystemFactory.superEarthColors.length
                ]
              : SolarSystemFactory.superEarthColors[
                  planetCounts.superEarth %
                    SolarSystemFactory.superEarthColors.length
                ],
          orbitDiameter: 21 * (1 + planetCounts.superEarth + star.st_rad / 2),
          orbitPeriod: 365 / exo.pl_orbper,
          orbitTilt: -TAU * exo.pl_orbeccen,
          orbitNode: -TAU * (0.138 * planetCounts.superEarth),
          satelliteOf: star.id,
          type: 'planet',
          exo: exo,
        };
      case 'gas giant':
        planetCounts.gasGiant++;
        /* console.log(
          "processing gas giant...",
          planetCounts.gasGiant,
          exo.plType,
          exo.pl_radj,
          exo.pl_orbper
        ); */
        if (exo.plType.toLowerCase() === 'super-jovian') {
          //rendering a Jupiter-style gass gianet
          //console.log("rendering jupiter style");
          return {
            name: exo.id,
            id: exo.id,
            displayName: `${exo.display_name} - ${exo.planet_type}`,
            diameter: 4 * exo.pl_radj,
            color:
              SolarSystemFactory.gasGiantColors[
                planetCounts.gasGiant % SolarSystemFactory.gasGiantColors.length
              ],
            orbitDiameter: 40 * (1 + star.st_rad / 2),
            orbitPeriod: 365 / exo.pl_orbper + 365 / 2,
            orbitTilt: -TAU * exo.pl_orbeccen,
            orbitNode: -TAU * (0.279 * planetCounts.gasGiant),
            satelliteOf: star.id,
            type: 'planet',
            exo: exo,
          };
        } else if (exo.plType.toLowerCase() === 'jovian') {
          //console.log("rendering ringed planet");
          // if it's the second gas giant, we a little ring, like Saturn 🪐
          const planetz = [];
          planetz.push({
            name: exo.id,
            id: exo.id,
            displayName: `${exo.display_name} - ${exo.planet_type}`,
            diameter: 4 * exo.pl_radj,
            color:
              SolarSystemFactory.gasGiantColors[
                planetCounts.gasGiant % SolarSystemFactory.gasGiantColors.length
              ],
            orbitDiameter: 56 * (1 + star.st_rad / 2),
            orbitPeriod: 365 / exo.pl_orbper + 365 / 2,
            orbitTilt: -TAU * exo.pl_orbeccen,
            orbitNode: -TAU * (0.316 * planetCounts.gasGiant),
            satelliteOf: star.id,
            type: 'planet',
            exo: exo,
          });
          planetz.push({
            name: 'ringSaturn',
            color: '#edc98566',
            orbitDiameter: 6 * (1 + star.st_rad / 2),
            orbitTilt: -TAU * 0.05,
            satelliteOf: exo.id,
            ring: 4,
          });
          return planetz;
        } else {
          return {
            name: exo.id,
            id: exo.id,
            displayName: `${exo.display_name} - ${exo.planet_type}`,
            diameter: 4 * exo.pl_radj * 2,
            color:
              SolarSystemFactory.gasGiantColors[
                planetCounts.gasGiant % SolarSystemFactory.gasGiantColors.length
              ],
            orbitDiameter: 72 * (1 + star.st_rad / 2),
            orbitPeriod: 365 / exo.pl_orbper + 365 / 2,
            orbitTilt: -TAU * exo.pl_orbeccen,
            orbitNode: -TAU * (0.206 * planetCounts.gasGiant),
            satelliteOf: star.id,
            type: 'planet',
            exo: exo,
          };
        }

      default:
        return {
          name: exo.id,
          id: exo.id,
          displayName: `${exo.display_name} - ${exo.planet_type}`,
          diameter: 1 * (1 + star.st_rad / 2),
          color: '#ada8a5',
          orbitDiameter: 12 * (1 + star.st_rad / 2),
          orbitPeriod: 365 / 2,
          orbitTilt: -TAU * exo.pl_orbeccen,
          orbitNode: -TAU * 0.314,
          satelliteOf: star.id,
          type: 'planet',
          exo: exo,
        };
    }
  },
};
export default SolarSystemFactory;
