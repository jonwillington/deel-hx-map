import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import Papa from 'papaparse'
import './App.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

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
  const [specificDates, setSpecificDates] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showSkeletons, setShowSkeletons] = useState(true)

  const csvUrl = useMemo(() => import.meta.env.VITE_SHEET_CSV, [])

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

  // Filter locations based on selected segment and dates
  const filteredLocations = useMemo(() => {
    if (!locations || locations.length === 0) return []
    return locations.filter((row) => {
      // Filter by segment
      const t = getListingType(row)
      let segmentMatch = true
      if (selectedSegment === 'sublets') segmentMatch = t === 'sublets'
      else if (selectedSegment === 'exchange') segmentMatch = t === 'exchange'
      
      if (!segmentMatch) return false
      
      // Filter by dates if specific dates is enabled
      if (specificDates) {
        // Check both sets of date ranges
        const startDate1 = row['Start']
        const endDate1 = row['End']
        const startDate2 = row['Dates free start 2']
        const endDate2 = row['Dates free end 2']
        
        // Parse the dates (assuming M/D/YY or MM/DD/YY format)
        const parseDate = (dateStr) => {
          if (!dateStr || dateStr.trim() === '') return null
          const parts = dateStr.trim().split('/')
          if (parts.length !== 3) return null
          const month = parseInt(parts[0]) - 1 // JS months are 0-indexed
          const day = parseInt(parts[1])
          let year = parseInt(parts[2])
          // Handle 2-digit years
          if (year < 100) year += 2000
          return new Date(year, month, day)
        }
        
        // Target year/month to check against
        const targetYear = selectedYear
        const targetMonth = selectedMonth // 0-indexed
        
        // Check if any date range has overlap with the target month/year
        let hasOverlap = false
        
        // Check first date range
        if (startDate1 && endDate1) {
          const start1 = parseDate(startDate1)
          const end1 = parseDate(endDate1)
          if (start1 && end1) {
            // Check if this range includes the target month/year
            if ((start1.getFullYear() < targetYear || 
                (start1.getFullYear() === targetYear && start1.getMonth() <= targetMonth)) &&
                (end1.getFullYear() > targetYear || 
                (end1.getFullYear() === targetYear && end1.getMonth() >= targetMonth))) {
              hasOverlap = true
            }
          }
        }
        
        // Check second date range if first didn't match
        if (!hasOverlap && startDate2 && endDate2) {
          const start2 = parseDate(startDate2)
          const end2 = parseDate(endDate2)
          if (start2 && end2) {
            // Check if this range includes the target month/year
            if ((start2.getFullYear() < targetYear || 
                (start2.getFullYear() === targetYear && start2.getMonth() <= targetMonth)) &&
                (end2.getFullYear() > targetYear || 
                (end2.getFullYear() === targetYear && end2.getMonth() >= targetMonth))) {
              hasOverlap = true
            }
          }
        }
        
        return hasOverlap
      }
      
      return true
    })
  }, [locations, selectedSegment, specificDates, selectedMonth, selectedYear])

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
                    const dates = []
                    if (row.Start && row.End) {
                      dates.push(`${row.Start} → ${row.End}`)
                    }
                    if (row['Dates free start 2'] && row['Dates free end 2']) {
                      dates.push(`${row['Dates free start 2']} → ${row['Dates free end 2']}`)
                    }
                    return dates.length > 0 ? `<div><strong>Dates free:</strong> ${dates.join(' • ')}</div>` : '<div><strong>Dates:</strong> No dates specified</div>'
                  })()
                }
                <div><strong>Size:</strong> ${row.Size || row.size || ''}</div>
                ${row.Status && row.Status.toUpperCase() !== 'ASK' ? `<div><strong>Status:</strong> ${row.Status}</div>` : ''}
                ${row['Any notes'] ? `<div style=\"margin-top: 6px;\"><strong>Notes:</strong> ${row['Any notes']}</div>` : ''}
              </div>
              ${row.Photo ? `<div style=\"margin-top: 8px;\"><img alt=\"Photo\" style=\"width: 100%; height: auto; border-radius: 6px;\" src=\"${row.Photo}\" /></div>` : ''}
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

  const getStatusColor = (status) => {
    if (!status) return '#ccc'
    const statusUpper = status.toUpperCase()
    if (statusUpper === 'ASK') return '#000000' // Black for ASK
    if (statusUpper.includes('AVAILABLE') || statusUpper.includes('OPEN')) return '#4CAF50'
    if (statusUpper.includes('PENDING') || statusUpper.includes('RESERVED')) return '#FF9800'
    if (statusUpper.includes('BOOKED') || statusUpper.includes('CLOSED')) return '#F44336'
    return '#2196F3'
  }

  const getStatusText = (status) => {
    if (!status) return ''
    const statusUpper = status.toUpperCase()
    if (statusUpper === 'ASK') return 'ASK'
    return status
  }

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
              <div className="premium-card-cell-label">Start Date</div>
              <div className="premium-card-cell-value">
                {location.Status && location.Status.toUpperCase() === 'ASK' ? 
                  'Contact for availability' :
                  location.Start || 'Not specified'
                }
              </div>
            </div>

            <div className="premium-card-cell">
              <div className="premium-card-cell-label">End Date</div>
              <div className="premium-card-cell-value">
                {location.Status && location.Status.toUpperCase() === 'ASK' ? 
                  'Contact for availability' :
                  location.End || 'Not specified'
                }
              </div>
            </div>

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
        
        <div className="switch-cell">
          <div className="switch-row">
            <div className="switch-label">Specific dates</div>
            <button 
              className={`ios-switch ${specificDates ? 'active' : ''}`}
              onClick={() => setSpecificDates(!specificDates)}
            >
              <div className="switch-thumb"></div>
            </button>
          </div>
          
          {specificDates && (
            <>
              <div className="hairline-divider"></div>
              <div className="date-selectors">
                <div className="month-selector">
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="ios-select"
                  >
                    <option value={0}>January</option>
                    <option value={1}>February</option>
                    <option value={2}>March</option>
                    <option value={3}>April</option>
                    <option value={4}>May</option>
                    <option value={5}>June</option>
                    <option value={6}>July</option>
                    <option value={7}>August</option>
                    <option value={8}>September</option>
                    <option value={9}>October</option>
                    <option value={10}>November</option>
                    <option value={11}>December</option>
                  </select>
                </div>
                <div className="year-selector">
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="ios-select"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="sidebar-list">
          {filteredLocations.map((row, i) => (
            <button key={i} className={`small-card ${i === selectedIndex ? 'active' : ''} ${!loading ? 'fade-in' : ''}`} onClick={() => handleSelect(i)}>
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
                  <div className="small-card-dates" style={{ fontSize: '14px', fontWeight: '600', color: '#888', marginBottom: '16px', letterSpacing: '-0.3px' }}>
                    {(() => {
                      if (row.Status && row.Status.toUpperCase() === 'ASK') {
                        return 'Contact for availability'
                      }
                      
                      // Parse dates to get month/year info
                      const formatDateRange = (startDate, endDate) => {
                        if (!startDate || !endDate) return ''
                        const parseDate = (dateStr) => {
                          const parts = dateStr.split('/')
                          if (parts.length !== 3) return null
                          const month = parseInt(parts[0]) - 1
                          let year = parseInt(parts[2])
                          if (year < 100) year += 2000
                          return new Date(year, month, 1)
                        }
                        
                        const start = parseDate(startDate)
                        const end = parseDate(endDate)
                        if (!start || !end) return `${startDate} → ${endDate}`
                        
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                        if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
                          return `${monthNames[start.getMonth()]} ${start.getFullYear()}`
                        } else {
                          return `${monthNames[start.getMonth()]} ${start.getFullYear()} - ${monthNames[end.getMonth()]} ${end.getFullYear()}`
                        }
                      }
                      
                      const dates = []
                      if (row.Start && row.End) {
                        dates.push(formatDateRange(row.Start, row.End))
                      }
                      if (row['Dates free start 2'] && row['Dates free end 2']) {
                        dates.push(formatDateRange(row['Dates free start 2'], row['Dates free end 2']))
                      }
                      
                      let dateText = ''
                      if (dates.length === 0) dateText = 'Flexible'
                      else if (dates.length > 1) dateText = 'Multiple'
                      else dateText = dates[0]
                      
                      // Add Size from column K if available
                      const size = row.Size
                      if (size && size.trim()) {
                        return `${dateText} • ${size}`
                      }
                      return dateText
                    })()}
                  </div>
                  <div className="small-card-name" style={{ fontSize: '12px', color: '#666', fontWeight: '500', letterSpacing: '-0.3px' }}>
                    {row.Name || 'Unnamed'}
                  </div>
                </div>
              </div>
            </button>
          ))}
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

      {loading && <div style={{ position: 'absolute', zIndex: 2, left: 336, top: 12, padding: '8px', background: 'rgba(255,255,255,0.95)', borderRadius: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>Loading…</div>}
      {error && <div style={{ position: 'absolute', zIndex: 2, left: 336, top: 12, padding: '8px', background: '#fee', color: '#900', borderRadius: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>{error}</div>}

      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />
      
      {showPremiumCard && <PremiumCard location={currentLocation} />}
    </div>
  )
}

export default App