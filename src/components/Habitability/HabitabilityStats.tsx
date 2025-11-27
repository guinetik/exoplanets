/**
 * HabitabilityStats
 * Key statistics bar showing summary numbers
 */

import { useTranslation } from 'react-i18next';
import type { HabitabilityStats as Stats } from '../../utils/habitabilityAnalytics';

interface HabitabilityStatsProps {
  stats: Stats;
}

export default function HabitabilityStats({ stats }: HabitabilityStatsProps) {
  const { t } = useTranslation();

  const statItems = [
    {
      key: 'total',
      value: stats.total.toLocaleString(),
      label: t('pages.habitability.stats.total'),
    },
    {
      key: 'habitableZone',
      value: stats.habitableZone.toLocaleString(),
      label: t('pages.habitability.stats.habitableZone'),
      highlight: true,
    },
    {
      key: 'earthLike',
      value: stats.earthLike.toLocaleString(),
      label: t('pages.habitability.stats.earthLike'),
      highlight: true,
    },
    {
      key: 'topScore',
      value: stats.topScore.toFixed(1),
      label: t('pages.habitability.stats.topScore'),
      sublabel: stats.topScorerName,
    },
  ];

  return (
    <div className="habitability-stats-bar">
      {statItems.map((item) => (
        <div
          key={item.key}
          className={`stat-item ${item.highlight ? 'highlight' : ''}`}
        >
          <div className="stat-value">{item.value}</div>
          <div className="stat-label">{item.label}</div>
          {item.sublabel && (
            <div className="stat-sublabel">{item.sublabel}</div>
          )}
        </div>
      ))}
    </div>
  );
}
