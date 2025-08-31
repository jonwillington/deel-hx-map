/**
 * Mapbox Geocoding Cache Utilities
 * Optimized for cost reduction by aggressive caching of expensive API calls
 */

/**
 * Create cache keys optimized for Mapbox cost reduction
 * Each unique location query gets cached to avoid repeated expensive API calls
 * @param {Object} row - Location row with City, Country, Neighbourhood
 * @returns {Array} Cache key array
 */
export const createGeocodeKey = (row) => {
  const neighbourhood = row.Neighbourhood || row.neighbourhood || ''
  const city = row.City || row.city || ''
  const country = row.Country || row.country || ''
  
  // Create normalized, lowercase key to maximize cache hits
  const key = `${neighbourhood}-${city}-${country}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
  
  // Reduced key logging - only log in debug mode
  // console.log('🔑 Created geocode cache key:', key, 'for location:', { neighbourhood, city, country })
  return ['geocode', key]
}

/**
 * Cache key for expensive special location queries (El Born, etc.)
 * These are cached longer since they're complex and expensive
 * @param {string} locationName - Special location name
 * @returns {Array} Cache key array
 */
export const createSpecialLocationKey = (locationName) => {
  const key = locationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  console.log('🔑 Created special location cache key:', key, 'for location:', locationName)
  return ['geocode', 'special', key]
}

/**
 * Cache key for city-level fallback geocoding
 * Used when neighborhood geocoding fails to avoid wasted API calls
 * @param {string} city - City name
 * @param {string} country - Country name
 * @returns {Array} Cache key array
 */
export const createCityGeocodeKey = (city, country) => {
  const key = `${city}-${country}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  console.log('🔑 Created city geocode cache key:', key, 'for:', city, country)
  return ['geocode', 'city', key]
}

/**
 * Get cache statistics for cost monitoring and debugging
 * @param {QueryClient} queryClient - React Query client instance
 * @param {boolean} silent - If true, don't log to console
 * @returns {Object} Cache statistics
 */
export const getMapboxCacheStats = (queryClient, silent = false) => {
  const queries = queryClient.getQueryCache().getAll()
  const geocodingQueries = queries.filter(q => q.queryKey[0] === 'geocode')
  
  const stats = {
    totalCached: geocodingQueries.length,
    activeQueries: geocodingQueries.filter(q => q.isActive()).length,
    staleQueries: geocodingQueries.filter(q => q.isStale()).length,
    errorQueries: geocodingQueries.filter(q => q.state.error).length,
    successQueries: geocodingQueries.filter(q => q.state.data && !q.state.error).length,
    // Estimate cost savings (rough calculation)
    estimatedAPICallsSaved: geocodingQueries.length * 0.5, // Assume 50% would be duplicate calls
  }
  
  // Only log when explicitly requested or when there are significant changes
  if (!silent) {
    console.log('💰 Mapbox Cache Stats:', stats)
  }
  
  return stats
}

/**
 * Clear all geocoding cache data
 * @param {QueryClient} queryClient - React Query client instance
 */
export const clearGeocodingCache = (queryClient) => {
  console.log('🧹 Clearing all geocoding cache data')
  queryClient.removeQueries({ queryKey: ['geocode'] })
}

/**
 * Invalidate all geocoding cache (trigger refetch)
 * @param {QueryClient} queryClient - React Query client instance
 */
export const invalidateGeocodingCache = (queryClient) => {
  console.log('🔄 Invalidating all geocoding cache data')
  queryClient.invalidateQueries({ queryKey: ['geocode'] })
}

/**
 * Debug logging for cache operations
 * @param {string} operation - Operation type
 * @param {*} data - Operation data
 */
export const logCacheOperation = (operation, data) => {
  // Only log cache misses (actual API calls) to reduce noise
  if (operation.includes('MISS') || operation.includes('SUCCESS')) {
    console.log(`🗃️ Cache ${operation}:`, data)
  }
}