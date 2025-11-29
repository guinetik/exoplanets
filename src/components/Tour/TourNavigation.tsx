/**
 * TourNavigation
 * Sticky sidebar navigation dots for desktop
 */

import { useEffect, useState } from 'react';

interface TourNavigationProps {
  sections: Array<{ id: string; label: string }>;
}

export default function TourNavigation({ sections }: TourNavigationProps) {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { threshold: 0.3, rootMargin: '-20% 0px -60% 0px' }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="tour-navigation" aria-label="Tour sections">
      {sections.map(({ id, label }) => (
        <button
          key={id}
          className={`tour-nav-dot ${activeSection === id ? 'active' : ''}`}
          onClick={() => scrollToSection(id)}
          title={label}
          aria-label={`Jump to ${label}`}
        />
      ))}
    </nav>
  );
}
