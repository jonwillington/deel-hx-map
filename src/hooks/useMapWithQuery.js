import { useEffect, useRef, useCallback, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import { calculateAnimationDuration } from '../utils/mapboxUtils'
import { formatPopupDate } from '../utils/dateUtils'
import { getMapColors } from '../utils/colorUtils'
import { useLocationBatchGeocoding, useBatchGeocodingStats } from './useBatchGeocoding'
import { queryClient } from '../main'
import { getMapboxCacheStats } from '../utils/geocodingCache'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoiam9ud2lsbGluZ3Rvbi1kZWVsIiwiYSI6ImNtZW50YTlpczE3OHYybXNlY2ZpMGt6eTYifQ.bWg-6-XReemxlvo6md_O0g'

/**
 * React Query optimized map hook for cost reduction
 * Replaces direct geocoding calls with cached React Query results
 * @param {Array} locations - Array of location data
 * @param {Function} onLocationSelect - Function to call when a location is selected
 * @param {boolean} loading - Loading state from CSV data
 * @param {boolean} isAuthenticated - Authentication state
 * @returns {Object} Map state and functions with cache statistics
 */
export const useMapWithQuery = (locations, onLocationSelect, loading, isAuthenticated = true) => {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const pendingSelectIndexRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const lastClickTimeRef = useRef(0)
  const onLocationSelectRef = useRef(onLocationSelect)

  // Keep onLocationSelect ref updated
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect
  }, [onLocationSelect])

  // Use batch geocoding with React Query - memoize locations to prevent infinite renders
  const memoizedLocations = useMemo(() => locations || [], [locations])
  const geocodingResults = useLocationBatchGeocoding(memoizedLocations)
  const geocodingStats = useBatchGeocodingStats(geocodingResults)

  // Log cache statistics for debugging (only when geocoding stats change significantly)
  useEffect(() => {
    if (geocodingStats.total > 0 && geocodingStats.completionPercentage === 100) {
      // Only log when all geocoding is complete for the first time
      const cacheStats = getMapboxCacheStats(queryClient, false) // Log important milestones
      console.log('🗃️ Final Cache Statistics:', cacheStats)
      console.log('📊 Final Geocoding Statistics:', geocodingStats)
    }
  }, [geocodingStats.completionPercentage, queryClient])

  // Create GeoJSON features from geocoded results - stabilized with data-based dependencies
  const features = useMemo(() => {
    // Wait for all geocoding to complete or fail
    if (!memoizedLocations?.length || geocodingResults.some(result => result.isLoading)) {
      return []
    }
    
    const validFeatures = []
    
    memoizedLocations.forEach((location, index) => {
      const geocodingResult = geocodingResults[index]
      
      if (geocodingResult?.data) {
        validFeatures.push({
          type: 'Feature',
          properties: { 
            id: index, 
            location: location
          },
          geometry: { 
            type: 'Point', 
            coordinates: geocodingResult.data 
          }
        })
      }
    })
    
    // Only log when features count changes significantly
    if (validFeatures.length > 0) {
      console.log('🗺️ Created', validFeatures.length, 'features from', memoizedLocations.length, 'locations')
    }
    return validFeatures
  }, [
    memoizedLocations?.length,
    // Only depend on the actual data, not the query objects
    geocodingResults.map(r => r.data ? JSON.stringify(r.data) : r.error ? 'error' : r.isLoading ? 'loading' : 'empty').join('|')
  ])

  // Initialize map (same as original)
  useEffect(() => {
    console.log('useMapWithQuery:init start')
    const initMap = () => {
      if (mapRef.current) {
        console.log('useMapWithQuery:init already initialized')
        return
      }
      if (!mapContainerRef.current) {
        // Only log occasionally to avoid spam
        if (Math.random() < 0.1) {
          console.log('useMapWithQuery:init waiting for container...')
        }
        requestAnimationFrame(initMap)
        return
      }
      
      console.log('useMapWithQuery:init creating instance')
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/jonathanwillington/cm8ym2u5b003d01r431z7872k',
        center: [10, 50], // Centered over Europe
        zoom: 3,
        interactive: true,
        attributionControl: false
      })

      console.log('useMapWithQuery:init instance created, waiting for load...')
      
      mapRef.current.on('load', () => {
        console.log('🗺️ Map loaded successfully')
      })
      
      mapRef.current.on('error', (e) => {
        console.error('🗺️ Map error:', e)
      })
    }
    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Add clustered markers when features are ready - reduced logging
  useEffect(() => {
    console.log('🔍 Marker effect conditions:', {
      hasMap: !!mapRef.current,
      featuresLength: features.length,
      loading: loading,
      isAuthenticated: isAuthenticated
    })
    
    if (!mapRef.current || !features.length || loading) {
      console.log('❌ Markers blocked by condition check')
      return
    }
    
    console.log('🗺️ Adding', features.length, 'markers to map')

    const addClusteredMarkers = () => {
      // Clean up existing source and layers
      if (mapRef.current.getSource('locations')) {
        console.log('🧹 CLEANING UP - removing existing layers and listeners')
        
        try {
          if (mapRef.current.getLayer('clusters')) {
            mapRef.current.off('click', 'clusters')
            mapRef.current.off('mouseenter', 'clusters')
            mapRef.current.off('mouseleave', 'clusters')
          }
          if (mapRef.current.getLayer('unclustered-point')) {
            mapRef.current.off('click', 'unclustered-point')
            mapRef.current.off('mouseenter', 'unclustered-point')
            mapRef.current.off('mouseleave', 'unclustered-point')
          }
        } catch (e) {
          console.warn('🧹 Error removing event listeners:', e)
        }
        
        try {
          if (mapRef.current.getLayer('clusters')) mapRef.current.removeLayer('clusters')
          if (mapRef.current.getLayer('cluster-count')) mapRef.current.removeLayer('cluster-count')
          if (mapRef.current.getLayer('unclustered-point')) mapRef.current.removeLayer('unclustered-point')
          mapRef.current.removeSource('locations')
          console.log('🧹 Layers and source removed')
        } catch (e) {
          console.warn('🧹 Error removing layers/source:', e)
        }
      }

      // Add GeoJSON source with clustering
      mapRef.current.addSource('locations', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      })

      // Add cluster layer
      mapRef.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'locations',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': getMapColors().markerColor,
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20, 100,
            30, 750,
            40
          ]
        }
      })

      // Add cluster count layer
      mapRef.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'locations',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Arial Unicode MS Bold'],
          'text-size': 16
        },
        paint: {
          'text-color': '#000'
        }
      })

      // Add unclustered point layer
      mapRef.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'locations',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': getMapColors().markerColor,
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': getMapColors().markerStroke
        }
      })

      // Add click handlers with debouncing
      mapRef.current.on('click', 'clusters', (e) => {
        const now = Date.now()
        if (now - lastClickTimeRef.current < 300) return
        lastClickTimeRef.current = now
        
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        })
        if (!features.length) return
        
        const clusterId = features[0].properties.cluster_id
        mapRef.current.getSource('locations').getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return
            mapRef.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            })
          }
        )
      })

      mapRef.current.on('click', 'unclustered-point', (e) => {
        console.log('📍 PIN CLICKED (React Query version)')
        
        e.preventDefault()
        e.originalEvent?.stopPropagation()
        
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ['unclustered-point']
        })
        
        if (features.length > 0) {
          const locationIndex = features[0].properties.id
          console.log('📍 Location index:', locationIndex, 'City:', locations[locationIndex]?.City)
          
          onLocationSelectRef.current(locationIndex, 'pin')
          handleLocationSelect(locationIndex)
        }
      })

      // Add hover effects
      mapRef.current.on('mouseenter', 'clusters', () => {
        mapRef.current.getCanvas().style.cursor = 'pointer'
      })
      mapRef.current.on('mouseleave', 'clusters', () => {
        mapRef.current.getCanvas().style.cursor = ''
      })
      mapRef.current.on('mouseenter', 'unclustered-point', () => {
        mapRef.current.getCanvas().style.cursor = 'pointer'
      })
      mapRef.current.on('mouseleave', 'unclustered-point', () => {
        mapRef.current.getCanvas().style.cursor = ''
      })

      console.log('✅ Markers added successfully')
    }

    addClusteredMarkers()
  }, [features, loading, isAuthenticated])

  // Smart zoom location selection (same as original but with features)
  const handleLocationSelect = useCallback((index) => {
    console.log('handleLocationSelect (React Query): Called with index:', index)
    
    if (!mapRef.current || index < 0 || index >= locations.length) {
      console.log('handleLocationSelect: Invalid conditions')
      return
    }

    // Find the feature for this location
    const feature = features.find(f => f.properties.id === index)
    if (!feature) {
      console.log('handleLocationSelect: No feature found for index:', index)
      return
    }
    
    const coords = feature.geometry.coordinates
    const currentZoom = mapRef.current.getZoom()
    const currentCenter = mapRef.current.getCenter()
    
    // Calculate distance and smart zoom
    const distance = Math.sqrt(
      Math.pow(currentCenter.lng - coords[0], 2) + 
      Math.pow(currentCenter.lat - coords[1], 2)
    )
    
    let targetZoom
    if (currentZoom > 8 && distance < 0.1) {
      targetZoom = Math.max(currentZoom, 10)
    } else if (distance < 0.5) {
      targetZoom = 10
    } else {
      targetZoom = 6
    }
    
    console.log('🗺️ Smart zoom - current:', currentZoom, 'target:', targetZoom, 'distance:', distance)
    
    mapRef.current.flyTo({
      center: coords,
      zoom: targetZoom,
      duration: 1000
    })
  }, [])

  // Manual refresh with cache invalidation
  const refreshMarkers = useCallback(() => {
    console.log('💾 Manual marker refresh with cache invalidation requested')
    
    // Invalidate geocoding cache to force fresh API calls
    queryClient.invalidateQueries({ queryKey: ['geocode'] })
    
    // The useEffect will automatically trigger when the cache is invalidated
    console.log('💾 Cache invalidated, markers will refresh automatically')
  }, [])

  return {
    mapContainerRef,
    handleLocationSelect,
    refreshMarkers,
    // Additional debugging info
    geocodingStats,
    cacheStats: getMapboxCacheStats(queryClient, true), // Silent mode for return value
    featuresCount: features.length
  }
}