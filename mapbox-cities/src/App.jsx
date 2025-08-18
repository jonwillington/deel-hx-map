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

  const csvUrl = useMemo(() => import.meta.env.VITE_SHEET_CSV, [])

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
        const rows = (results.data || []).filter(r => r && r.City)
        setLocations(rows)
        setLoading(false)
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
      zoom: 2
    })
  }, [])

  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return

    const geocode = async (row) => {
      const query = [row.City, row.Country].filter(Boolean).join(', ')
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
      markersRef.current = new Array(locations.length).fill(null)

      for (let i = 0; i < locations.length; i++) {
        const row = locations[i]
        try {
          const coords = await geocode(row)
          if (!coords) continue
          const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(`
            <div style="max-width: 260px;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">${row.Name || ''}</div>
              <div style="font-size: 12px; color: #555;">${[row.City, row.Country].filter(Boolean).join(', ')}</div>
              <div style="font-size: 12px; margin-top: 6px;">
                <div><strong>Dates free:</strong> ${row['Dates free start'] || ''} → ${row['Dates free end'] || ''}</div>
                <div><strong>Size:</strong> ${row.Size || ''}</div>
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
  }, [locations])

  const handleSelect = (index) => {
    setSelectedIndex(index)
    const marker = markersRef.current[index]
    if (!marker || !mapRef.current) return
    const ll = marker.getLngLat()
    mapRef.current.flyTo({ center: [ll.lng, ll.lat], zoom: 9, essential: true })
    try {
      const popup = marker.getPopup()
      if (popup) popup.addTo(mapRef.current)
    } catch {}
  }

  const selected = selectedIndex >= 0 ? locations[selectedIndex] : null

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <div className="sidebar">
        <div className="sidebar-header">Available properties</div>
        <div className="sidebar-list">
          {locations.map((row, i) => (
            <button key={i} className={`small-card ${i === selectedIndex ? 'active' : ''}`} onClick={() => handleSelect(i)}>
              <div className="small-card-title">{row.Name || 'Unnamed'}</div>
              <div className="small-card-sub">{[row.City, row.Country].filter(Boolean).join(', ')}</div>
              <div className="small-card-meta">{row['Dates free start'] || ''}{row['Dates free start'] ? ' → ' : ''}{row['Dates free end'] || ''}</div>
            </button>
          ))}
          {locations.length === 0 && !loading && <div className="empty">No properties</div>}
        </div>
      </div>

      {selected && (
        <div className="detail-card">
          <div className="detail-title">{selected.Name || 'Unnamed'}</div>
          <div className="detail-sub">{[selected.City, selected.Country].filter(Boolean).join(', ')}</div>
          <div className="detail-meta"><strong>Dates free:</strong> {selected['Dates free start'] || ''}{selected['Dates free start'] ? ' → ' : ''}{selected['Dates free end'] || ''}</div>
          <div className="detail-meta"><strong>Size:</strong> {selected.Size || ''}</div>
          {selected['Any notes'] && <div className="detail-notes"><strong>Notes:</strong> {selected['Any notes']}</div>}
          {selected.Photo && (
            <div className="detail-photo">
              <img alt="Photo" src={selected.Photo} />
            </div>
          )}
        </div>
      )}

      {loading && <div style={{ position: 'absolute', zIndex: 2, left: 336, top: 12, padding: '8px', background: 'rgba(255,255,255,0.95)', borderRadius: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>Loading…</div>}
      {error && <div style={{ position: 'absolute', zIndex: 2, left: 336, top: 12, padding: '8px', background: '#fee', color: '#900', borderRadius: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>{error}</div>}

      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  )
}

export default App