import { useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { geocode, calculateAnimationDuration } from '../utils/mapboxUtils'
import { formatPopupDate } from '../utils/dateUtils'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoiam9uYXRoYW53aWxsaW5ndG9uIiwiYSI6ImNsZ2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5In0.example'

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
        center: [30, 20],
        zoom: 2,
        interactive: true,
        dragPan: { deceleration: 0.98, maxSpeed: 800 },
        scrollZoom: { speed: 0.2, smooth: true, maxZoom: 18, minZoom: 1 },
        boxZoom: false,
        doubleClickZoom: false,
        keyboard: false,
        attributionControl: false,
        maxBounds: [[-180, -85], [180, 85]], // Prevent going beyond reasonable bounds
        maxZoom: 18,
        minZoom: 1
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
        try { console.log('useMap:event movestart', mapRef.current.getCenter().toArray()) } catch {}
      })
      mapRef.current.on('moveend', () => {
        try { console.log('useMap:event moveend', mapRef.current.getCenter().toArray()) } catch {}
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
    console.log('useMap: Locations changed, locations count:', locations.length, 'loading:', loading, 'authenticated:', isAuthenticated)
    console.log('useMap: First few locations:', locations.slice(0, 3).map(loc => ({ City: loc.City, Country: loc.Country })))
    
    if (!mapRef.current || !locations.length || loading || !isAuthenticated) {
      console.log('useMap: No map ref, no locations, still loading, or not authenticated - skipping markers')
      return
    }
    
    // Force marker recreation to apply new geocoding logic
    console.log('useMap: Force recreating markers to apply updated geocoding logic')

    const addMarkers = async () => {
      console.log('useMap: Clearing existing markers, count:', markersRef.current.length)
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
      locationToMarkerMapRef.current.clear()
      console.log('useMap: Markers cleared')

      // Remove existing source and layers if they exist
      if (mapRef.current.getSource('locations')) {
        mapRef.current.removeLayer('clusters')
        mapRef.current.removeLayer('cluster-count')
        mapRef.current.removeLayer('unclustered-point')
        mapRef.current.removeSource('locations')
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
          'circle-color': '#ffdb5f',
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
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
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
          'circle-color': '#ffdb5f',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#000'
        }
      })

      // Add click handlers
      mapRef.current.on('click', 'clusters', (e) => {
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        })
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
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ['unclustered-point']
        })
        if (features.length > 0) {
          const locationIndex = features[0].properties.id
          console.log('useMap: Marker clicked for:', locations[locationIndex].City, 'at index:', locationIndex)
          onLocationSelect(locationIndex)
        }
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
    
    if (!mapRef.current) {
      console.log('handleLocationSelect: No map ref, returning')
      return
    }
    
    if (index < 0 || index >= locations.length) {
      console.log('handleLocationSelect: Invalid index:', index, 'locations length:', locations.length)
      return
    }

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
    const currentCenter = mapRef.current.getCenter()
    
    // Validate coordinates
    if (!isFinite(coords[0]) || !isFinite(coords[1]) || !isFinite(currentCenter.lng) || !isFinite(currentCenter.lat)) {
      console.warn('useMap:select: invalid centers', { coords, currentCenter })
      return
    }
    
    // Clamp coordinates to valid ranges
    const validLng = Math.max(-180, Math.min(180, coords[0]))
    const validLat = Math.max(-85, Math.min(85, coords[1]))
    const validCurrentLng = Math.max(-180, Math.min(180, currentCenter.lng))
    const validCurrentLat = Math.max(-85, Math.min(85, currentCenter.lat))
    
    if (validLng !== coords[0] || validLat !== coords[1]) {
      console.warn('useMap:select: coordinates clamped', { original: coords, clamped: [validLng, validLat] })
    }
    
    // Calculate the shortest rotation to make the marker visible
    let targetLng = validLng
    const lngDiff = targetLng - validCurrentLng
    if (Math.abs(lngDiff) > 180) {
      if (lngDiff > 0) {
        targetLng = validLng - 360
      } else {
        targetLng = validLng + 360
      }
    }

    // Calculate distance for duration scaling
    const distance = Math.sqrt(
      Math.pow(targetLng - validCurrentLng, 2) + 
      Math.pow(validLat - validCurrentLat, 2)
    )

    // Faster, capped duration for selection animation
    const baseDuration = 700
    const distanceMultiplier = Math.min(distance * 800, 2)
    const duration = Math.max(baseDuration, Math.min(baseDuration * distanceMultiplier, 1600))

    // Animate to marker with world rotation
    mapRef.current.easeTo({
      center: [Number(targetLng), Number(validLat)],
      zoom: 2,
      duration,
      easing: (t) => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      }
    })
  }, [locations])

  // Manual refresh function to force marker recreation
  const refreshMarkers = useCallback(() => {
    console.log('useMap: Manual marker refresh requested')
    if (mapRef.current && locations.length && !loading && isAuthenticated) {
      // Remove existing source and layers if they exist
      if (mapRef.current.getSource('locations')) {
        mapRef.current.removeLayer('clusters')
        mapRef.current.removeLayer('cluster-count')
        mapRef.current.removeLayer('unclustered-point')
        mapRef.current.removeSource('locations')
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
            'circle-color': '#ffdb5f',
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
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
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
            'circle-color': '#ffdb5f',
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#000'
          }
        })

        // Add click handlers
        mapRef.current.on('click', 'clusters', (e) => {
          const features = mapRef.current.queryRenderedFeatures(e.point, {
            layers: ['clusters']
          })
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
          const features = mapRef.current.queryRenderedFeatures(e.point, {
            layers: ['unclustered-point']
          })
          if (features.length > 0) {
            const locationIndex = features[0].properties.id
            console.log('useMap: Marker clicked for:', locations[locationIndex].City, 'at index:', locationIndex)
            onLocationSelect(locationIndex)
          }
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
