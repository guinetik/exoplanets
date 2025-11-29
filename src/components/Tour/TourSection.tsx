/**
 * TourSection
 * Section wrapper with scroll animation for the Tour page
 */

import type { ReactNode } from 'react';
import { useScrollAnimation } from './hooks/useScrollAnimation';

interface TourSectionProps {
  id: string;
  chapter: string;
  title: string;
  intro: string;
  children: ReactNode;
}

export default function TourSection({
  id,
  chapter,
  title,
  intro,
  children,
}: TourSectionProps) {
  const { ref: headerRef, isVisible: headerVisible } =
    useScrollAnimation<HTMLDivElement>({ threshold: 0.2 });
  const { ref: contentRef, isVisible: contentVisible } =
    useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section id={id} className="tour-section">
      <div
        ref={headerRef}
        className={`tour-section-header tour-animate ${headerVisible ? 'visible' : ''}`}
      >
        <span className="tour-chapter-number">{chapter}</span>
        <h2 className="tour-section-title">{title}</h2>
        <p className="tour-section-intro">{intro}</p>
      </div>

      <div
        ref={contentRef}
        className={`tour-showcase ${contentVisible ? 'visible' : ''}`}
      >
        {children}
      </div>
    </section>
  );
}
