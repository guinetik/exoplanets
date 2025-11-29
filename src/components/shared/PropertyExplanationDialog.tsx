/**
 * Property Explanation Dialog
 * Reusable glassmorphic modal for explaining astronomical properties
 * Renders property information from i18n structure
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface PropertyExplanationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  propertyKey: string;
  category: 'planet' | 'star' | 'orbital' | 'detection' | 'discovery' | 'flag';
}

export function PropertyExplanationDialog({
  isOpen,
  onClose,
  propertyKey,
  category,
}: PropertyExplanationDialogProps) {
  const { t } = useTranslation();

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Get translation path for this property
  const basePath = `propertyExplanations.${category}.${propertyKey}`;
  const title = t(`${basePath}.title`);
  const description = t(`${basePath}.description`);
  const example = t(`${basePath}.example`, { defaultValue: '' });
  const technicalNote = t(`${basePath}.technicalNote`, { defaultValue: '' });
  const funFact = t(`${basePath}.funFact`, { defaultValue: '' });

  // Check if translation exists (if key is returned as-is, it's missing)
  const translationExists =
    !title.includes(basePath) &&
    !description.includes(basePath);

  if (!translationExists) {
    return (
      <div className="property-dialog-overlay" onClick={onClose}>
        <div className="property-dialog" onClick={(e) => e.stopPropagation()}>
          <button className="property-dialog-close" onClick={onClose}>
            &times;
          </button>
          <h3 className="property-dialog-title">
            {propertyKey.toUpperCase()}
          </h3>
          <div className="property-dialog-content">
            <p className="text-xs text-white/40">
              No explanation available for this property yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="property-dialog-overlay" onClick={onClose}>
      <div className="property-dialog" onClick={(e) => e.stopPropagation()}>
        <button
          className="property-dialog-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          &times;
        </button>

        <h3 className="property-dialog-title">{title}</h3>

        <div className="property-dialog-content">
          {description && (
            <p className="property-dialog-description">{description}</p>
          )}

          {example && (
            <div className="property-dialog-example">
              <strong>Example:</strong> {example}
            </div>
          )}

          {technicalNote && (
            <p className="property-dialog-technical">
              <strong>Technical:</strong> {technicalNote}
            </p>
          )}

          {funFact && (
            <div className="property-dialog-fun-fact">{funFact}</div>
          )}
        </div>
      </div>
    </div>
  );
}
