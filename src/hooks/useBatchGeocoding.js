import { useQueries } from '@tanstack/react-query'
import { geocode } from '../utils/mapboxUtils'
import { createGeocodeKey, logCacheOperation } from '../utils/geocodingCache'

/**
 * Batch geocoding hook using React Query
 * Optimized for cost reduction with aggressive caching
 * @param {Array} locations - Array of location objects to geocode
 * @param {Object} options - Additional options for all queries
 * @returns {Array} Array of query results
 */
export const useBatchGeocoding = (locations, options = {}) => {
  
  return useQueries({
    queries: (locations || []).map(location => {
      const queryKey = createGeocodeKey(location)
      
      return {
        queryKey,
        queryFn: async () => {
          logCacheOperation('BATCH MISS - Making API call', { queryKey, location })
          console.log('💰 BATCH: Expensive Mapbox API call for:', location.City, location.Country)
          
          const result = await geocode(location)
          
          if (result) {
            logCacheOperation('BATCH SUCCESS - Cached result', { queryKey, coordinates: result })
          } else {
            logCacheOperation('BATCH ERROR - No coordinates', { queryKey, location })
          }
          
          return result
        },
        staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days
        retry: 2, // Slightly fewer retries for batch operations
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
        enabled: !!location && !!(location.City || location.city),
        onError: (error) => {
          console.error('💸 Batch geocoding failed for:', location.City, error)
        },
        ...options // Allow overriding default options for all queries
      }
    })
  })
}

/**
 * Simple batch geocoding with filtering
 * Automatically filters out invalid locations
 * @param {Array} locations - Raw locations array (may contain invalid entries)
 * @param {Object} options - Additional options
 * @returns {Array} Query results for valid locations only
 */
export const useLocationBatchGeocoding = (locations, options = {}) => {
  // Filter locations that need geocoding and are valid
  const validLocations = (locations || []).filter(location => 
    location && 
    (location.City || location.city) && 
    (location.Country || location.country)
  )
  
  // Only log if there are filtered out locations
  if (locations && locations.length !== validLocations.length) {
    console.log('🔍 Filtered', validLocations.length, 'valid locations from', locations?.length, 'total')
  }
  
  // Log which locations were filtered out for debugging
  if (locations && locations.length !== validLocations.length) {
    const invalid = locations.filter(loc => !loc || !(loc.City || loc.city) || !(loc.Country || loc.country))
    console.warn('⚠️ Filtered out invalid locations:', invalid.map(loc => ({
      City: loc?.City || loc?.city || 'missing',
      Country: loc?.Country || loc?.country || 'missing'
    })))
  }

  return useBatchGeocoding(validLocations, options)
}

/**
 * Hook for getting batch geocoding statistics
 * @param {Array} queryResults - Results from useBatchGeocoding
 * @returns {Object} Statistics object
 */
export const useBatchGeocodingStats = (queryResults) => {
  const stats = {
    total: queryResults.length,
    loading: queryResults.filter(q => q.isLoading).length,
    success: queryResults.filter(q => q.data && !q.error).length,
    error: queryResults.filter(q => q.error).length,
    cached: queryResults.filter(q => q.data && !q.isFetching && !q.isLoading).length,
    fetching: queryResults.filter(q => q.isFetching).length,
  }
  
  // Calculate completion percentage
  stats.completionPercentage = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0
  
  // Estimate cost savings from caching
  stats.estimatedCacheHits = stats.cached
  stats.estimatedAPICalls = stats.success + stats.error // Calls that actually went to API
  
  // Only log stats when there are significant changes or completion
  if (stats.total > 0 && (stats.completionPercentage === 100 || stats.completionPercentage % 25 === 0)) {
    console.log('📊 Batch Geocoding Progress:', `${stats.completionPercentage}% complete (${stats.success}/${stats.total})`)
  }
  
  return stats
}