// the column names for the API are impossible to remember
// so I'm creating this typedef doc to help me with Intelisense on the fields
// https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html
/**
 * @typedef Star
 * @type {object}
 * @property {string} id - ID of star links to a star page
 * @property {number} ra - Right Ascension of the Star in decimal degrees
 * @property {number} sy_dist - Distance to the planetary system in units of parsecs
 * @property {string} disc_year - Year the planet was discovered
 * @property {number} st_mass - Amount of matter contained in the star, measured in units of masses of the Sun
 * @property {number} st_teff - Temperature of the star as modeled by a black body emitting the same total amount of electromagnetic radiation
 * @property {number} st_rad - Length of a line segment from the center of the star to its surface, measured in units of radius of the Sun
 * @property {string} hostname - Stellar name most commonly used in the literature
 * @property {string} starType - Stellar classification of the star based on their spectral characteristics.
 * @property {Array<number>} color - Suggested color of the star by NASA
 * @property {string} constellation - Constellation the star is located in
 * @property {string} displayName - The name of the star as it is displayed in the API
 * @property {Array<String>} planets - List of the names of the planets in the system
 * @property {Position3D} positionJ2000 - Position of the star in the cosmos
 * @property {string} distanceFromEarth - Human-readable distance from Earth to the star
 * @property {string} rastr - Right Ascension of the planetary system in sexagesimal format
 * @property {string} decstr - Declination of the planetary system in sexagesimal notation
 * @property {number} sy_plx - Difference in the angular position of a star as measured at two opposite positions within the Earth's orbit
 * @property {number} elat - Ecliptic latitude of the planetary system in units of decimal degrees
 * @property {number} elon - Ecliptic longitude of the planetary system in units of decimal degrees
 * @property {number} glat - Galactic latitude of the planetary system in units of decimal degrees
 * @property {number} glon - Galactic longitude of the planetary system in units of decimal degrees
 * @property {number} sy_pmra - Angular change in right ascension over time as seen from the center of mass of the Solar System
 * @property {number} sy_pmdec - Angular change in declination over time as seen from the center of mass of the Solar System
 * @property {number} sy_tmag - Brightness of the host star as measured using the TESS bandpass, in units of magnitudes
 * @property {number} sy_pm - Angular change in position over time as seen from the center of mass of the Solar System
 * @property {number} sy_snum - Number of stars in the planetary system
 * @property {number} sy_pnum - Number of planets in the planetary system
 * @property {number} sy_mnum - Number of moons in the planetary system
 * @property {number} st_met - Measurement of the metal content of the photosphere of the star as compared to the hydrogen content
 * @property {string} st_metratio - Ratio for the Metallicity Value ([Fe/H] denotes iron abundance, [M/H] refers to a general metal content)
 * @property {number} st_lum - Amount of energy emitted by a star per unit time, measured in units of solar luminosities
 * @property {number} st_age - The age of the host star
 * @property {number} st_dens - Amount of mass per unit of volume of the star
 * @property {number} st_rotp - The time required for the planet host star to complete one rotation, assuming it is a solid body
 */
/**
 * @typedef Planet
 * @type {object}
 * @property {string} pl_hostname - The Star hosting this planet
 * @property {string} id - ID of the stellar body, links to a planet page
 * @property {string} pl_letter - The letter of the planet in the System
 * @property {string} display_name - The name of the stellar body to display
 * @property {string} description - The description of the stellar body
 * @property {string} url - The URL of the stellar body in the exoplanet catalog
 * @property {string} mass_display - A human readable display of the planet's mass
 * @property {number} planet_type - A description of the type of the planet
 * @property {number} pl_radj - Planet's radius in Jupiter radii
 * @property {number} pl_rade - Planet's radius in Earth radii
 * @property {string} pl_discmethod - Planet's discovery method
 * @property {string} image - The URL of the planet's image
 * @property {string} list_image - The URL of the planet's image for the list
 * @property {string} short_description - A short description of the planet
 * @property {string} subtitle - The subtitle of the planet
 * @property {string} pl_facility - The facility that discovered the planet
 * @property {string} pl_bmasse - The planet's mass in Earth masses
 * @property {string} pl_orbper - The planet's orbital period in days
 * @property {string} pl_orbeccen - The planet's eccentricity
 * @property {string} discoverymethod - The planet's discovery method
 * @property {string} disc_year - The year the planet was discovered
 * @property {string} disc_facility - The facility that discovered the planet
 * @property {string} plType - The type of the planet
 * @property {string} visType - The type of the planet's visual
 * @property {string} period_display - A human readable display of the planet's orbital period
 */
/**
 * @typedef StellarBody
 * @type {object}
 * @property {string} name - Name of the stellar body
 * @property {string} id - ID of the stellar body, links to a planet page
 * @property {string} displayName - The name of the stellar body to display
 * @property {number} diameter - The Diameter in which to render the stellar body, based on it's radius
 * @property {string} color - The color of the stellar body
 * @property {number} orbitDiameter - The orbit diameter in which to render the stellar body, based on it's radius
 * @property {number} orbitPeriod - The orbit period in which to render the stellar body, based on it's radius
 * @property {number} orbitTilt - The orbit tilt in which to render the stellar body, based on it's rotation
 * @property {number} orbitNode - The node in which to render the stellar body, based on it's rotation
 * @property {string} starColor - The color of the stellar body
 * @property {string} orbitTranslateZ - The angle to translate the stellar body in Z rotation
 * @property {string} satelliteOf - Which other sterllar body of the solar system to anchor this body to
 * @property {string} type - the type of stellar body "star" or "planet"
 */
/**
 * @typedef PlanetReviews
 * @type {object}
 * @property {string} id - id of the Review
 * @property {Date} date - Date the review as posted
 * @property {string} planet - A reference to the planet's ID
 * @property {number} rate - The rating of the review
 * @property {string} title - The title of the review
 * @property {string} text - The text of the review
 * @property {number} userid - A reference to the user's ID
 */
/**
 * @typedef User
 * @type {object}
 * @property {string} uid - id of the User
 * @property {string} authProvider - Where the user was crated from
 * @property {string} name - User's name
 * @property {number} email - User's email
 * @property {string} avatar - The text of the review
 */
/**
 * @typedef { import("firebase/firestore").QueryConstraint} QueryConstraint
 */
/**
 * @typedef { import("firebase/firestore").Query } Query
 */
/**
 * @typedef { import("firebase/firestore").CollectionReference } CollectionReference
 */
/**
 * @typedef { import("firebase/firestore").QuerySnapshot } QuerySnapshot
 */
/**
 * @typedef { import("firebase/app").FirebaseApp } FirebaseApp
 */
/**
 * @typedef MainNavItem
 * @type {object}
 * @property {string} title - The name of the item as it displays in the navbar
 * @property {string} key - A key to associate with the item, it will become a href in the navbar
 * @property {('always'|'signedin'|'signedout')} show - When to show the item in the navbar
 */
/**
 * @typedef MainNav
 * @type {object}
 * @property {Array<MainNavItem>} main - The main navigation
 * @property {Array<MainNavItem>} dropdown - The dropdown navigation
 */
/**
 * @typedef PlanetaryProperties
 * The planetary properties are something kind of complex to show in a page.
 * So I'm trying to give the user as much context as possible so we have a description and a link for more info.
 * @type {object}
 * @property {string} id - The id of the property. This will map to a prop on the target object.
 * @property {string} label - The name of the property. This will be displayed in the UI.
 * @property {string} description - A human readable description of the property to display in a tooltip.
 * @property {string} link - A link to a wiki page for more info on the property.
 */
