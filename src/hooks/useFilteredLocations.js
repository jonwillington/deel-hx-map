import { useMemo } from 'react'
import { getListingType } from '../utils/locationUtils'
import { filterLocationsByMonth } from '../utils/monthFilterUtils'

/**
 * Custom hook for filtering locations by segment and month
 * @param {Array} locations - Array of location data
 * @param {string} selectedSegment - Selected segment ('sublets' or 'exchange')
 * @param {string} selectedMonth - Selected month filter ('all' or YYYY-MM format)
 * @returns {Array} Filtered locations
 */
export const useFilteredLocations = (locations, selectedSegment, selectedMonth = 'all') => {
  return useMemo(() => {
    console.log('useFilteredLocations: Processing locations:', locations?.length, 'selectedSegment:', selectedSegment, 'selectedMonth:', selectedMonth)
    if (!locations || locations.length === 0) return []
    
    // Locations are already pre-segmented by data source (sublets sheet vs exchanges sheet)
    // No need to filter by segment since the correct data is already loaded
    
    // Apply month filtering to both sublets and exchanges when a month is selected
    const finalFiltered = filterLocationsByMonth(locations, selectedMonth)
    console.log('useFilteredLocations: After month filtering:', finalFiltered.length, 'from', locations.length)
    
    return finalFiltered
  }, [locations, selectedSegment, selectedMonth])
}
