/**
 * URL Slug Utilities
 * Functions for converting names to URL-friendly slugs and vice versa
 */

/**
 * Converts a name to a URL-friendly slug
 * - Converts to lowercase
 * - Replaces spaces with dashes
 * - Keeps existing hyphens unchanged
 * - Trims whitespace and collapses multiple spaces
 * 
 * @param name - The name to convert to a slug
 * @returns The slug version of the name
 * 
 * @example
 * nameToSlug("Kepler-22 b") // "kepler-22-b"
 * nameToSlug("HD 209458") // "hd-209458"
 * nameToSlug("  Trappist-1  ") // "trappist-1"
 */
export function nameToSlug(name: string): string {
  if (!name) return '';
  
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace one or more spaces with a single dash
    .replace(/--+/g, '-') // Replace multiple consecutive dashes with a single dash
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}


