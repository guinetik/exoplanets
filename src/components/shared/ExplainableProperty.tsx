/**
 * Explainable Property Wrapper
 * Makes any property label/value clickable to show explanation dialog
 */

import { useState, ReactNode } from 'react';
import { PropertyExplanationDialog } from './PropertyExplanationDialog';

interface ExplainablePropertyProps {
  propertyKey: string;
  category: 'planet' | 'star' | 'orbital' | 'detection' | 'discovery' | 'flag';
  children: ReactNode;
  className?: string;
  showIcon?: boolean;
}

export function ExplainableProperty({
  propertyKey,
  category,
  children,
  className = '',
  showIcon = false,
}: ExplainablePropertyProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <span
        className={`explainable-property ${className}`}
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsOpen(true);
          }
        }}
      >
        {children}
        {showIcon && (
          <span className="explainable-icon" aria-hidden="true">
            ⓘ
          </span>
        )}
        <span className="explainable-underline" aria-hidden="true" />
      </span>

      <PropertyExplanationDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        propertyKey={propertyKey}
        category={category}
      />
    </>
  );
}
