/**
 * PlanetInfo Component
 * Displays planet properties table and reviews placeholder
 */

import { useTranslation } from 'react-i18next';
import type { Exoplanet } from '../../types';
import { Reviews } from '../Reviews';
import { ExplainablePropertyRow } from '../shared/ExplainablePropertyRow';
import { ExplainableProperty } from '../shared/ExplainableProperty';
import { nameToSlug } from '../../utils/urlSlug';

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
            <ExplainableProperty
              propertyKey="habitableZone"
              category="flag"
            >
              <FlagTag flagKey="habitableZone" className="flag-habitable" />
            </ExplainableProperty>
          )}
          {planet.is_earth_like && (
            <ExplainableProperty
              propertyKey="earthLike"
              category="flag"
            >
              <FlagTag flagKey="earthLike" className="flag-earth-like" />
            </ExplainableProperty>
          )}
          {planet.is_top_habitable_candidate && (
            <ExplainableProperty propertyKey="topCandidate" category="flag">
              <FlagTag flagKey="topCandidate" className="flag-top-candidate" />
            </ExplainableProperty>
          )}
          {planet.is_potentially_rocky && (
            <ExplainableProperty propertyKey="potentiallyRocky" category="flag">
              <FlagTag flagKey="potentiallyRocky" className="flag-rocky" />
            </ExplainableProperty>
          )}
          {planet.has_earth_like_insolation && (
            <ExplainableProperty propertyKey="earthLikeInsolation" category="flag">
              <FlagTag flagKey="earthLikeInsolation" className="flag-habitable" />
            </ExplainableProperty>
          )}

          {/* Extreme world flags */}
          {planet.is_hot_jupiter && (
            <ExplainableProperty propertyKey="hotJupiter" category="flag">
              <FlagTag flagKey="hotJupiter" className="flag-hot-jupiter" />
            </ExplainableProperty>
          )}
          {planet.is_hot_neptune && (
            <ExplainableProperty propertyKey="hotNeptune" category="flag">
              <FlagTag flagKey="hotNeptune" className="flag-hot-neptune" />
            </ExplainableProperty>
          )}
          {planet.is_ultra_hot && (
            <ExplainableProperty propertyKey="ultraHot" category="flag">
              <FlagTag flagKey="ultraHot" className="flag-ultra-hot" />
            </ExplainableProperty>
          )}
          {planet.is_frozen_world && (
            <ExplainableProperty propertyKey="frozenWorld" category="flag">
              <FlagTag flagKey="frozenWorld" className="flag-frozen" />
            </ExplainableProperty>
          )}
          {planet.is_ultra_dense && (
            <ExplainableProperty propertyKey="ultraDense" category="flag">
              <FlagTag flagKey="ultraDense" className="flag-ultra-dense" />
            </ExplainableProperty>
          )}
          {planet.is_puffy && (
            <ExplainableProperty propertyKey="puffy" category="flag">
              <FlagTag flagKey="puffy" className="flag-puffy" />
            </ExplainableProperty>
          )}
          {planet.is_super_massive && (
            <ExplainableProperty propertyKey="superMassive" category="flag">
              <FlagTag flagKey="superMassive" className="flag-super-massive" />
            </ExplainableProperty>
          )}
          {planet.is_lightweight && (
            <ExplainableProperty propertyKey="lightweight" category="flag">
              <FlagTag flagKey="lightweight" className="flag-lightweight" />
            </ExplainableProperty>
          )}

          {/* Orbital flags */}
          {planet.is_ultra_short_period && (
            <ExplainableProperty propertyKey="ultraShortPeriod" category="flag">
              <FlagTag flagKey="ultraShortPeriod" className="flag-ultra-short" />
            </ExplainableProperty>
          )}
          {planet.is_long_period && (
            <ExplainableProperty propertyKey="longPeriod" category="flag">
              <FlagTag flagKey="longPeriod" className="flag-long-period" />
            </ExplainableProperty>
          )}
          {planet.is_eccentric_orbit && (
            <ExplainableProperty propertyKey="eccentricOrbit" category="flag">
              <FlagTag flagKey="eccentricOrbit" className="flag-eccentric" />
            </ExplainableProperty>
          )}
          {planet.is_circular_orbit && (
            <ExplainableProperty propertyKey="circularOrbit" category="flag">
              <FlagTag flagKey="circularOrbit" className="flag-circular" />
            </ExplainableProperty>
          )}
          {planet.is_likely_tidally_locked && (
            <ExplainableProperty propertyKey="tidallyLocked" category="flag">
              <FlagTag flagKey="tidallyLocked" className="flag-tidally-locked" />
            </ExplainableProperty>
          )}

          {/* System flags */}
          {planet.is_circumbinary && (
            <ExplainableProperty propertyKey="circumbinary" category="flag">
              <FlagTag flagKey="circumbinary" className="flag-circumbinary" />
            </ExplainableProperty>
          )}
          {planet.is_multi_planet_system && (
            <ExplainableProperty propertyKey="multiPlanet" category="flag">
              <FlagTag flagKey="multiPlanet" className="flag-multi-planet" />
            </ExplainableProperty>
          )}
          {planet.is_rich_system && (
            <ExplainableProperty propertyKey="richSystem" category="flag">
              <FlagTag flagKey="richSystem" className="flag-rich-system" />
            </ExplainableProperty>
          )}
          {planet.is_multi_star_system && (
            <ExplainableProperty propertyKey="multiStar" category="flag">
              <FlagTag flagKey="multiStar" className="flag-multi-star" />
            </ExplainableProperty>
          )}

          {/* Proximity flags */}
          {planet.is_very_nearby && (
            <ExplainableProperty propertyKey="veryNearby" category="flag">
              <FlagTag flagKey="veryNearby" className="flag-very-nearby" />
            </ExplainableProperty>
          )}
          {planet.is_nearby && !planet.is_very_nearby && (
            <ExplainableProperty propertyKey="nearby" category="flag">
              <FlagTag flagKey="nearby" className="flag-nearby" />
            </ExplainableProperty>
          )}

          {/* Star characteristics */}
          {planet.is_solar_analog && (
            <ExplainableProperty propertyKey="solarAnalog" category="flag">
              <FlagTag flagKey="solarAnalog" className="flag-solar-analog" />
            </ExplainableProperty>
          )}
          {planet.is_red_dwarf_host && (
            <ExplainableProperty propertyKey="redDwarfHost" category="flag">
              <FlagTag flagKey="redDwarfHost" className="flag-red-dwarf" />
            </ExplainableProperty>
          )}
          {planet.is_young_system && (
            <ExplainableProperty propertyKey="youngSystem" category="flag">
              <FlagTag flagKey="youngSystem" className="flag-young" />
            </ExplainableProperty>
          )}
          {planet.is_ancient_system && (
            <ExplainableProperty propertyKey="ancientSystem" category="flag">
              <FlagTag flagKey="ancientSystem" className="flag-ancient" />
            </ExplainableProperty>
          )}
          {planet.is_metal_rich_star && (
            <ExplainableProperty propertyKey="metalRich" category="flag">
              <FlagTag flagKey="metalRich" className="flag-metal-rich" />
            </ExplainableProperty>
          )}
          {planet.is_metal_poor_star && (
            <ExplainableProperty propertyKey="metalPoor" category="flag">
              <FlagTag flagKey="metalPoor" className="flag-metal-poor" />
            </ExplainableProperty>
          )}

          {/* Detection flags */}
          {planet.is_transiting && (
            <ExplainableProperty propertyKey="transiting" category="flag">
              <FlagTag flagKey="transiting" className="flag-transiting" />
            </ExplainableProperty>
          )}
          {planet.has_rv_data && (
            <ExplainableProperty propertyKey="hasRvData" category="flag">
              <FlagTag flagKey="hasRvData" className="flag-rv" />
            </ExplainableProperty>
          )}
          {planet.has_ttv && (
            <ExplainableProperty propertyKey="hasTtv" category="flag">
              <FlagTag flagKey="hasTtv" className="flag-ttv" />
            </ExplainableProperty>
          )}
          {planet.is_controversial && (
            <ExplainableProperty propertyKey="controversial" category="flag">
              <FlagTag flagKey="controversial" className="flag-controversial" />
            </ExplainableProperty>
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
          {PLANET_FIELDS.map((field) => {
            const unknown = t('pages.planet.info.unknown');
            const value = field.format(planet, unknown);
            const label = t(`pages.planet.info.fields.${field.labelKey}`);
            const earthRef = field.earthRef ? EARTH_VALUES[field.earthRef] : null;
            const earthLabel = earthRef
              ? t(`pages.planet.info.earthRef.${earthRef.labelKey}`)
              : null;

            return (
              <ExplainablePropertyRow
                key={field.id}
                propertyKey={field.labelKey}
                category="planet"
                label={label}
                value={value}
                earthRef={
                  earthRef && earthLabel
                    ? {
                        value: earthRef.value,
                        unit: earthRef.unit,
                        label: earthLabel,
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      </section>

      {/* Host Star Properties */}
      <section className="planet-info-section">
        <h2 className="planet-info-section-title">
          {t('pages.planet.info.sections.hostStar')}
        </h2>
        <div className="planet-properties-table">
          {STAR_FIELDS.map((field) => {
            const unknown = t('pages.planet.info.unknown');
            const value = field.format(planet, unknown);
            const label = t(`pages.planet.info.fields.${field.labelKey}`);
            const earthRef = field.earthRef ? EARTH_VALUES[field.earthRef] : null;
            const earthLabel = earthRef
              ? t(`pages.planet.info.earthRef.${earthRef.labelKey}`)
              : null;

            return (
              <ExplainablePropertyRow
                key={field.id}
                propertyKey={field.labelKey}
                category="star"
                label={label}
                value={value}
                earthRef={
                  earthRef && earthLabel
                    ? {
                        value: earthRef.value,
                        unit: earthRef.unit,
                        label: earthLabel,
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      </section>

      {/* Discovery Information */}
      <section className="planet-info-section">
        <h2 className="planet-info-section-title">
          {t('pages.planet.info.sections.discovery')}
        </h2>
        <div className="planet-properties-table">
          {DISCOVERY_FIELDS.map((field) => {
            const unknown = t('pages.planet.info.unknown');
            const value = field.format(planet, unknown);
            const label = t(`pages.planet.info.fields.${field.labelKey}`);

            return (
              <ExplainablePropertyRow
                key={field.id}
                propertyKey={field.labelKey}
                category="discovery"
                label={label}
                value={value}
              />
            );
          })}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="planet-info-section">
        <h2 className="planet-info-section-title">
          {t('pages.planet.info.sections.reviews')}
        </h2>
        <Reviews planetId={nameToSlug(planet.pl_name)} />
      </section>
    </div>
  );
}

export default PlanetInfo;
