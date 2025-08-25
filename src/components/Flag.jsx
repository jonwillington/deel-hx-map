import { getCountryCode } from '../utils/locationUtils'

/**
 * Flag component using flag-icons library
 * @param {string} country - Country name
 * @param {string} size - Size class (default: '', options: 'fi-1x5', 'fi-2x3', etc.)
 * @param {string} className - Additional CSS classes
 */
export const Flag = ({ country, size = '', className = '' }) => {
  const countryCode = getCountryCode(country)
  
  if (!countryCode) {
    // Fallback to globe emoji for unknown countries
    return <span className={className}>🌍</span>
  }
  
  const flagClasses = [
    'fi',
    `fi-${countryCode.toLowerCase()}`,
    size,
    className
  ].filter(Boolean).join(' ')
  
  return <span className={flagClasses} title={country}></span>
}