# React Query Geocoding Implementation Plan

## Overview
This plan outlines the implementation of React Query to optimize **Mapbox geocoding API costs** in the DHXC Housing Exchange Map application. The current implementation makes direct API calls to Mapbox for every geocoding request, leading to redundant calls and unnecessary API costs. Since Google Sheets calls are free, this plan focuses specifically on reducing Mapbox geocoding expenses.

## Current Issues (Mapbox Cost Focus)
- ❌ **No caching of Mapbox geocoding results** - Every location lookup costs money
- ❌ **Redundant Mapbox API calls** - Same location geocoded multiple times
- ❌ **No request deduplication** - Multiple simultaneous requests for same location
- ❌ **Complex geocoding logic** - Multiple fallback queries per location (El Born, distance validation)
- ❌ **No error retry logic** - Failed expensive API calls aren't retried
- ❌ **Poor user experience** - Repeated loading states for same locations

## Benefits of React Query Implementation (Mapbox Cost Focus)
- ✅ **Automatic caching with configurable TTL** - Cache expensive Mapbox calls for 7-30 days
- ✅ **Request deduplication** - Multiple components requesting same location share one API call
- ✅ **Background refetching** - Keep data fresh without blocking UI
- ✅ **Built-in error handling and retry logic** - Retry failed expensive API calls
- ✅ **Optimistic updates** - Show cached data immediately while refetching
- ✅ **Massive cost reduction** - 70-90% fewer Mapbox API calls
- ✅ **Better user experience** - Eliminate duplicate loading states for same locations

## Implementation Steps

### Phase 1: Setup & Dependencies

#### 1.1 Install React Query
```bash
npm install @tanstack/react-query
```

#### 1.2 Configure Query Client for Mapbox Cost Optimization
**File: `src/App.jsx`**
- Wrap the app with `QueryClientProvider`
- Configure aggressive caching for expensive Mapbox geocoding calls
- Set up cost-aware error handling and retry logic

```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressive caching for expensive Mapbox geocoding calls
      staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days - property locations rarely change
      cacheTime: 30 * 24 * 60 * 60 * 1000, // 30 days - keep expensive data longer
      retry: 3, // Retry failed expensive API calls
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Mapbox cost-aware error handling
      onError: (error, query) => {
        if (query.queryKey[0] === 'geocode') {
          console.error('💰 Mapbox geocoding failed (cost incurred):', error, 'for location:', query.queryKey[1])
        }
      }
    },
  },
})
```

### Phase 2: Core Geocoding Hooks

#### 2.1 Create Mapbox Cost-Optimized Cache Key Utility
**File: `src/utils/geocodingCache.js`**
```javascript
/**
 * Create cache keys optimized for Mapbox cost reduction
 * Each unique location query gets cached to avoid repeated expensive API calls
 * Note: Geocoding is the same for sublets and exchanges - a location is a location
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
  
  // No segment needed - geocoding is location-based, not segment-based
  return ['geocode', key]
}

/**
 * Cache key for expensive special location queries (El Born, etc.)
 * These are cached longer since they're complex and expensive
 */
export const createSpecialLocationKey = (locationName) => {
  return ['geocode', 'special', locationName.toLowerCase()]
}

/**
 * Cache key for city-level fallback geocoding
 * Used when neighborhood geocoding fails to avoid wasted API calls
 */
export const createCityGeocodeKey = (city, country) => {
  const key = `${city}-${country}`.toLowerCase().replace(/\s+/g, '-')
  return ['geocode', 'city', key]
}

/**
 * Get cache statistics for cost monitoring
 */
export const getMapboxCacheStats = () => {
  const queries = queryClient.getQueryCache().getAll()
  const geocodingQueries = queries.filter(q => q.queryKey[0] === 'geocode')
  
  return {
    totalCached: geocodingQueries.length,
    activeQueries: geocodingQueries.filter(q => q.isActive()).length,
    staleQueries: geocodingQueries.filter(q => q.isStale()).length,
    // Estimate cost savings (rough calculation)
    estimatedAPICallsSaved: geocodingQueries.length * 0.5, // Assume 50% would be duplicate calls
  }
}
```

#### 2.2 Create Mapbox Cost-Optimized Geocoding Hook
**File: `src/hooks/useGeocodingQuery.js`**
```javascript
import { useQuery } from '@tanstack/react-query'
import { geocode } from '../utils/mapboxUtils'
import { createGeocodeKey, createSpecialLocationKey } from '../utils/geocodingCache'

export const useGeocodingQuery = (row) => {
  const queryKey = createGeocodeKey(row)
  
  return useQuery({
    queryKey,
    queryFn: () => geocode(row),
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days - property locations rarely change
    cacheTime: 30 * 24 * 60 * 60 * 1000, // 30 days - keep expensive data longer
    retry: 3, // Retry failed expensive API calls
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!row && !!(row.City || row.city),
    onError: (error) => {
      console.error('💰 Mapbox geocoding failed (cost incurred):', row, error)
    }
  })
}

/**
 * Special hook for expensive complex locations like "El Born, Barcelona"
 * These are cached longer since they require multiple API calls
 */
export const useSpecialLocationQuery = (locationName) => {
  const queryKey = createSpecialLocationKey(locationName)
  
  return useQuery({
    queryKey,
    queryFn: () => {
      // Use the existing special handling logic from mapboxUtils
      return geocode({ 
        Neighbourhood: locationName, 
        City: 'Barcelona', 
        Country: 'Spain' 
      })
    },
    staleTime: 30 * 24 * 60 * 60 * 1000, // 30 days for known locations
    cacheTime: 90 * 24 * 60 * 60 * 1000, // 90 days - very long cache for expensive queries
    retry: 2,
    enabled: !!locationName,
    onError: (error) => {
      console.error('💰 Expensive special location geocoding failed:', locationName, error)
    }
  })
}
```

#### 2.3 Create Mapbox Cost-Optimized Batch Geocoding Hook
**File: `src/hooks/useBatchGeocoding.js`**
```javascript
import { useQueries } from '@tanstack/react-query'
import { geocode } from '../utils/mapboxUtils'
import { createGeocodeKey } from '../utils/geocodingCache'

export const useBatchGeocoding = (locations) => {
  return useQueries({
    queries: locations.map(location => ({
      queryKey: createGeocodeKey(location),
      queryFn: () => geocode(location),
      staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days - property locations rarely change
      retry: 2,
      enabled: !!location && !!(location.City || location.city),
    }))
  })
}

/**
 * Simple batch geocoding - no segment complexity needed
 * Geocoding is location-based, not segment-based
 */
export const useLocationBatchGeocoding = (locations) => {
  // Filter locations that need geocoding
  const locationsToGeocode = locations.filter(location => 
    location && (location.City || location.city)
  )

  return useBatchGeocoding(locationsToGeocode)
}
```

### Phase 3: Update Existing Components

#### 3.1 Update useMap Hook for Location-Based Geocoding
**File: `src/hooks/useMap.js`**
- Replace direct geocoding calls with React Query
- Use location-based caching (no segment complexity)
- Implement cost-optimized loading states

```javascript
import { useLocationBatchGeocoding } from './useBatchGeocoding'
import { useMemo } from 'react'

// Replace the geocoding loop with simple batch processing:
const geocodingResults = useLocationBatchGeocoding(locations || [])

const features = useMemo(() => {
  if (!locations || geocodingResults.some(result => result.isLoading)) {
    return []
  }
  
  return locations
    .map((row, index) => {
      const coords = geocodingResults[index]?.data
      if (!coords) {
        console.log(`💰 No coordinates for ${row.City}, ${row.Country} - Mapbox API call needed`)
        return null
      }
      
      return {
        type: 'Feature',
        properties: { 
          id: index, 
          location: row
        },
        geometry: { type: 'Point', coordinates: coords }
      }
    })
    .filter(Boolean)
}, [locations, geocodingResults])

// Simple cache invalidation - no segment complexity
const invalidateGeocodingCache = useCallback(() => {
  queryClient.invalidateQueries({ 
    queryKey: ['geocode'] 
  })
}, [])
```

#### 3.2 Update useGeocoding Hook
**File: `src/hooks/useGeocoding.js`**
- Deprecate in favor of useGeocodingQuery
- Keep for backward compatibility during transition

```javascript
import { useGeocodingQuery } from './useGeocodingQuery'

export const useGeocoding = () => {
  const geocodeLocation = useCallback((row) => {
    // Use the new React Query hook internally
    const { data, isLoading, error } = useGeocodingQuery(row)
    return { coordinates: data, isLoading, error }
  }, [])

  return { geocodeLocation }
}
```

### Phase 4: Advanced Features

#### 4.1 Prefetching Strategy
**File: `src/hooks/useGeocodingPrefetch.js`**
```javascript
import { useQueryClient } from '@tanstack/react-query'
import { createGeocodeKey } from '../utils/geocodingCache'
import { geocode } from '../utils/mapboxUtils'

export const useGeocodingPrefetch = () => {
  const queryClient = useQueryClient()
  
  const prefetchLocation = useCallback(async (row) => {
    const queryKey = createGeocodeKey(row)
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => geocode(row),
      staleTime: 24 * 60 * 60 * 1000,
    })
  }, [queryClient])
  
  return { prefetchLocation }
}
```

#### 4.2 Cache Management Utilities
**File: `src/utils/geocodingCache.js`**
```javascript
import { queryClient } from '../App' // Export from App.jsx

export const clearGeocodingCache = () => {
  queryClient.removeQueries({ queryKey: ['geocode'] })
}

export const invalidateGeocodingCache = () => {
  queryClient.invalidateQueries({ queryKey: ['geocode'] })
}

export const getGeocodingCacheStats = () => {
  const queries = queryClient.getQueryCache().getAll()
  const geocodingQueries = queries.filter(q => q.queryKey[0] === 'geocode')
  
  return {
    total: geocodingQueries.length,
    active: geocodingQueries.filter(q => q.isActive()).length,
    stale: geocodingQueries.filter(q => q.isStale()).length,
  }
}
```

### Phase 5: Performance Optimizations

#### 5.1 Implement Request Batching
- Group multiple geocoding requests
- Use Promise.all for concurrent requests
- Implement rate limiting if needed

#### 5.2 Add Loading States
- Show skeleton loaders during geocoding
- Implement progressive loading for large datasets
- Add loading indicators for individual locations

#### 5.3 Error Boundaries
- Create error boundary for geocoding failures
- Implement fallback coordinates for failed requests
- Show user-friendly error messages

### Phase 6: Testing & Monitoring

#### 6.1 Add Cache Monitoring
```javascript
// Debug component to monitor cache performance
const GeocodingCacheMonitor = () => {
  const stats = getGeocodingCacheStats()
  
  return (
    <div className="cache-monitor">
      <h3>Geocoding Cache Stats</h3>
      <p>Total cached: {stats.total}</p>
      <p>Active: {stats.active}</p>
      <p>Stale: {stats.stale}</p>
    </div>
  )
}
```

#### 6.2 Performance Metrics
- Track API call reduction
- Monitor cache hit rates
- Measure loading time improvements

## Migration Strategy

### Step 1: Gradual Migration
1. Install React Query
2. Implement new hooks alongside existing code
3. Test with a subset of locations
4. Monitor performance improvements

### Step 2: Full Migration
1. Replace all direct geocoding calls
2. Remove old useGeocoding hook
3. Update all components to use new hooks
4. Clean up unused code

### Step 3: Optimization
1. Implement prefetching for common locations
2. Add cache management utilities
3. Optimize batch processing
4. Add monitoring and debugging tools

## Expected Outcomes

### Mapbox Cost Reduction
- **API Calls**: 70-90% reduction in Mapbox geocoding API calls
- **Cost Savings**: Significant reduction in Mapbox API expenses
- **Loading Time**: 50-80% faster initial load for cached locations
- **User Experience**: Eliminate duplicate loading states for same locations
- **Cache Efficiency**: Aggressive caching for expensive geocoding operations

### Code Quality
- **Maintainability**: Centralized geocoding logic
- **Error Handling**: Consistent error handling across the app
- **Testing**: Easier to test with React Query's testing utilities
- **Debugging**: Better visibility into geocoding state

## Files to Create/Modify

### New Files
- `src/utils/geocodingCache.js`
- `src/hooks/useGeocodingQuery.js`
- `src/hooks/useBatchGeocoding.js`
- `src/hooks/useGeocodingPrefetch.js`
- `REACT_QUERY_GEOCODING_PLAN.md`

### Modified Files
- `src/App.jsx` - Add QueryClientProvider
- `src/hooks/useMap.js` - Replace direct geocoding with React Query
- `src/hooks/useGeocoding.js` - Update to use React Query internally
- `package.json` - Add @tanstack/react-query dependency

## Timeline Estimate
- **Phase 1-2**: 1-2 days (Setup and core hooks)
- **Phase 3**: 1 day (Update existing components)
- **Phase 4**: 1-2 days (Advanced features)
- **Phase 5**: 1 day (Performance optimizations)
- **Phase 6**: 1 day (Testing and monitoring)

**Total**: 5-7 days for complete implementation

## Success Metrics (Mapbox Cost Focus)
- [ ] 70%+ reduction in Mapbox geocoding API calls
- [ ] Significant reduction in Mapbox API costs
- [ ] Zero duplicate geocoding requests for same locations
- [ ] Improved error handling and retry logic for expensive API calls
- [ ] Better user experience with cached data
- [ ] Cache hit rate > 80% for repeated location lookups
