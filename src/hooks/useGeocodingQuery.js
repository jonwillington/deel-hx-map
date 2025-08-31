import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { geocode } from '../utils/mapboxUtils'
import { createGeocodeKey, createSpecialLocationKey, logCacheOperation } from '../utils/geocodingCache'

/**
 * Cost-optimized geocoding hook using React Query
 * Aggressive caching to reduce expensive Mapbox API calls
 * @param {Object} row - Location row with City, Country, Neighbourhood
 * @param {Object} options - Additional query options
 * @returns {Object} React Query result with data, isLoading, error, etc.
 */
export const useGeocodingQuery = (row, options = {}) => {
  const queryKey = createGeocodeKey(row)
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      logCacheOperation('MISS - Making API call', { queryKey, location: row })
      console.log('💰 EXPENSIVE MAPBOX API CALL for:', row.City, row.Country)
      
      const result = await geocode(row)
      
      if (result) {
        logCacheOperation('SUCCESS - Cached result', { queryKey, coordinates: result })
        console.log('✅ Geocoding successful, cached for future use:', result)
      } else {
        logCacheOperation('ERROR - No coordinates found', { queryKey, location: row })
        console.warn('❌ Geocoding failed for:', row.City, row.Country)
      }
      
      return result
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days - property locations rarely change
    gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days - keep expensive data longer (formerly cacheTime)
    retry: 3, // Retry failed expensive API calls
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 30000)
      console.log(`🔄 Retrying geocoding (attempt ${attemptIndex + 1}) in ${delay}ms for:`, row.City)
      return delay
    },
    enabled: !!row && !!(row.City || row.city), // Only run if we have valid location data
    onError: (error) => {
      console.error('💸 Mapbox geocoding failed (cost incurred):', error, 'for location:', row)
      logCacheOperation('ERROR', { queryKey, error: error.message, location: row })
    },
    onSuccess: (data) => {
      if (data) {
        console.log('💾 Geocoding result cached successfully for:', row.City, row.Country)
        logCacheOperation('CACHE HIT on next request', { queryKey, coordinates: data })
      }
    },
    ...options // Allow overriding default options
  })
}

/**
 * Special hook for expensive complex locations like "El Born, Barcelona"
 * These are cached longer since they require multiple API calls
 * @param {string} locationName - Special location name
 * @param {string} city - City name (default: Barcelona)
 * @param {string} country - Country name (default: Spain)
 * @param {Object} options - Additional query options
 * @returns {Object} React Query result
 */
export const useSpecialLocationQuery = (locationName, city = 'Barcelona', country = 'Spain', options = {}) => {
  const queryKey = createSpecialLocationKey(locationName)
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      logCacheOperation('SPECIAL MISS - Making expensive API call', { queryKey, locationName })
      console.log('💰💰 EXPENSIVE SPECIAL LOCATION API CALL for:', locationName)
      
      // Use the existing special handling logic from mapboxUtils
      const result = await geocode({ 
        Neighbourhood: locationName, 
        City: city, 
        Country: country 
      })
      
      if (result) {
        logCacheOperation('SPECIAL SUCCESS - Cached expensive result', { queryKey, coordinates: result })
        console.log('✅ Special location geocoding successful, cached for long term:', result)
      }
      
      return result
    },
    staleTime: 30 * 24 * 60 * 60 * 1000, // 30 days for known special locations
    gcTime: 90 * 24 * 60 * 60 * 1000, // 90 days - very long cache for expensive queries
    retry: 2, // Fewer retries for special locations since they're more likely to be manual
    enabled: !!locationName,
    onError: (error) => {
      console.error('💸💸 Expensive special location geocoding failed:', locationName, error)
      logCacheOperation('SPECIAL ERROR', { queryKey, error: error.message, locationName })
    },
    ...options
  })
}

/**
 * Hook for prefetching geocoding data
 * @param {Object} row - Location row to prefetch
 * @returns {Function} Prefetch function
 */
export const useGeocodingPrefetch = () => {
  const queryClient = useQueryClient()
  
  const prefetchLocation = useCallback(async (row) => {
    const queryKey = createGeocodeKey(row)
    
    // Check if already cached
    const existingData = queryClient.getQueryData(queryKey)
    if (existingData) {
      logCacheOperation('PREFETCH SKIPPED - Already cached', { queryKey })
      return existingData
    }
    
    logCacheOperation('PREFETCH START', { queryKey, location: row })
    
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => geocode(row),
      staleTime: 7 * 24 * 60 * 60 * 1000,
    })
    
    logCacheOperation('PREFETCH COMPLETE', { queryKey })
  }, [queryClient])
  
  return { prefetchLocation }
}