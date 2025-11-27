/**
 * PlanetInfo Component
 * Displays planet properties table and reviews placeholder
 */

import { useTranslation } from 'react-i18next';
import type { Exoplanet } from '../../types';
import { Reviews } from '../Reviews';

// Earth reference values for comparison tooltips (translation keys)
const EARTH_VALUES = {
  pl_rade: { value: 1.0, unit: 'R⊕', labelKey: 'earthRadius' },
  pl_bmasse: { value: 1.0, unit: 'M⊕', labelKey: 'earthMass' },
  pl_dens: { value: 5.51, unit: 'g/cm³', labelKey: 'earthDensity' },
  pl_eqt: { value: 255, unit: 'K', labelKey: 'earthEqTemp' },
  pl_insol: { value: 1.0, unit: 'S⊕', labelKey: 'earthInsolation' },
  pl_orbper: { value: 365.25, unit: 'days', labelKey: 'earthOrbitalPeriod' },
  pl_orbsmax: { value: 1.0, unit: 'AU', labelKey: 'earthSemiMajorAxis' },
  pl_orbeccen: { value: 0.017, unit: '', labelKey: 'earthOrbitalEccentricity' },
  st_teff: { value: 5778, unit: 'K', labelKey: 'sunTemperature' },
  st_met: { value: 0.0, unit: 'dex', labelKey: 'sunMetallicity' },
  st_age: { value: 4.6, unit: 'Gyr', labelKey: 'sunAge' },
};

// Planet property definitions with label keys, formatting, and Earth comparison
interface FieldDef {
  id: string;
  labelKey: string;
  format: (p: Exoplanet, unknown: string) => string;
  earthRef?: keyof typeof EARTH_VALUES;
}

const PLANET_FIELDS: FieldDef[] = [
  {
    id: 'hostname',
    labelKey: 'hostStar',
    format: (p: Exoplanet) => p.hostname,
  },
  {
    id: 'planet_type',
    labelKey: 'planetType',
    format: (p: Exoplanet, unknown: string) => p.planet_type || unknown,
  },
  {
    id: 'pl_rade',
    labelKey: 'radius',
    format: (p: Exoplanet, unknown: string) =>
      p.pl_rade ? `${p.pl_rade.toFixed(2)} R⊕` : unknown,
    earthRef: 'pl_rade',
  },
  {
    id: 'pl_bmasse',
    labelKey: 'mass',
    format: (p: Exoplanet, unknown: string) =>
      p.pl_bmasse ? `${p.pl_bmasse.toFixed(2)} M⊕` : unknown,
    earthRef: 'pl_bmasse',
  },
  {
    id: 'pl_dens',
    labelKey: 'density',
    format: (p: Exoplanet, unknown: string) =>
      p.pl_dens ? `${p.pl_dens.toFixed(2)} g/cm³` : unknown,
    earthRef: 'pl_dens',
  },
  {
    id: 'pl_insol',
    labelKey: 'insolationFlux',
    format: (p: Exoplanet, unknown: string) =>
      p.pl_insol ? `${p.pl_insol.toFixed(2)} S⊕` : unknown,
    earthRef: 'pl_insol',
  },
  {
    id: 'pl_eqt',
    labelKey: 'eqTemperature',
    format: (p: Exoplanet, unknown: string) =>
      p.pl_eqt ? `${p.pl_eqt.toFixed(0)} K` : unknown,
    earthRef: 'pl_eqt',
  },
  {
    id: 'pl_orbper',
    labelKey: 'orbitalPeriod',
    format: (p: Exoplanet, unknown: string) =>
      p.pl_orbper ? `${p.pl_orbper.toFixed(2)} days` : unknown,
    earthRef: 'pl_orbper',
  },
  {
    id: 'pl_orbsmax',
    labelKey: 'semiMajorAxis',
    format: (p: Exoplanet, unknown: string) =>
      p.pl_orbsmax ? `${p.pl_orbsmax.toFixed(3)} AU` : unknown,
    earthRef: 'pl_orbsmax',
  },
  {
    id: 'pl_orbeccen',
    labelKey: 'orbitalEccentricity',
    format: (p: Exoplanet, unknown: string) =>
      p.pl_orbeccen !== null ? p.pl_orbeccen.toFixed(3) : unknown,
    earthRef: 'pl_orbeccen',
  },
];

const STAR_FIELDS: FieldDef[] = [
  {
    id: 'st_teff',
    labelKey: 'starTemperature',
    format: (p: Exoplanet, unknown: string) =>
      p.st_teff ? `${p.st_teff.toFixed(0)} K` : unknown,
    earthRef: 'st_teff',
  },
  {
    id: 'st_met',
    labelKey: 'starMetallicity',
    format: (p: Exoplanet, unknown: string) =>
      p.st_met !== null ? `${p.st_met.toFixed(2)} dex` : unknown,
    earthRef: 'st_met',
  },
  {
    id: 'st_age',
    labelKey: 'starAge',
    format: (p: Exoplanet, unknown: string) =>
      p.st_age ? `${p.st_age.toFixed(2)} Gyr` : unknown,
    earthRef: 'st_age',
  },
];

const DISCOVERY_FIELDS: FieldDef[] = [
  {
    id: 'disc_year',
    labelKey: 'discoveryYear',
    format: (p: Exoplanet, unknown: string) =>
      p.disc_year?.toString() || unknown,
  },
  {
    id: 'discoverymethod',
    labelKey: 'discoveryMethod',
    format: (p: Exoplanet, unknown: string) => p.discoverymethod || unknown,
  },
  {
    id: 'disc_facility',
    labelKey: 'facility',
    format: (p: Exoplanet, unknown: string) => p.disc_facility || unknown,
  },
];

/**
 * Flag tag component with tooltip
 * @param flagKey - The translation key for the flag
 * @param className - Additional CSS classes for styling
 */
function FlagTag({
  flagKey,
  className,
}: {
  flagKey: string;
  className: string;
}) {
  const { t } = useTranslation();
  const label = t(`pages.planet.info.flags.${flagKey}`);
  const description = t(`pages.planet.info.flagDescriptions.${flagKey}`);

  return (
    <span className={`planet-flag ${className}`} title={description}>
      {label}
    </span>
  );
}

/**
 * Reusable property row with optional Earth comparison tooltip
 * @param field - Field definition with label key and format function
 * @param planet - Planet data
 */
function PropertyRow({
  field,
  planet,
}: {
  field: FieldDef;
  planet: Exoplanet;
}) {
  const { t } = useTranslation();
  const earthRef = field.earthRef ? EARTH_VALUES[field.earthRef] : null;
  const unknown = t('pages.planet.info.unknown');
  const value = field.format(planet, unknown);
  const label = t(`pages.planet.info.fields.${field.labelKey}`);
  const earthLabel = earthRef
    ? t(`pages.planet.info.earthRef.${earthRef.labelKey}`)
    : null;

  return (
    <div
      className="planet-property-row"
      title={
        earthRef && earthLabel
          ? `${earthLabel}: ${earthRef.value} ${earthRef.unit}`
          : undefined
      }
    >
      <span className="planet-property-label">
        {label}
        {earthRef && earthLabel && (
          <span
            className="earth-indicator"
            title={`${earthLabel}: ${earthRef.value} ${earthRef.unit}`}
          >
            &#x1F30D;
          </span>
        )}
      </span>
      <span className="planet-property-value">{value}</span>
    </div>
  );
}

interface PlanetInfoProps {
  planet: Exoplanet;
}

/**
 * PlanetInfo component displays detailed information about a planet
 * @param planet - The exoplanet data to display
 */
export function PlanetInfo({ planet }: PlanetInfoProps) {
  const { t } = useTranslation();

  return (
    <div className="planet-info-container">
      {/* Feature flags/tags section */}
      <section className="planet-info-section">
        <div className="planet-flags">
          {/* Habitability flags */}
          {planet.is_habitable_zone && (
            <FlagTag flagKey="habitableZone" className="flag-habitable" />
          )}
          {planet.is_earth_like && (
            <FlagTag flagKey="earthLike" className="flag-earth-like" />
          )}
          {planet.is_top_habitable_candidate && (
            <FlagTag flagKey="topCandidate" className="flag-top-candidate" />
          )}
          {planet.is_potentially_rocky && (
            <FlagTag flagKey="potentiallyRocky" className="flag-rocky" />
          )}
          {planet.has_earth_like_insolation && (
            <FlagTag flagKey="earthLikeInsolation" className="flag-habitable" />
          )}

          {/* Extreme world flags */}
          {planet.is_hot_jupiter && (
            <FlagTag flagKey="hotJupiter" className="flag-hot-jupiter" />
          )}
          {planet.is_hot_neptune && (
            <FlagTag flagKey="hotNeptune" className="flag-hot-neptune" />
          )}
          {planet.is_ultra_hot && (
            <FlagTag flagKey="ultraHot" className="flag-ultra-hot" />
          )}
          {planet.is_frozen_world && (
            <FlagTag flagKey="frozenWorld" className="flag-frozen" />
          )}
          {planet.is_ultra_dense && (
            <FlagTag flagKey="ultraDense" className="flag-ultra-dense" />
          )}
          {planet.is_puffy && (
            <FlagTag flagKey="puffy" className="flag-puffy" />
          )}
          {planet.is_super_massive && (
            <FlagTag flagKey="superMassive" className="flag-super-massive" />
          )}
          {planet.is_lightweight && (
            <FlagTag flagKey="lightweight" className="flag-lightweight" />
          )}

          {/* Orbital flags */}
          {planet.is_ultra_short_period && (
            <FlagTag flagKey="ultraShortPeriod" className="flag-ultra-short" />
          )}
          {planet.is_long_period && (
            <FlagTag flagKey="longPeriod" className="flag-long-period" />
          )}
          {planet.is_eccentric_orbit && (
            <FlagTag flagKey="eccentricOrbit" className="flag-eccentric" />
          )}
          {planet.is_circular_orbit && (
            <FlagTag flagKey="circularOrbit" className="flag-circular" />
          )}
          {planet.is_likely_tidally_locked && (
            <FlagTag flagKey="tidallyLocked" className="flag-tidally-locked" />
          )}

          {/* System flags */}
          {planet.is_circumbinary && (
            <FlagTag flagKey="circumbinary" className="flag-circumbinary" />
          )}
          {planet.is_multi_planet_system && (
            <FlagTag flagKey="multiPlanet" className="flag-multi-planet" />
          )}
          {planet.is_rich_system && (
            <FlagTag flagKey="richSystem" className="flag-rich-system" />
          )}
          {planet.is_multi_star_system && (
            <FlagTag flagKey="multiStar" className="flag-multi-star" />
          )}

          {/* Proximity flags */}
          {planet.is_very_nearby && (
            <FlagTag flagKey="veryNearby" className="flag-very-nearby" />
          )}
          {planet.is_nearby && !planet.is_very_nearby && (
            <FlagTag flagKey="nearby" className="flag-nearby" />
          )}

          {/* Star characteristics */}
          {planet.is_solar_analog && (
            <FlagTag flagKey="solarAnalog" className="flag-solar-analog" />
          )}
          {planet.is_red_dwarf_host && (
            <FlagTag flagKey="redDwarfHost" className="flag-red-dwarf" />
          )}
          {planet.is_young_system && (
            <FlagTag flagKey="youngSystem" className="flag-young" />
          )}
          {planet.is_ancient_system && (
            <FlagTag flagKey="ancientSystem" className="flag-ancient" />
          )}
          {planet.is_metal_rich_star && (
            <FlagTag flagKey="metalRich" className="flag-metal-rich" />
          )}
          {planet.is_metal_poor_star && (
            <FlagTag flagKey="metalPoor" className="flag-metal-poor" />
          )}

          {/* Detection flags */}
          {planet.is_transiting && (
            <FlagTag flagKey="transiting" className="flag-transiting" />
          )}
          {planet.has_rv_data && (
            <FlagTag flagKey="hasRvData" className="flag-rv" />
          )}
          {planet.has_ttv && <FlagTag flagKey="hasTtv" className="flag-ttv" />}
          {planet.is_controversial && (
            <FlagTag flagKey="controversial" className="flag-controversial" />
          )}
        </div>
      </section>

      {/* Planet Properties */}
      <section className="planet-info-section">
        <h2 className="planet-info-section-title">
          {t('pages.planet.info.sections.properties')}
        </h2>
        <p className="earth-comparison-hint">
          {t('pages.planet.info.earthComparison')}
        </p>
        <div className="planet-properties-table">
          {PLANET_FIELDS.map((field) => (
            <PropertyRow key={field.id} field={field} planet={planet} />
          ))}
        </div>
      </section>

      {/* Host Star Properties */}
      <section className="planet-info-section">
        <h2 className="planet-info-section-title">
          {t('pages.planet.info.sections.hostStar')}
        </h2>
        <div className="planet-properties-table">
          {STAR_FIELDS.map((field) => (
            <PropertyRow key={field.id} field={field} planet={planet} />
          ))}
        </div>
      </section>

      {/* Discovery Information */}
      <section className="planet-info-section">
        <h2 className="planet-info-section-title">
          {t('pages.planet.info.sections.discovery')}
        </h2>
        <div className="planet-properties-table">
          {DISCOVERY_FIELDS.map((field) => (
            <PropertyRow key={field.id} field={field} planet={planet} />
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="planet-info-section">
        <h2 className="planet-info-section-title">
          {t('pages.planet.info.sections.reviews')}
        </h2>
        <Reviews planetId={planet.pl_name} />
      </section>
    </div>
  );
}

export default PlanetInfo;
