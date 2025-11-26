import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="page-container">
      <h1 className="page-title">{t('pages.about.title')}</h1>
      <p className="placeholder">[About content]</p>
    </div>
  );
}
