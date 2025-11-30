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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        // Trigger when the element intersects the middle 10% of the viewport
        // This creates a "spy" effect that highlights the section currently in the center
        rootMargin: '-45% 0px -45% 0px',
        threshold: 0,
      }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
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
