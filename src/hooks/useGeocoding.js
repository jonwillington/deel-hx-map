import { useCallback } from 'react'
import { geocode } from '../utils/mapboxUtils'

/**
 * Custom hook for geocoding functionality
 * @returns {Function} Geocode function
 */
export const useGeocoding = () => {
  const geocodeLocation = useCallback(async (row) => {
    return await geocode(row)
  }, [])

  return { geocodeLocation }
}
