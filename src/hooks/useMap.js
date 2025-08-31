import { useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { geocode, calculateAnimationDuration } from '../utils/mapboxUtils'
import { formatPopupDate } from '../utils/dateUtils'
import { getMapColors } from '../utils/colorUtils'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoiam9ud2lsbGluZ3Rvbi1kZWVsIiwiYSI6ImNtZW50YTlpczE3OHYybXNlY2ZpMGt6eTYifQ.bWg-6-XReemxlvo6md_O0g'

/**
 * Custom hook for managing map functionality
 * @param {Array} locations - Array of location data
 * @param {Function} onLocationSelect - Function to call when a location is selected
 * @returns {Object} Map state and functions
 */
export const useMap = (locations, onLocationSelect, loading, isAuthenticated = true) => {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const locationToMarkerMapRef = useRef(new Map()) // Map location identity to marker
  const pendingSelectIndexRef = useRef(null)
  const isAnimatingRef = useRef(false) // Track if we're currently animating
  const lastClickTimeRef = useRef(0) // Debounce rapid clicks

  // Initialize map
  useEffect(() => {
    console.log('useMap:init start')
    const initMap = () => {
      if (mapRef.current) {
        console.log('useMap:init already initialized')
        return
      }
      if (!mapContainerRef.current) {
        console.log('useMap:init no container yet, retrying next frame')
        requestAnimationFrame(initMap)
        return
      }
      try {
        console.log('useMap:init container size', {
          w: mapContainerRef.current.clientWidth,
          h: mapContainerRef.current.clientHeight
        })
      } catch {}
      console.log('useMap:init creating instance')
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/jonathanwillington/cm8ym2u5b003d01r431z7872k',
        center: [10, 50], // Centered over Europe
        zoom: 3, // Less zoom
        interactive: true,
        attributionControl: false
      })

      console.log('useMap:init instance created, waiting for load...')
      
      mapRef.current.on('load', () => {
        try {
          console.log('useMap:event load', {
            center: mapRef.current.getCenter().toArray(),
            zoom: mapRef.current.getZoom()
          })
        } catch {}
      })
      
      mapRef.current.on('error', (e) => {
        console.error('useMap:event error', e)
      })
      
      mapRef.current.on('movestart', () => {
        console.log('useMap:event movestart', mapRef.current.getCenter().toArray()) 
      })
      
      mapRef.current.on('moveend', () => {
        console.log('useMap:event moveend', mapRef.current.getCenter().toArray()) 
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

  // Add markers when locations change and loading is complete
  useEffect(() => {
    console.log('🔄 MARKERS USEEFFECT TRIGGERED')
    console.log('🔄 Locations count:', locations.length, 'loading:', loading, 'authenticated:', isAuthenticated)
    console.log('🔄 Map ref exists:', !!mapRef.current)
    console.log('🔄 First few locations:', locations.slice(0, 3).map(loc => ({ City: loc.City, Country: loc.Country })))
    
    if (!mapRef.current || !locations.length || loading || !isAuthenticated) {
      console.log('🔄 SKIPPING MARKERS - missing requirements')
      return
    }
    
    console.log('🔄 PROCEEDING WITH MARKER RECREATION')

    const addMarkers = async () => {
      console.log('useMap: Clearing existing markers, count:', markersRef.current.length)
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
      locationToMarkerMapRef.current.clear()
      console.log('useMap: Markers cleared')

      // Remove existing source and layers if they exist
      if (mapRef.current.getSource('locations')) {
        console.log('🧹 CLEANING UP - removing existing layers and listeners')
        
        // Remove event listeners first - be more specific about which handlers to remove
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
          console.log('🧹 Event listeners removed')
        } catch (e) {
          console.warn('🧹 Error removing event listeners:', e)
        }
        
        // Then remove layers and source
        try {
          if (mapRef.current.getLayer('clusters')) mapRef.current.removeLayer('clusters')
          if (mapRef.current.getLayer('cluster-count')) mapRef.current.removeLayer('cluster-count')
          if (mapRef.current.getLayer('unclustered-point')) mapRef.current.removeLayer('unclustered-point')
          mapRef.current.removeSource('locations')
          console.log('🧹 Layers and source removed')
        } catch (e) {
          console.warn('🧹 Error removing layers/source:', e)
        }
      } else {
        console.log('🧹 NO CLEANUP NEEDED - no existing source')
      }

      // Collect all coordinates and create GeoJSON
      const features = []
      for (let i = 0; i < locations.length; i++) {
        const row = locations[i]
        console.log('useMap: Geocoding location:', row.City, row.Country, 'Full row:', row)
        console.log('useMap: Available fields in row:', Object.keys(row))
        const coords = await geocode(row)
        if (!coords) {
          console.log('useMap: No coordinates found for:', row.City)
          continue
        }
        console.log('useMap: Found coordinates:', coords, 'for:', row.City)

        features.push({
          type: 'Feature',
          properties: {
            id: i,
            location: row
          },
          geometry: {
            type: 'Point',
            coordinates: coords
          }
        })
      }

      // Add GeoJSON source with clustering
      mapRef.current.addSource('locations', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        },
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points
        clusterRadius: 50 // Radius of each cluster when clustering points
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
      
      console.log('🎯 unclustered-point layer added with features:', features.length)
      console.log('🎯 Layer visibility:', mapRef.current.getLayoutProperty('unclustered-point', 'visibility'))
      console.log('🎯 Layer paint properties:', mapRef.current.getPaintProperty('unclustered-point', 'circle-radius'))

      // Add click handlers with debouncing
      mapRef.current.on('click', 'clusters', (e) => {
        const now = Date.now()
        if (now - lastClickTimeRef.current < 300) return // Debounce 300ms
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


      // Change cursor on hover
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

      // If there was a pending selection, try animating to it now
      if (pendingSelectIndexRef.current != null) {
        const idx = pendingSelectIndexRef.current
        pendingSelectIndexRef.current = null
        // Defer to next tick to ensure DOM is updated
        requestAnimationFrame(() => handleLocationSelect(idx))
      }
    }

    console.log('useMap: Starting to add markers...')
    addMarkers()
  }, [locations, loading])

  // Handle location selection - just for map animation
  const handleLocationSelect = useCallback((index) => {
    console.log('handleLocationSelect: Called with index:', index)
    console.log('handleLocationSelect: Total locations:', locations.length)
    console.log('handleLocationSelect: Map ref exists:', !!mapRef.current)
    console.log('handleLocationSelect: Currently animating (before reset):', isAnimatingRef.current)
    
    if (!mapRef.current) {
      console.log('handleLocationSelect: No map ref, returning')
      return
    }
    
    if (index < 0 || index >= locations.length) {
      console.log('handleLocationSelect: Invalid index:', index, 'locations length:', locations.length)
      return
    }

    // Force reset animation flag
    isAnimatingRef.current = false
    console.log('handleLocationSelect: Animation flag reset to:', isAnimatingRef.current)

    const location = locations[index]
    console.log('handleLocationSelect: Selected location:', location)
    console.log('handleLocationSelect: Location city/country:', location.City, location.Country)
    
    // Get coordinates from the GeoJSON source
    const source = mapRef.current.getSource('locations')
    if (!source) {
      pendingSelectIndexRef.current = index
      return
    }
    
    // Find the feature for this location
    const features = source._data.features
    const feature = features.find(f => f.properties.id === index)
    if (!feature) {
      pendingSelectIndexRef.current = index
      return
    }
    
    const coords = feature.geometry.coordinates
    
    // Basic coordinate validation
    if (!isFinite(coords[0]) || !isFinite(coords[1])) {
      console.warn('useMap:select: invalid coordinates', coords)
      return
    }
    
    console.log('useMap: Flying to coordinates:', coords)
    
    // Smart zoom logic: maintain current zoom if already zoomed in, otherwise zoom to city level
    const currentZoom = mapRef.current.getZoom()
    const currentCenter = mapRef.current.getCenter()
    
    // Calculate distance between current center and target location
    const distance = Math.sqrt(
      Math.pow(currentCenter.lng - coords[0], 2) + 
      Math.pow(currentCenter.lat - coords[1], 2)
    )
    
    // If we're already zoomed in close (zoom > 8) and the distance is small (same city/area),
    // maintain current zoom level. Otherwise, zoom to appropriate level.
    let targetZoom
    if (currentZoom > 8 && distance < 0.1) {
      // Close zoom and nearby location - maintain current zoom
      targetZoom = Math.max(currentZoom, 10) // Ensure minimum zoom of 10 for local navigation
    } else if (distance < 0.5) {
      // Same city/region but not close zoom - use city level
      targetZoom = 10
    } else {
      // Different city/region - use country/region level
      targetZoom = 6
    }
    
    console.log('useMap: Smart zoom - current:', currentZoom, 'target:', targetZoom, 'distance:', distance)
    
    // Animate to the location with smart zoom
    mapRef.current.flyTo({
      center: coords,
      zoom: targetZoom,
      duration: 1000
    })
  }, [locations])

  // Manual refresh function to force marker recreation
  const refreshMarkers = useCallback(() => {
    console.log('useMap: Manual marker refresh requested')
    if (mapRef.current && locations.length && !loading && isAuthenticated) {
      // Remove existing source and layers if they exist
      if (mapRef.current.getSource('locations')) {
        // Remove event handlers first - be more specific
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
          console.warn('Error removing event listeners in refreshMarkers:', e)
        }
        
        // Then remove layers and source
        try {
          if (mapRef.current.getLayer('clusters')) mapRef.current.removeLayer('clusters')
          if (mapRef.current.getLayer('cluster-count')) mapRef.current.removeLayer('cluster-count')
          if (mapRef.current.getLayer('unclustered-point')) mapRef.current.removeLayer('unclustered-point')
          mapRef.current.removeSource('locations')
        } catch (e) {
          console.warn('Error removing layers/source in refreshMarkers:', e)
        }
      }

      // Recreate markers using the same clustering approach
      const addMarkers = async () => {
        console.log('useMap: Recreating markers with clustering')
        
        // Collect all coordinates and create GeoJSON
        const features = []
        for (let i = 0; i < locations.length; i++) {
          const row = locations[i]
          console.log('useMap: Geocoding location:', row.City, row.Country)
          const coords = await geocode(row)
          if (!coords) {
            console.log('useMap: No coordinates found for:', row.City)
            continue
          }
          console.log('useMap: Found coordinates:', coords, 'for:', row.City)

          features.push({
            type: 'Feature',
            properties: {
              id: i,
              location: row
            },
            geometry: {
              type: 'Point',
              coordinates: coords
            }
          })
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
          if (now - lastClickTimeRef.current < 300) return // Debounce 300ms
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

        // Add event listeners
        console.log('🎯 ADDING EVENT LISTENERS')
        
        // Add general map click handler for debugging
        mapRef.current.on('click', (e) => {
          console.log('🗺️ MAP CLICKED (general) at:', e.point)
          console.log('🗺️ Querying all layers at click point...')
          const allFeatures = mapRef.current.queryRenderedFeatures(e.point)
          console.log('🗺️ All features found:', allFeatures.length)
          allFeatures.forEach((feature, i) => {
            console.log(`🗺️ Feature ${i}:`, {
              layerId: feature.layer?.id || 'no-layer',
              sourceLayer: feature.sourceLayer || 'no-source-layer',
              properties: feature.properties || 'no-properties'
            })
          })
        })
        console.log('🎯 General click handler added')
        
        mapRef.current.on('click', 'unclustered-point', (e) => {
          console.log('📍 PIN CLICKED - event fired')
          console.log('📍 Event point:', e.point)
          console.log('📍 Event timestamp:', Date.now())
          
          e.preventDefault()
          e.originalEvent?.stopPropagation()
          
          const features = mapRef.current.queryRenderedFeatures(e.point, {
            layers: ['unclustered-point']
          })
          console.log('📍 Found features:', features.length)
          
          if (features.length > 0) {
            const locationIndex = features[0].properties.id
            console.log('📍 Location index:', locationIndex)
            console.log('📍 Location name:', locations[locationIndex]?.City)
            console.log('📍 CALLING onLocationSelect with index:', locationIndex)
            onLocationSelect(locationIndex, 'pin')
            console.log('📍 onLocationSelect call completed')
            
            // Also animate the map to the location (pin clicks should use smart zoom too)
            console.log('📍 Triggering map animation for pin click')
            handleLocationSelect(locationIndex)
          } else {
            console.log('📍 No features found at click point')
          }
        })
        console.log('🎯 Pin click handler added')
        console.log('🎯 ALL EVENT LISTENERS ATTACHED')

        // Change cursor on hover
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

        console.log('useMap: Markers recreated successfully')
      }
      addMarkers()
    }
  }, [locations, loading, onLocationSelect, isAuthenticated])

  return {
    mapContainerRef,
    handleLocationSelect,
    refreshMarkers
  }
}
