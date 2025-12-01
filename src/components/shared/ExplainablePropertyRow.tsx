/**
 * Explainable Property Row
 * Property row component with clickable label and value for explanations
 * Maintains Earth comparison tooltip functionality
 */

import { ExplainableProperty } from './ExplainableProperty';

interface ExplainablePropertyRowProps {
  propertyKey: string;
  category: 'planet' | 'star' | 'orbital' | 'detection' | 'discovery' | 'visualization';
  label: string;
  value: string;
  earthRef?: {
    value: number;
    unit: string;
    label: string;
  };
  className?: string;
}

export function ExplainablePropertyRow({
  propertyKey,
  category,
  label,
  value,
  earthRef,
  className = '',
}: ExplainablePropertyRowProps) {
  const tooltipText = earthRef
    ? `${earthRef.label}: ${earthRef.value} ${earthRef.unit}`
    : undefined;

  return (
    <div
      className={`planet-property-row ${className}`}
      title={tooltipText}
    >
      <span className="planet-property-label">
        <ExplainableProperty
          propertyKey={propertyKey}
          category={category}
          className="inline"
        >
          {label}
        </ExplainableProperty>
        {earthRef && (
          <span
            className="earth-indicator"
            title={tooltipText}
            aria-label="Earth reference value available"
          >
            &#x1F30D;
          </span>
        )}
      </span>
      <span className="planet-property-value">
        <ExplainableProperty
          propertyKey={propertyKey}
          category={category}
          className="inline"
        >
          {value}
        </ExplainableProperty>
      </span>
    </div>
  );
}
