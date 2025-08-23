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
    console.log('useFilteredLocations: Filtering locations:', locations?.length, 'selectedSegment:', selectedSegment)
    if (!locations || locations.length === 0) return []
    
    const filtered = locations.filter((row) => {
      // Filter by segment
      const t = getListingType(row)
      let segmentMatch = true
      if (selectedSegment === 'sublets') segmentMatch = t === 'sublets'
      else if (selectedSegment === 'exchange') segmentMatch = t === 'exchange'
      
      return segmentMatch
    })
    
    console.log('useFilteredLocations: Filtered result:', filtered.length, 'locations')
    return filtered
  }, [locations, selectedSegment])
}
