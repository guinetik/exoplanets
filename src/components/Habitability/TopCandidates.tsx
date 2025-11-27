/**
 * TopCandidates
 * Showcase grid of top habitability candidates
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Exoplanet } from '../../types';
import { nameToSlug } from '../../utils/urlSlug';

interface TopCandidatesProps {
  candidates: Exoplanet[];
}

export default function TopCandidates({ candidates }: TopCandidatesProps) {
  return (
    <div className="candidates-grid">
      {candidates.map((planet, index) => (
        <CandidateCard key={planet.pl_name} planet={planet} rank={index + 1} />
      ))}
    </div>
  );
}

interface CandidateCardProps {
  planet: Exoplanet;
  rank: number;
}

function CandidateCard({ planet, rank }: CandidateCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/planets/${nameToSlug(planet.pl_name)}`}
      className="candidate-card"
    >
      <div className="candidate-rank">
        {t('pages.habitability.candidates.rank', { rank })}
      </div>

      <div className="candidate-content">
        <h4 className="candidate-name">{planet.pl_name}</h4>

        <div className="candidate-score">
          <span className="score-value">
            {planet.habitability_score.toFixed(1)}
          </span>
          <span className="score-label">/ 100</span>
        </div>

        <div className="candidate-details">
          {planet.planet_type && (
            <span className="detail-item">{planet.planet_type}</span>
          )}
          {planet.distance_ly && (
            <span className="detail-item">
              {t('pages.habitability.candidates.distance', {
                distance: planet.distance_ly.toFixed(1),
              })}
            </span>
          )}
          {planet.pl_eqt && (
            <span className="detail-item">{planet.pl_eqt.toFixed(0)}K</span>
          )}
        </div>

        <div className="candidate-badges">
          {planet.is_habitable_zone && (
            <span className="badge habitable">
              {t('pages.habitability.charts.badges.habitableZone')}
            </span>
          )}
          {planet.is_earth_like && (
            <span className="badge earth-like">
              {t('pages.habitability.charts.badges.earthLike')}
            </span>
          )}
        </div>
      </div>

      <div className="candidate-hover">
        {t('pages.habitability.candidates.viewDetails')} →
      </div>
    </Link>
  );
}
