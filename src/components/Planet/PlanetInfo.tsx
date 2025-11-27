/**
 * PlanetInfo Component
 * Displays planet properties table and reviews placeholder
 */

import { useTranslation } from 'react-i18next';
import type { Exoplanet } from '../../types';

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
  { id: 'hostname', labelKey: 'hostStar', format: (p: Exoplanet) => p.hostname },
  { id: 'planet_type', labelKey: 'planetType', format: (p: Exoplanet, unknown: string) => p.planet_type || unknown },
  { id: 'pl_rade', labelKey: 'radius', format: (p: Exoplanet, unknown: string) => p.pl_rade ? `${p.pl_rade.toFixed(2)} R⊕` : unknown, earthRef: 'pl_rade' },
  { id: 'pl_bmasse', labelKey: 'mass', format: (p: Exoplanet, unknown: string) => p.pl_bmasse ? `${p.pl_bmasse.toFixed(2)} M⊕` : unknown, earthRef: 'pl_bmasse' },
  { id: 'pl_dens', labelKey: 'density', format: (p: Exoplanet, unknown: string) => p.pl_dens ? `${p.pl_dens.toFixed(2)} g/cm³` : unknown, earthRef: 'pl_dens' },
  { id: 'pl_insol', labelKey: 'insolationFlux', format: (p: Exoplanet, unknown: string) => p.pl_insol ? `${p.pl_insol.toFixed(2)} S⊕` : unknown, earthRef: 'pl_insol' },
  { id: 'pl_eqt', labelKey: 'eqTemperature', format: (p: Exoplanet, unknown: string) => p.pl_eqt ? `${p.pl_eqt.toFixed(0)} K` : unknown, earthRef: 'pl_eqt' },
  { id: 'pl_orbper', labelKey: 'orbitalPeriod', format: (p: Exoplanet, unknown: string) => p.pl_orbper ? `${p.pl_orbper.toFixed(2)} days` : unknown, earthRef: 'pl_orbper' },
  { id: 'pl_orbsmax', labelKey: 'semiMajorAxis', format: (p: Exoplanet, unknown: string) => p.pl_orbsmax ? `${p.pl_orbsmax.toFixed(3)} AU` : unknown, earthRef: 'pl_orbsmax' },
  { id: 'pl_orbeccen', labelKey: 'orbitalEccentricity', format: (p: Exoplanet, unknown: string) => p.pl_orbeccen !== null ? p.pl_orbeccen.toFixed(3) : unknown, earthRef: 'pl_orbeccen' },
];

const STAR_FIELDS: FieldDef[] = [
  { id: 'st_teff', labelKey: 'starTemperature', format: (p: Exoplanet, unknown: string) => p.st_teff ? `${p.st_teff.toFixed(0)} K` : unknown, earthRef: 'st_teff' },
  { id: 'st_met', labelKey: 'starMetallicity', format: (p: Exoplanet, unknown: string) => p.st_met !== null ? `${p.st_met.toFixed(2)} dex` : unknown, earthRef: 'st_met' },
  { id: 'st_age', labelKey: 'starAge', format: (p: Exoplanet, unknown: string) => p.st_age ? `${p.st_age.toFixed(2)} Gyr` : unknown, earthRef: 'st_age' },
];

const DISCOVERY_FIELDS: FieldDef[] = [
  { id: 'disc_year', labelKey: 'discoveryYear', format: (p: Exoplanet, unknown: string) => p.disc_year?.toString() || unknown },
  { id: 'discoverymethod', labelKey: 'discoveryMethod', format: (p: Exoplanet, unknown: string) => p.discoverymethod || unknown },
  { id: 'disc_facility', labelKey: 'facility', format: (p: Exoplanet, unknown: string) => p.disc_facility || unknown },
];

/**
 * Reusable property row with optional Earth comparison tooltip
 * @param field - Field definition with label key and format function
 * @param planet - Planet data
 */
function PropertyRow({ field, planet }: { field: FieldDef; planet: Exoplanet }) {
  const { t } = useTranslation();
  const earthRef = field.earthRef ? EARTH_VALUES[field.earthRef] : null;
  const unknown = t('pages.planet.info.unknown');
  const value = field.format(planet, unknown);
  const label = t(`pages.planet.info.fields.${field.labelKey}`);
  const earthLabel = earthRef ? t(`pages.planet.info.earthRef.${earthRef.labelKey}`) : null;

  return (
    <div className="planet-property-row" title={earthRef && earthLabel ? `${earthLabel}: ${earthRef.value} ${earthRef.unit}` : undefined}>
      <span className="planet-property-label">
        {label}
        {earthRef && earthLabel && <span className="earth-indicator" title={`${earthLabel}: ${earthRef.value} ${earthRef.unit}`}>&#x1F30D;</span>}
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
      {/* Habitability indicators if applicable */}
      {(planet.is_habitable_zone || planet.is_earth_like) && (
        <section className="planet-info-section">
          <div className="planet-flags">
            {planet.is_habitable_zone && (
              <span className="planet-flag flag-habitable">{t('pages.planet.info.flags.habitableZone')}</span>
            )}
            {planet.is_earth_like && (
              <span className="planet-flag flag-earth-like">{t('pages.planet.info.flags.earthLike')}</span>
            )}
          </div>
        </section>
      )}

      {/* Planet Properties */}
      <section className="planet-info-section">
        <h2 className="planet-info-section-title">{t('pages.planet.info.sections.properties')}</h2>
        <p className="earth-comparison-hint">{t('pages.planet.info.earthComparison')}</p>
        <div className="planet-properties-table">
          {PLANET_FIELDS.map((field) => (
            <PropertyRow key={field.id} field={field} planet={planet} />
          ))}
        </div>
      </section>

      {/* Host Star Properties */}
      <section className="planet-info-section">
        <h2 className="planet-info-section-title">{t('pages.planet.info.sections.hostStar')}</h2>
        <div className="planet-properties-table">
          {STAR_FIELDS.map((field) => (
            <PropertyRow key={field.id} field={field} planet={planet} />
          ))}
        </div>
      </section>

      {/* Discovery Information */}
      <section className="planet-info-section">
        <h2 className="planet-info-section-title">{t('pages.planet.info.sections.discovery')}</h2>
        <div className="planet-properties-table">
          {DISCOVERY_FIELDS.map((field) => (
            <PropertyRow key={field.id} field={field} planet={planet} />
          ))}
        </div>
      </section>

      {/* Reviews Placeholder */}
      <section className="planet-info-section">
        <h2 className="planet-info-section-title">{t('pages.planet.info.sections.reviews')}</h2>
        <div className="planet-reviews-placeholder">
          <p className="reviews-placeholder-text">
            {t('pages.planet.info.reviews.placeholder')}
          </p>
          <button className="reviews-placeholder-button" disabled>
            {t('pages.planet.info.reviews.writeReview')}
          </button>
        </div>
      </section>
    </div>
  );
}

export default PlanetInfo;
