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
export const useMap = (locations, onLocationSelect, loading) => {
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
        center: [0, 20],
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
      
      // Add bounds reset on invalid coordinates
      mapRef.current.on('moveend', () => {
        try {
          const center = mapRef.current.getCenter()
          const zoom = mapRef.current.getZoom()
          
          // Check if we're in an invalid location
          if (!isFinite(center.lng) || !isFinite(center.lat) || 
              center.lat < -85 || center.lat > 85 || 
              zoom < 1 || zoom > 18) {
            console.warn('useMap: Invalid map state detected, resetting to safe location')
            mapRef.current.easeTo({
              center: [0, 20],
              zoom: 2,
              duration: 1000
            })
          }
        } catch (error) {
          console.error('useMap: Error checking map state:', error)
        }
      })

      // Prevent extreme movements during drag/scroll
      mapRef.current.on('movestart', () => {
        try {
          const center = mapRef.current.getCenter()
          if (!isFinite(center.lng) || !isFinite(center.lat)) {
            console.warn('useMap: Invalid coordinates at movestart, preventing movement')
            mapRef.current.stop()
            mapRef.current.easeTo({
              center: [0, 20],
              zoom: 2,
              duration: 500
            })
          }
        } catch (error) {
          console.error('useMap: Error in movestart handler:', error)
        }
      })

      // Additional safety check during movement
      mapRef.current.on('move', () => {
        try {
          const center = mapRef.current.getCenter()
          const zoom = mapRef.current.getZoom()
          
          // If we detect extreme coordinates during movement, stop and reset
          if (!isFinite(center.lng) || !isFinite(center.lat) || 
              center.lat < -90 || center.lat > 90 || 
              center.lng < -180 || center.lng > 180) {
            console.warn('useMap: Extreme coordinates detected during movement, stopping and resetting')
            mapRef.current.stop()
            mapRef.current.easeTo({
              center: [0, 20],
              zoom: 2,
              duration: 500
            })
          }
        } catch (error) {
          console.error('useMap: Error in move handler:', error)
        }
      })

      mapRef.current.on('movestart', () => {
        try { console.log('useMap:event movestart', mapRef.current.getCenter().toArray()) } catch {}
      })
      mapRef.current.on('moveend', () => {
        try { console.log('useMap:event moveend', mapRef.current.getCenter().toArray()) } catch {}
      })

      const origEaseTo = mapboxgl.Map.prototype.easeTo
      mapRef.current.easeTo = function(options) {
        const currentCenter = this.getCenter()
        // Normalize target center to an object with lng/lat numbers
        let targetCenterLng = currentCenter.lng
        let targetCenterLat = currentCenter.lat
        if (options && options.center != null) {
          if (Array.isArray(options.center)) {
            targetCenterLng = Number(options.center[0])
            targetCenterLat = Number(options.center[1])
          } else if (typeof options.center === 'object') {
            targetCenterLng = Number(options.center.lng)
            targetCenterLat = Number(options.center.lat)
          }
        }
        
        // Clamp coordinates to safe bounds
        targetCenterLng = Math.max(-180, Math.min(180, targetCenterLng))
        targetCenterLat = Math.max(-85, Math.min(85, targetCenterLat))
        
        // Ensure coordinates are finite
        if (!isFinite(targetCenterLng) || !isFinite(targetCenterLat)) {
          console.warn('useMap: Non-finite coordinates detected, using safe defaults')
          targetCenterLng = 0
          targetCenterLat = 20
        }
        let duration
        if (options && typeof options.duration === 'number') {
          // Respect explicit duration (used by our selection animation)
          duration = options.duration
        } else {
          // Faster default animation when duration not specified
          const baseDuration = 800
          duration = calculateAnimationDuration(
            [currentCenter.lng, currentCenter.lat],
            [targetCenterLng, targetCenterLat],
            baseDuration
          )
        }
        console.log('useMap:easeTo', { from: [currentCenter.lng, currentCenter.lat], to: [targetCenterLng, targetCenterLat], duration })
        return origEaseTo.call(this, {
          ...options,
          center: [targetCenterLng, targetCenterLat],
          duration,
          easing: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
        })
      }
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
    console.log('useMap: Locations changed, locations count:', locations.length, 'loading:', loading)
    console.log('useMap: First few locations:', locations.slice(0, 3).map(loc => ({ City: loc.City, Country: loc.Country })))
    
    if (!mapRef.current || !locations.length || loading) {
      console.log('useMap: No map ref, no locations, or still loading - skipping markers')
      return
    }

    const addMarkers = async () => {
      console.log('useMap: Clearing existing markers, count:', markersRef.current.length)
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
      locationToMarkerMapRef.current.clear()
      console.log('useMap: Markers cleared')

      for (const row of locations) {
        console.log('useMap: Geocoding location:', row.City, row.Country, 'Full row:', row)
        const coords = await geocode(row)
        if (!coords) {
          console.log('useMap: No coordinates found for:', row.City)
          continue
        }
        console.log('useMap: Found coordinates:', coords, 'for:', row.City)

        const marker = new mapboxgl.Marker({ color: '#ffdb5f' })
          .setLngLat(coords)
          .addTo(mapRef.current)

        // Add click event to marker
        const markerElement = marker.getElement()
        markerElement.style.cursor = 'pointer'
        markerElement.addEventListener('click', () => {
          // Find the index of this location in the filtered locations array
          const locationIndex = locations.findIndex(loc => loc === row)
          if (locationIndex !== -1) {
            console.log('useMap: Marker clicked for:', row.City, 'at index:', locationIndex)
            onLocationSelect(locationIndex)
          }
        })

        markersRef.current.push(marker)
        // Map the actual row object identity to its marker
        locationToMarkerMapRef.current.set(row, marker)
        
        console.log('useMap: Added marker for:', row.City, 'at coords:', coords)
      }

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
    if (!mapRef.current) {
      return
    }
    
    if (index < 0 || index >= locations.length) {
      return
    }

    const location = locations[index]
    const marker = locationToMarkerMapRef.current.get(location)

    // If markers aren't ready yet, queue this selection
    if (!marker) {
      pendingSelectIndexRef.current = index
      return
    }
    
    // Highlight the selected marker with color change
    markersRef.current.forEach((m) => {
      const element = m.getElement()
      const svg = element.querySelector('svg')
      const innerCircle = element.querySelector('svg circle')
      if (m === marker) {
        // Active marker: purple color
        if (svg) svg.style.fill = 'rgb(225, 215, 251)'
        if (innerCircle) innerCircle.style.fill = '#000'
      } else {
        // Inactive markers: golden yellow
        if (svg) svg.style.fill = '#ffdb5f'
        if (innerCircle) innerCircle.style.fill = '#000'
      }
    })

    // Subtly fade other markers during the spin to reduce visual noise
    markersRef.current.forEach((m) => {
      const element = m.getElement()
      if (m !== marker) {
        element.style.transition = (element.style.transition ? element.style.transition + ', ' : '') + 'opacity 0.2s ease'
        element.style.opacity = '0.2'
      } else {
        element.style.opacity = '1'
      }
    })

    // Get marker coordinates
    const ll = marker.getLngLat()
    const currentCenter = mapRef.current.getCenter()
    
    // Validate coordinates
    if (!isFinite(ll.lng) || !isFinite(ll.lat) || !isFinite(currentCenter.lng) || !isFinite(currentCenter.lat)) {
      console.warn('useMap:select: invalid centers', { ll, currentCenter })
      return
    }
    
    // Clamp coordinates to valid ranges
    const validLng = Math.max(-180, Math.min(180, ll.lng))
    const validLat = Math.max(-85, Math.min(85, ll.lat))
    const validCurrentLng = Math.max(-180, Math.min(180, currentCenter.lng))
    const validCurrentLat = Math.max(-85, Math.min(85, currentCenter.lat))
    
    if (validLng !== ll.lng || validLat !== ll.lat) {
      console.warn('useMap:select: coordinates clamped', { original: ll, clamped: [validLng, validLat] })
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
    // No marker style resets needed after movement

    mapRef.current.easeTo({
      center: [Number(targetLng), Number(validLat)],
      zoom: 2,
      duration,
      easing: (t) => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      }
    })
  }, [locations])

  return {
    mapContainerRef,
    handleLocationSelect
  }
}
