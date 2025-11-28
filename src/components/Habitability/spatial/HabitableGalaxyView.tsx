/**
 * HabitableGalaxyView
 * Hero 3D visualization showing exoplanet positions colored by habitability
 */

import { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type {
  SpatialPoint,
  HabitabilityStats,
  SpatialFilter,
} from '../../../utils/habitabilityAnalytics';
import { filterSpatialData } from '../../../utils/habitabilityAnalytics';
import { nameToSlug } from '../../../utils/urlSlug';
import {
  GALAXY_CANVAS,
  ORBIT_CONTROLS,
  GALAXY_LABELS,
  TOOLTIP_POSITION,
} from '../../../utils/habitabilityVisuals';
import HabitablePlanetCloud from './HabitablePlanetCloud';
import DistanceRings from './DistanceRings';

interface HabitableGalaxyViewProps {
  data: SpatialPoint[];
  stats: HabitabilityStats;
}

export default function HabitableGalaxyView({
  data,
  stats,
}: HabitableGalaxyViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<SpatialFilter>('all');
  const [hoveredPlanet, setHoveredPlanet] = useState<SpatialPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const filteredData = filterSpatialData(data, filter);

  const handlePlanetClick = useCallback(
    (planet: SpatialPoint) => {
      navigate(`/planets/${nameToSlug(planet.name)}`);
    },
    [navigate]
  );

  const handlePlanetHover = useCallback(
    (planet: SpatialPoint | null, pos?: { x: number; y: number }) => {
      setHoveredPlanet(planet);
      if (pos) {
        setTooltipPos(pos);
      }
    },
    []
  );

  return (
    <div className="galaxy-view-container">
      {/* 3D Canvas */}
      <div className="galaxy-canvas">
        <Canvas
          camera={{
            position: [GALAXY_CANVAS.CAMERA_X, GALAXY_CANVAS.CAMERA_Y, GALAXY_CANVAS.CAMERA_Z],
            fov: GALAXY_CANVAS.CAMERA_FOV,
            near: GALAXY_CANVAS.CAMERA_NEAR,
            far: GALAXY_CANVAS.CAMERA_FAR,
          }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={GALAXY_CANVAS.AMBIENT_LIGHT_INTENSITY} />

            {/* Planet point cloud */}
            <HabitablePlanetCloud
              planets={filteredData}
              onPlanetClick={handlePlanetClick}
              onPlanetHover={handlePlanetHover}
            />

            {/* Distance reference rings */}
            <DistanceRings />

            {/* Sol marker at origin */}
            <Text
              position={[0, 0, 0]}
              fontSize={GALAXY_LABELS.SOL_FONT_SIZE}
              color={GALAXY_LABELS.SOL_COLOR}
              anchorX="center"
              anchorY="middle"
            >
              {GALAXY_LABELS.SOL_TEXT}
            </Text>

            {/* Controls */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={ORBIT_CONTROLS.MIN_DISTANCE}
              maxDistance={ORBIT_CONTROLS.MAX_DISTANCE}
              minPolarAngle={ORBIT_CONTROLS.MIN_POLAR_ANGLE}
              maxPolarAngle={ORBIT_CONTROLS.MAX_POLAR_ANGLE}
              autoRotate={ORBIT_CONTROLS.AUTO_ROTATE}
              autoRotateSpeed={ORBIT_CONTROLS.AUTO_ROTATE_SPEED}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Filter Controls Overlay */}
      <div className="galaxy-controls">
        <div className="filter-buttons">
          {(['all', 'habitable', 'earthLike', 'top20'] as SpatialFilter[]).map(
            (f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {t(`pages.habitability.galaxy.filters.${f}`)}
              </button>
            )
          )}
        </div>
        <p className="galaxy-hint">{t('pages.habitability.galaxy.hint')}</p>
      </div>

      {/* Legend */}
      <div className="galaxy-legend">
        <div className="legend-item">
          <span className="legend-dot top" />
          <span>{t('pages.habitability.galaxy.legend.top')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot habitable-earthlike" />
          <span>
            {t('pages.habitability.galaxy.legend.habitableEarthLike')}
          </span>
        </div>
        <div className="legend-item">
          <span className="legend-dot habitable" />
          <span>{t('pages.habitability.galaxy.legend.habitable')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot other" />
          <span>{t('pages.habitability.galaxy.legend.other')}</span>
        </div>
      </div>

      {/* Callouts */}
      <div className="galaxy-callouts">
        {/* Nearest Habitable */}
        {stats.nearestHabitable && (
          <div
            className="galaxy-callout clickable"
            onClick={() =>
              navigate(`/planets/${nameToSlug(stats.nearestHabitable!.name)}`)
            }
          >
            <span className="callout-label">
              {t('pages.habitability.stats.nearest')}:
            </span>
            <span className="callout-value">{stats.nearestHabitable.name}</span>
            <span className="callout-distance">
              {t('pages.habitability.galaxy.distance', {
                distance: stats.nearestHabitable.distanceLy.toFixed(1),
              })}
            </span>
          </div>
        )}

        {/* Highest Score */}
        {stats.topScorerName && (
          <div
            className="galaxy-callout clickable"
            onClick={() =>
              navigate(`/planets/${nameToSlug(stats.topScorerName)}`)
            }
          >
            <span className="callout-label">
              {t('pages.habitability.stats.topScore')}:
            </span>
            <span className="callout-value">{stats.topScorerName}</span>
            <span className="callout-score">
              {t('pages.habitability.charts.score', {
                score: stats.topScore.toFixed(1),
              })}
            </span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {hoveredPlanet && (
        <div
          className="galaxy-tooltip"
          style={{
            left: tooltipPos.x + TOOLTIP_POSITION.X_OFFSET,
            top: tooltipPos.y + TOOLTIP_POSITION.Y_OFFSET,
          }}
        >
          <div className="tooltip-name">{hoveredPlanet.name}</div>
          <div className="tooltip-score">
            {t('pages.habitability.charts.score', {
              score: hoveredPlanet.score.toFixed(1),
            })}
          </div>
          <div className="tooltip-distance">
            {hoveredPlanet.distanceLy.toFixed(1)}{' '}
            {t('pages.habitability.charts.lightYears')}
          </div>
          {hoveredPlanet.isHabitable && (
            <div className="tooltip-badge habitable">
              {t('pages.habitability.charts.badges.habitableZone')}
            </div>
          )}
          {hoveredPlanet.isEarthLike && (
            <div className="tooltip-badge earth-like">
              {t('pages.habitability.charts.badges.earthLike')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
