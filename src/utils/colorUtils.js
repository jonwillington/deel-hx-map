/**
 * Utility functions for working with CSS color tokens in JavaScript
 */

/**
 * Get CSS custom property value from the document root
 * @param {string} propertyName - The CSS custom property name (with or without --)
 * @returns {string} The computed CSS property value
 */
export const getCSSVariable = (propertyName) => {
  const prop = propertyName.startsWith('--') ? propertyName : `--${propertyName}`
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim()
}

/**
 * Map-specific color tokens that can be used in JavaScript
 * These are dynamically fetched from CSS custom properties
 */
export const getMapColors = () => ({
  markerColor: getCSSVariable('color-map-marker-light'),
  markerStroke: getCSSVariable('color-map-marker-stroke-light'),
  textColor: getCSSVariable('color-map-text-light'),
  backgroundColor: getCSSVariable('color-map-bg-light')
})