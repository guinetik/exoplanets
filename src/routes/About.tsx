/**
 * About Page
 * Tells the story of exoplanet exploration and this project
 * Vercel-inspired minimal design with strong typography
 */

import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import { getAboutSEO } from '../utils/seo';

// Timeline data for exoplanet exploration history
const TIMELINE_ITEMS = [
  { year: '1992', key: '1992', image: 'pulsar.jpg' },
  { year: '1995', key: '1995', image: '51-peg.gif' },
  { year: '2009', key: '2009', image: 'kepler.gif' },
  { year: '2016', key: '2016', image: 'proxima.png' },
  { year: '2018', key: '2018', image: 'tess.webp' },
  { year: '2024', key: 'today', image: 'exoplanets.gif' },
];

// Tech stack
const TECH_STACK = [
  'React 18',
  'TypeScript',
  'Three.js',
  'GLSL Shaders',
  'D3.js',
  'Tailwind',
  'Firebase',
  'Vite',
];

// Icon credits from Noun Project (CC BY 3.0)
const ICON_CREDITS = [
  { name: 'space voyager', author: 'Muhammad Naufal Subhiansyah', url: 'https://thenounproject.com/browse/icons/term/space-voyager/' },
  { name: 'Voyager Spacecraft', author: 'Boyan', url: 'https://thenounproject.com/browse/icons/term/voyager-spacecraft/' },
  { name: 'probe', author: 'PixelBazaar', url: 'https://thenounproject.com/browse/icons/term/probe/' },
  { name: 'spacecraft', author: 'Roat Studio', url: 'https://thenounproject.com/browse/icons/term/spacecraft/' },
  { name: 'spacecraft', author: 'Fath Yusuf Iskhaqy', url: 'https://thenounproject.com/browse/icons/term/spacecraft/' },
  { name: 'space-x', author: 'Stepko Mutko', url: 'https://thenounproject.com/browse/icons/term/space-x/' },
  { name: 'Falcon Heavy', author: 'Amelia Stefani', url: 'https://thenounproject.com/browse/icons/term/falcon-heavy/' },
  { name: 'Enterprise', author: 'Jonas Nullens', url: 'https://thenounproject.com/browse/icons/term/enterprise/' },
  { name: 'solar sail', author: 'CVXF', url: 'https://thenounproject.com/browse/icons/term/solar-sail/' },
  { name: 'space station', author: 'Smashing Stocks', url: 'https://thenounproject.com/browse/icons/term/space-station/' },
];

export default function About() {
  const { t } = useTranslation();

  // Check if image exists, show placeholder if not
  const getImageSrc = (filename: string) => `/images/about/${filename}`;

  const seoData = getAboutSEO();

  return (
    <>
      <SEO {...seoData} />
      <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <h1 className="about-hero-title">{t('pages.about.title')}</h1>
        <p className="about-hero-subtitle">{t('pages.about.subtitle')}</p>
      </section>

      {/* Exoplanet Exploration Timeline */}
      <section className="about-section">
        <h2 className="about-section-title">
          {t('pages.about.exploration.title')}
        </h2>
        <div className="about-timeline">
          {TIMELINE_ITEMS.map((item) => (
            <div key={item.key} className="about-timeline-item">
              <div className="about-timeline-image about-timeline-image--placeholder">
                <img
                  src={getImageSrc(item.image)}
                  alt={t(`pages.about.exploration.timeline.${item.key}.title`)}
                  loading="lazy"
                  decoding="async"
                  onLoad={(e) => {
                    // Remove placeholder class when image loads
                    const target = e.target as HTMLImageElement;
                    target.parentElement?.classList.remove('about-timeline-image--placeholder');
                  }}
                  onError={(e) => {
                    // Hide broken image, show placeholder
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = `<span>${item.year}</span>`;
                    }
                  }}
                />
              </div>
              <div className="about-timeline-year">{item.year}</div>
              <div className="about-timeline-title">
                {t(`pages.about.exploration.timeline.${item.key}.title`)}
              </div>
              <div className="about-timeline-desc">
                {t(`pages.about.exploration.timeline.${item.key}.desc`)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="about-divider" />

      {/* Project Evolution */}
      <section className="about-section">
        <h2 className="about-section-title">
          {t('pages.about.project.title')}
        </h2>
        <p className="about-author-message">{t('pages.about.project.author_message')}</p>
        <div className="about-version-grid">
          {/* Legacy Version */}
          <div className="about-version-card about-version-card--legacy">
            <div className="about-version-header">
              <span className="about-version-number">v1.x</span>
              <span className="about-version-name">
                {t('pages.about.project.legacy.name')}
              </span>
            </div>
            <div className="about-version-features">
              {(
                t('pages.about.project.legacy.features', {
                  returnObjects: true,
                }) as string[]
              ).map((feature, i) => (
                <div key={i} className="about-version-feature">
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Current Version */}
          <div className="about-version-card">
            <div className="about-version-header">
              <span className="about-version-number">v2.0</span>
              <span className="about-version-name">
                {t('pages.about.project.current.name')}
              </span>
            </div>
            <div className="about-version-features">
              {(
                t('pages.about.project.current.features', {
                  returnObjects: true,
                }) as string[]
              ).map((feature, i) => (
                <div key={i} className="about-version-feature">
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="about-divider" />

      {/* Technology Stack */}
      <section className="about-section">
        <h2 className="about-section-title">{t('pages.about.tech.title')}</h2>
        <div className="about-tech-list">
          {TECH_STACK.map((tech) => (
            <span key={tech} className="about-tech-item">
              {tech}
            </span>
          ))}
        </div>
      </section>

      <div className="about-divider" />

      {/* Icon Credits */}
      <section className="about-section">
        <h2 className="about-section-title">{t('pages.about.iconCredits.title')}</h2>
        <p className="about-icon-credits-intro">
          {t('pages.about.iconCredits.intro')}
        </p>
        <div className="about-icon-credits">
          {ICON_CREDITS.map((credit, index) => (
            <div key={index} className="about-icon-credit">
              <span className="icon-credit-name">{credit.name}</span>
              <span className="icon-credit-by">{t('pages.about.iconCredits.by')}</span>
              <a
                href={credit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="icon-credit-author"
              >
                {credit.author}
              </a>
            </div>
          ))}
        </div>
        <p className="about-icon-credits-license">
          {t('pages.about.iconCredits.license')}
        </p>
      </section>

      <div className="about-divider" />

      {/* Credits */}
      <section className="about-credits">
        <p className="about-credits-author">
          {t('pages.about.credits.builtBy')}{' '}
          <a
            href="https://github.com/guinetik"
            target="_blank"
            rel="noopener noreferrer"
          >
            guinetik
          </a>
        </p>
        <p>
          {t('pages.about.credits.dataFrom')}{' '}
          <a
            href="https://exoplanetarchive.ipac.caltech.edu/"
            target="_blank"
            rel="noopener noreferrer"
          >
            NASA Exoplanet Archive
          </a>
        </p>
        <p>{t('pages.about.credits.year')}</p>
      </section>
      </div>
    </>
  );
}
