import { useMemo } from 'react'
import { getListingType } from '../utils/locationUtils'

/**
 * Custom hook for filtering locations by segment
 * @param {Array} locations - Array of location data
 * @param {string} selectedSegment - Selected segment ('sublets' or 'exchange')
 * @returns {Array} Filtered locations
 */
export const useFilteredLocations = (locations, selectedSegment) => {
  return useMemo(() => {
    console.log('useFilteredLocations: Processing locations:', locations?.length, 'selectedSegment:', selectedSegment)
    if (!locations || locations.length === 0) return []
    
    // Since we're now fetching data directly from the correct sheet,
    // we don't need to filter by segment anymore - just return all locations
    console.log('useFilteredLocations: Returning all locations from the', selectedSegment, 'sheet:', locations.length)
    return locations
  }, [locations, selectedSegment])
}
