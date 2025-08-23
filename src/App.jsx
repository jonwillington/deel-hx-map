import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import Papa from 'papaparse'
import './App.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoiam9uYXRoYW53aWxsaW5ndG9uIiwiYSI6ImNsZ2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5In0.example'

function App() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showPremiumCard, setShowPremiumCard] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [selectedSegment, setSelectedSegment] = useState('sublets')
  const [showSkeletons, setShowSkeletons] = useState(true)

  const csvUrl = useMemo(() => import.meta.env.VITE_SHEET_CSV || 'https://docs.google.com/spreadsheets/d/14YSy-w-db4rqXa1nHyaPZCVp7Qcd3UcOBJOqfZXENdo/export?format=csv&gid=0', [])

  // Resolve listing type from row (supports multiple header names or falls back to column E)
  const getListingType = (row) => {
    if (!row || typeof row !== 'object') return ''
    const cand = row.Type ?? row.type ?? row['Listing Type'] ?? row['listing type'] ?? row.Category ?? row.category
    let value = cand
    if (!value) {
      const keys = Object.keys(row)
      if (keys.length >= 5) value = row[keys[4]] // column E fallback
    }
    if (!value || typeof value !== 'string') return ''
    const v = value.trim().toLowerCase()
    if (v.startsWith('sublet')) return 'sublets'
    if (v.startsWith('exchange')) return 'exchange'
    return ''
  }

  // Filter locations based on selected segment
  const filteredLocations = useMemo(() => {
    if (!locations || locations.length === 0) return []
    return locations.filter((row) => {
      // Filter by segment
      const t = getListingType(row)
      let segmentMatch = true
      if (selectedSegment === 'sublets') segmentMatch = t === 'sublets'
      else if (selectedSegment === 'exchange') segmentMatch = t === 'exchange'
      
      return segmentMatch
    })
  }, [locations, selectedSegment])

  useEffect(() => {
    if (!csvUrl) {
      setError('CSV URL not configured')
      setLoading(false)
      return
    }
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      dynamicTyping: false,
      complete: (results) => {
        const rows = (results.data || []).filter(r => r && (r.City || r.city))

        setLocations(rows)
        // Trigger skeleton fade-out first, then remove them after animation
        setTimeout(() => {
          setShowSkeletons(false)
          setTimeout(() => {
            setLoading(false)
          }, 300) // Match fade-out animation duration
        }, 100)
      },
      error: (err) => {
        setError(err?.message || 'Failed to fetch CSV')
        setLoading(false)
      }
    })
  }, [csvUrl])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/jonathanwillington/cm8ym2u5b003d01r431z7872k',
      center: [0, 20],
      zoom: 2,
      // Enable smooth panning and zooming with premium feel
      interactive: true,
      dragPan: {
        deceleration: 0.98,
        maxSpeed: 800
      },
      scrollZoom: {
        speed: 0.3,
        smooth: true
      },
      boxZoom: false,
      doubleClickZoom: false,
      dragRotate: false,
      keyboard: false,
      touchZoomRotate: {
        speed: 0.3,
        smooth: true
      }
    })

    // Add premium easing for all map movements
    mapRef.current.on('load', () => {
      mapRef.current.easeTo = function(options) {
        return this.flyTo({
          ...options,
          duration: options.duration || 3000,
          easing: (t) => {
            // Premium easing function - smooth and elegant
            return 1 - Math.pow(1 - t, 3);
          }
        });
      };
    });
  }, [])

  // Rebuild markers for filtered list
  useEffect(() => {
    if (!mapRef.current || filteredLocations.length === 0) {
      // Clear markers if no locations
      if (markersRef.current.length) {
        for (const m of markersRef.current) { try { m.remove() } catch {} }
        markersRef.current = []
      }
      return
    }

    const geocode = async (row) => {
      const city = row.City || row.city
      const country = row.Country || row.country
      const query = [city, country].filter(Boolean).join(', ')
      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}`
      )
      if (!resp.ok) throw new Error('Geocoding failed')
      const data = await resp.json()
      const feature = data.features?.[0]
      if (!feature) return null
      return feature.center // [lng, lat]
    }

    const addMarkers = async () => {
      // clear existing markers
      if (markersRef.current.length) {
        for (const m of markersRef.current) {
          try { m.remove() } catch {}
        }
      }
      markersRef.current = new Array(filteredLocations.length).fill(null)

      for (let i = 0; i < filteredLocations.length; i++) {
        const row = filteredLocations[i]
        try {
          const coords = await geocode(row)
          if (!coords) continue
          const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(`
            <div style="max-width: 260px;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">${row.Name || row.name || ''}</div>
              <div style="font-size: 12px; color: #555;">${[row.City || row.city, row.Country || row.country].filter(Boolean).join(', ')}</div>
              <div style="font-size: 12px; margin-top: 6px;">
                ${row.Status && row.Status.toUpperCase() === 'ASK' ? 
                  `<div><strong>Status:</strong> ${row.Status} - Contact for availability</div>` :
                  (() => {
                    const formatPopupDate = (startDate, duration) => {
                      if (!startDate) return ''
                      if (duration && typeof duration === 'string' && duration.trim()) {
                        return `${startDate} (${duration.trim()})`
                      }
                      return startDate
                    }
                    
                    const dates = []
                    if (row.Start) {
                      const duration = row['Duration '] || row.Duration || row.duration || ''
                      dates.push(formatPopupDate(row.Start, duration))
                    }
                    if (row['Dates free start 2']) {
                      dates.push(formatPopupDate(row['Dates free start 2'], ''))
                    }
                    return dates.length > 0 ? `<div><strong>Available from:</strong> ${dates.join(' • ')}</div>` : '<div><strong>Dates:</strong> No dates specified</div>'
                  })()
                }
                <div><strong>Size:</strong> ${row.Size || row.size || ''}</div>
                ${row.Status && row.Status.toUpperCase() !== 'ASK' ? `<div><strong>Status:</strong> ${row.Status}</div>` : ''}
                ${row['Any notes'] ? `<div style="margin-top: 6px;"><strong>Notes:</strong> ${row['Any notes']}</div>` : ''}
              </div>
              ${row.Photo ? `<div style="margin-top: 8px;"><img alt="Photo" style="width: 100%; height: auto; border-radius: 6px;" src="${row.Photo}" /></div>` : ''}
            </div>
          `)
          const marker = new mapboxgl.Marker()
            .setLngLat(coords)
            .setPopup(popup)
            .addTo(mapRef.current)
          markersRef.current[i] = marker
        } catch (e) {
          // ignore geocode errors for individual rows
        }
      }
    }

    addMarkers()
  }, [filteredLocations])

  // Reset selection when switching segment
  useEffect(() => {
    setSelectedIndex(-1)
    setShowPremiumCard(false)
    setCurrentLocation(null)
    if (mapRef.current) {
      const popups = document.querySelectorAll('.mapboxgl-popup')
      popups.forEach(p => p.remove())
    }
  }, [selectedSegment])

  const handleSelect = (index) => {
    // If clicking the same card, deselect it
    if (selectedIndex === index) {
      setSelectedIndex(-1)
      setShowPremiumCard(false)
      setCurrentLocation(null)
      // Close any open popup
      if (mapRef.current) {
        const popups = document.querySelectorAll('.mapboxgl-popup')
        popups.forEach(popup => popup.remove())
      }
      return
    }

    // Close any existing popup immediately when selecting a new card
    if (mapRef.current) {
      const popups = document.querySelectorAll('.mapboxgl-popup')
      popups.forEach(popup => popup.remove())
    }

    // Hide premium card during transition
    setShowPremiumCard(false)
    setSelectedIndex(index)
    setCurrentLocation(filteredLocations[index])
    
    const marker = markersRef.current[index]
    if (!marker || !mapRef.current) return
    const ll = marker.getLngLat()
    
    // Calculate distance for duration scaling
    const currentCenter = mapRef.current.getCenter()
    const distance = Math.sqrt(
      Math.pow(ll.lng - currentCenter.lng, 2) + 
      Math.pow(ll.lat - currentCenter.lat, 2)
    )
    
    // Scale duration based on distance - longer distances get more time
    const baseDuration = 800
    const distanceMultiplier = Math.min(distance * 2000, 3) // Cap at 3x for very long distances
    const duration = Math.max(baseDuration, Math.min(baseDuration * distanceMultiplier, 2500))
    
    // Use premium easing for the flyTo animation
    mapRef.current.flyTo({ 
      center: [ll.lng, ll.lat], 
      zoom: 9, 
      essential: true,
      duration: duration,
      easing: (t) => {
        // Premium easing function - more controlled for long distances
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      }
    })
    
    // Show premium card after animation completes
    setTimeout(() => {
      setShowPremiumCard(true)
    }, duration)
  }

  // Handle map click to deselect current card
  const handleMapClick = () => {
    if (selectedIndex !== -1) {
      setSelectedIndex(-1)
      setShowPremiumCard(false)
      setCurrentLocation(null)
      // Close any open popup
      if (mapRef.current) {
        const popups = document.querySelectorAll('.mapboxgl-popup')
        popups.forEach(popup => popup.remove())
      }
    }
  }

  // Add map click listener
  useEffect(() => {
    if (!mapRef.current) return
    
    const handleClick = (e) => {
      // Only deselect if clicking on the map itself, not on markers or popups
      if (e.originalEvent.target.closest('.mapboxgl-marker') || 
          e.originalEvent.target.closest('.mapboxgl-popup') ||
          e.originalEvent.target.closest('.sidebar') ||
          e.originalEvent.target.closest('.premium-card')) {
        return
      }
      handleMapClick()
    }

    mapRef.current.on('click', handleClick)
    
    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleClick)
      }
    }
  }, [selectedIndex])

  const getCountryFlag = (country) => {
    if (!country) return ''
    
    // Simple country to flag emoji mapping
    const countryFlags = {
      'USA': '🇺🇸',
      'United States': '🇺🇸',
      'US': '🇺🇸',
      'Spain': '🇪🇸',
      'France': '🇫🇷',
      'Italy': '🇮🇹',
      'Germany': '🇩🇪',
      'UK': '🇬🇧',
      'United Kingdom': '🇬🇧',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'Japan': '🇯🇵',
      'Netherlands': '🇳🇱',
      'Switzerland': '🇨🇭',
      'Sweden': '🇸🇪',
      'Norway': '🇳🇴',
      'Denmark': '🇩🇰',
      'Finland': '🇫🇮',
      'Belgium': '🇧🇪',
      'Austria': '🇦🇹',
      'Portugal': '🇵🇹',
      'Greece': '🇬🇷',
      'Ireland': '🇮🇪',
      'New Zealand': '🇳🇿',
      'Mexico': '🇲🇽',
      'Brazil': '🇧🇷',
      'Argentina': '🇦🇷',
      'Chile': '🇨🇱',
      'Colombia': '🇨🇴',
      'Peru': '🇵🇪',
      'Uruguay': '🇺🇾',
      'South Africa': '🇿🇦',
      'India': '🇮🇳',
      'China': '🇨🇳',
      'South Korea': '🇰🇷',
      'Thailand': '🇹🇭',
      'Vietnam': '🇻🇳',
      'Singapore': '🇸🇬',
      'Malaysia': '🇲🇾',
      'Indonesia': '🇮🇩',
      'Philippines': '🇵🇭',
      'Turkey': '🇹🇷',
      'Israel': '🇮🇱',
      'UAE': '🇦🇪',
      'United Arab Emirates': '🇦🇪',
      'Qatar': '🇶🇦',
      'Saudi Arabia': '🇸🇦',
      'Egypt': '🇪🇬',
      'Morocco': '🇲🇦',
      'Tunisia': '🇹🇳',
      'Algeria': '🇩🇿',
      'Kenya': '🇰🇪',
      'Nigeria': '🇳🇬',
      'Ghana': '🇬🇭',
      'Ethiopia': '🇪🇹',
      'Uganda': '🇺🇬',
      'Tanzania': '🇹🇿',
      'Rwanda': '🇷🇼',
      'Botswana': '🇧🇼',
      'Namibia': '🇳🇦',
      'Zimbabwe': '🇿🇼',
      'Zambia': '🇿🇲',
      'Malawi': '🇲🇼',
      'Mozambique': '🇲🇿',
      'Angola': '🇦🇴',
      'Congo': '🇨🇬',
      'DRC': '🇨🇩',
      'Democratic Republic of Congo': '🇨🇩',
      'Cameroon': '🇨🇲',
      'Gabon': '🇬🇦',
      'Central African Republic': '🇨🇫',
      'Chad': '🇹🇩',
      'Niger': '🇳🇪',
      'Mali': '🇲🇱',
      'Burkina Faso': '🇧🇫',
      'Senegal': '🇸🇳',
      'Guinea': '🇬🇳',
      'Sierra Leone': '🇸🇱',
      'Liberia': '🇱🇷',
      'Ivory Coast': '🇨🇮',
      'Côte d\'Ivoire': '🇨🇮',
      'Gambia': '🇬🇲',
      'Guinea-Bissau': '🇬🇼',
      'Cape Verde': '🇨🇻',
      'Mauritania': '🇲🇷',
      'Western Sahara': '🇪🇭',
      'Poland': '🇵🇱',
      'Czech Republic': '🇨🇿',
      'Slovakia': '🇸🇰',
      'Hungary': '🇭🇺',
      'Romania': '🇷🇴',
      'Bulgaria': '🇧🇬',
      'Croatia': '🇭🇷',
      'Slovenia': '🇸🇮',
      'Serbia': '🇷🇸',
      'Bosnia and Herzegovina': '🇧🇦',
      'Montenegro': '🇲🇪',
      'North Macedonia': '🇲🇰',
      'Albania': '🇦🇱',
      'Kosovo': '🇽🇰',
      'Moldova': '🇲🇩',
      'Ukraine': '🇺🇦',
      'Belarus': '🇧🇾',
      'Lithuania': '🇱🇹',
      'Latvia': '🇱🇻',
      'Estonia': '🇪🇪',
      'Russia': '🇷🇺',
      'Kazakhstan': '🇰🇿',
      'Uzbekistan': '🇺🇿',
      'Kyrgyzstan': '🇰🇬',
      'Tajikistan': '🇹🇯',
      'Turkmenistan': '🇹🇲',
      'Azerbaijan': '🇦🇿',
      'Georgia': '🇬🇪',
      'Armenia': '🇦🇲',
      'Iran': '🇮🇷',
      'Iraq': '🇮🇶',
      'Syria': '🇸🇾',
      'Lebanon': '🇱🇧',
      'Jordan': '🇯🇴',
      'Palestine': '🇵🇸',
      'Kuwait': '🇰🇼',
      'Bahrain': '🇧🇭',
      'Oman': '🇴🇲',
      'Yemen': '🇾🇪',
      'Afghanistan': '🇦🇫',
      'Pakistan': '🇵🇰',
      'Bangladesh': '🇧🇩',
      'Sri Lanka': '🇱🇰',
      'Nepal': '🇳🇵',
      'Bhutan': '🇧🇹',
      'Myanmar': '🇲🇲',
      'Cambodia': '🇰🇭',
      'Laos': '🇱🇦',
      'Mongolia': '🇲🇳',
      'Taiwan': '🇹🇼',
      'Hong Kong': '🇭🇰',
      'Macau': '🇲🇴',
      'North Korea': '🇰🇵'
    }
    
    return countryFlags[country] || '🌍'
  }

  const PremiumCard = ({ location }) => {
    if (!location) return null

    return (
      <div className="premium-card">
        {/* Full-width image at top */}
        <div className="premium-card-image">
          {location.Photo ? (
            <img src={location.Photo} alt="Property" />
          ) : (
            <div className="premium-card-placeholder">No Image</div>
          )}
          <div className="premium-card-image-overlay">
            <h3 className="premium-card-title-overlay">{location.City || ''}</h3>
            <p className="premium-card-country-overlay">{getCountryFlag(location.Country)} {location.Country || ''}</p>
          </div>
          <button className="premium-card-close" onClick={() => handleSelect(selectedIndex)}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Fixed content section */}
        <div className="premium-card-fixed-content">
          {/* Notes as prominent body text - moved above cells */}
          {location['Any notes'] && (
            <div className="premium-card-notes">
              <p>{location['Any notes']}</p>
            </div>
          )}
        </div>

        {/* Scrollable cells section */}
        <div className="premium-card-scrollable">
          <div className="premium-card-cells">
            <div className="premium-card-cell">
              <div className="premium-card-cell-label">Type</div>
              <div className="premium-card-cell-value">
                {getListingType(location) ? (
                  <span className="premium-card-tag">{getListingType(location)}</span>
                ) : (
                  'Not specified'
                )}
              </div>
            </div>
            
            <div className="premium-card-cell">
              <div className="premium-card-cell-label">Neighbourhood</div>
              <div className="premium-card-cell-value">{location.Neighbourhood || 'Not specified'}</div>
            </div>
            
            <div className="premium-card-cell">
              <div className="premium-card-cell-label">Available From</div>
              <div className="premium-card-cell-value">
                {location.Status && location.Status.toUpperCase() === 'ASK' ? 
                  'Contact for availability' :
                  (() => {
                    if (!location.Start) return 'Not specified'
                    const duration = location.Duration || location.duration || ''
                    if (duration && typeof duration === 'string' && duration.trim()) {
                      return `${location.Start} (${duration.trim()})`
                    }
                    return location.Start
                  })()
                }
              </div>
            </div>

            {location['Dates free start 2'] && (
              <div className="premium-card-cell">
                <div className="premium-card-cell-label">Also Available From</div>
                <div className="premium-card-cell-value">{location['Dates free start 2']}</div>
              </div>
            )}

            <div className="premium-card-cell">
              <div className="premium-card-cell-label">Size</div>
              <div className="premium-card-cell-value">{location.Size || 'Not specified'}</div>
            </div>

            <div className="premium-card-cell">
              <div className="premium-card-cell-label">Entire place</div>
              <div className="premium-card-cell-value">
                {location['Entire place'] ? 
                  <span className="premium-card-toggle premium-card-toggle-yes">Yes</span> : 
                  <span className="premium-card-toggle premium-card-toggle-no">No</span>
                }
              </div>
            </div>

            <div className="premium-card-cell">
              <div className="premium-card-cell-label">Pets</div>
              <div className="premium-card-cell-value">
                {location.Pets ? 
                  <span className="premium-card-toggle premium-card-toggle-yes">Yes</span> : 
                  <span className="premium-card-toggle premium-card-toggle-no">No</span>
                }
              </div>
            </div>
            
            <div className="premium-card-cell">
              <div className="premium-card-cell-label">Speak to</div>
              <div className="premium-card-cell-value">{location.Name || 'Not specified'}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <div className="sidebar">
        
        
        <div className="segmented-control">
          <button 
            className={`segment-button ${selectedSegment === 'sublets' ? 'active' : ''}`}
            onClick={() => setSelectedSegment('sublets')}
          >
            Sublets
          </button>
          <button 
            className={`segment-button ${selectedSegment === 'exchange' ? 'active' : ''}`}
            onClick={() => setSelectedSegment('exchange')}
          >
            Exchange
          </button>
        </div>
        

        
        <div className="sidebar-list">
          {(() => {
            // Always group properties by month
              const locationsByMonth = {}
              filteredLocations.forEach((row, originalIndex) => {
                const getPropertyMonth = (row) => {
                  // If property has a start date, use that month
                  if (row.Start) {
                    const parseDate = (dateStr) => {
                      if (!dateStr || dateStr.trim() === '') return null
                      const parts = dateStr.trim().split('/')
                      if (parts.length !== 3) return null
                      const day = parseInt(parts[0])
                      const month = parseInt(parts[1]) - 1
                      let year = parseInt(parts[2])
                      if (year < 100) year += 2000
                      return new Date(year, month, day)
                    }
                    
                    const start = parseDate(row.Start)
                    if (start) {
                      return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
                    }
                  }
                  
                  // If no start date, group under "FLEXIBLE"
                  return 'FLEXIBLE'
                }
                
                const month = getPropertyMonth(row)
                if (!locationsByMonth[month]) {
                  locationsByMonth[month] = []
                }
                locationsByMonth[month].push({ row, originalIndex })
              })
              
              // Sort months
              const months = Object.keys(locationsByMonth).sort((a, b) => {
                if (a === 'FLEXIBLE') return 1
                if (b === 'FLEXIBLE') return -1
                return a.localeCompare(b)
              })
              
              const elements = []
              months.forEach(month => {
                // Add month header
                if (month === 'FLEXIBLE') {
                  elements.push(
                    <div key={`month-${month}`} className="year-separator">
                      <div className="year-separator-text">FLEXIBLE</div>
                    </div>
                  )
                } else {
                  const [year, monthNum] = month.split('-')
                  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
                  const monthName = monthNames[parseInt(monthNum) - 1]
                  
                  elements.push(
                    <div key={`month-${month}`} className="year-separator">
                      <div className="year-separator-text">{monthName} {year}</div>
                    </div>
                  )
                }
                
                                // Add properties for this month
                locationsByMonth[month].forEach(({ row, originalIndex }) => {
                  elements.push(
                    <button key={originalIndex} className={`small-card ${originalIndex === selectedIndex ? 'active' : ''} ${!loading ? 'fade-in' : ''}`} onClick={() => handleSelect(originalIndex)}>
                      <div className="small-card-content">
                        {row.Photo && (
                          <div className="small-card-photo">
                            <img src={row.Photo} alt="Property" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div className="small-card-details">
                          <div className="small-card-location" style={{ fontSize: '18px', fontWeight: '500', marginBottom: '2px', letterSpacing: '-0.3px', fontFamily: 'Bagoss Standard, sans-serif' }}>
                            {row.City || ''} {getCountryFlag(row.Country)}
                          </div>
                          <div className="small-card-dates" style={{ fontSize: '14px', fontWeight: '600', color: '#888', letterSpacing: '-0.3px' }}>
                            {(() => {
                              if (row.Status && row.Status.toUpperCase() === 'ASK') {
                                return 'Contact for availability'
                              }
                              
                              // Build the display string: duration • size (no date since we have month dividers)
                              const parts = []
                              
                              // Add duration part
                              const duration = row['Duration '] || row.Duration || row.duration || ''
                              if (duration && duration.trim()) {
                                parts.push(duration.trim())
                              }
                              
                              // Add size part
                              const size = row.Size
                              if (size && size.trim()) {
                                parts.push(size.trim())
                              }
                              
                              return parts.length > 0 ? parts.join(' • ') : 'Available'
                            })()}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              })
              
              return elements

          })()}
          {loading && (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={`skeleton-${i}`} className={`skeleton-card ${!showSkeletons ? 'fade-out' : ''}`}>
                <div className="skeleton-card-content">
                  <div className="skeleton-photo"></div>
                  <div className="skeleton-details">
                    <div className="skeleton-location"></div>
                    <div className="skeleton-dates"></div>
                    <div className="skeleton-name"></div>
                  </div>
                </div>
              </div>
            ))
          )}
          {filteredLocations.length === 0 && !loading && <div className="empty">No properties</div>}
        </div>
      </div>

      <div className="map-area">
        {loading && <div style={{ position: 'absolute', zIndex: 2, left: 16, top: 12, padding: '8px', background: 'rgba(255,255,255,0.95)', borderRadius: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>Loading…</div>}
        {error && <div style={{ position: 'absolute', zIndex: 2, left: 16, top: 12, padding: '8px', background: '#fee', color: '#900', borderRadius: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>{error}</div>}

        <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />
        
        {showPremiumCard && <PremiumCard location={currentLocation} />}
        
        <div className="feedback-bar">
          Got any feature suggestions or feedback? Send them <a href="https://google.com" target="_blank" rel="noopener noreferrer">here!</a>
        </div>
      </div>
    </div>
  )
}

export default App