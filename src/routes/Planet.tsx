import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

export default function Planet() {
  const { t } = useTranslation();
  const { planetId } = useParams();

  return (
    <div className="page-container">
      <h1 className="page-title">{t('pages.planet.title')}</h1>
      <p className="placeholder">[Planet details: {planetId}]</p>
    </div>
  );
}
