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
export const useMap = (locations, onLocationSelect) => {
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
        scrollZoom: { speed: 0.3, smooth: true },
        boxZoom: false,
        doubleClickZoom: false,
        keyboard: false,
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

  // Add markers when locations change
  useEffect(() => {
    console.log('useMap: Locations changed, locations count:', locations.length)
    if (!mapRef.current || !locations.length) {
      console.log('useMap: No map ref or no locations, skipping markers')
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

        const marker = new mapboxgl.Marker({ color: '#1a1a1a' })
          .setLngLat(coords)
          .addTo(mapRef.current)

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
  }, [locations])

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
    
    // Do not modify marker styling; keep all markers static at their geolocated positions

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
    if (!isFinite(ll.lng) || !isFinite(ll.lat) || !isFinite(currentCenter.lng) || !isFinite(currentCenter.lat)) {
      console.warn('useMap:select: invalid centers', { ll, currentCenter })
      return
    }
    
    // Calculate the shortest rotation to make the marker visible
    let targetLng = ll.lng
    const lngDiff = targetLng - currentCenter.lng
    if (Math.abs(lngDiff) > 180) {
      if (lngDiff > 0) {
        targetLng = ll.lng - 360
      } else {
        targetLng = ll.lng + 360
      }
    }

    // Calculate distance for duration scaling
    const distance = Math.sqrt(
      Math.pow(targetLng - currentCenter.lng, 2) + 
      Math.pow(ll.lat - currentCenter.lat, 2)
    )

    // Faster, capped duration for selection animation
    const baseDuration = 700
    const distanceMultiplier = Math.min(distance * 800, 2)
    const duration = Math.max(baseDuration, Math.min(baseDuration * distanceMultiplier, 1600))

    // Animate to marker with world rotation
    // No marker style resets needed after movement

    mapRef.current.easeTo({
      center: [Number(targetLng), Number(ll.lat)],
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
