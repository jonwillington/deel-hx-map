import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import Papa from 'papaparse'
import './App.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

function App() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      style: 'mapbox://styles/mapbox/streets-v12',
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
      for (const row of locations) {
        try {
          const coords = await geocode(row)
          if (!coords) continue
          const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(`
            <div style="max-width: 240px;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">${row.Name || ''}</div>
              <div style="font-size: 12px; color: #555;">${[row.City, row.Country].filter(Boolean).join(', ')}</div>
              <div style="font-size: 12px; margin-top: 6px;">
                <div><strong>Dates free:</strong> ${row['Dates free start'] || ''} → ${row['Dates free end'] || ''}</div>
                <div><strong>Size:</strong> ${row.Size || ''}</div>
                ${row['Any notes'] ? `<div style="margin-top: 6px;"><strong>Notes:</strong> ${row['Any notes']}</div>` : ''}
              </div>
              ${row.Photo ? `<div style="margin-top: 8px;"><img alt="Photo" style="width: 100%; height: auto; border-radius: 6px;" src="${row.Photo}" /></div>` : ''}
            </div>
          `)
          new mapboxgl.Marker()
            .setLngLat(coords)
            .setPopup(popup)
            .addTo(mapRef.current)
        } catch (e) {
          // ignore geocode errors for individual rows
        }
      }
    }

    addMarkers()
  }, [locations])

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      {loading && <div style={{ position: 'absolute', zIndex: 1, padding: '8px', background: 'rgba(255,255,255,0.9)', margin: 12, borderRadius: 6 }}>Loading…</div>}
      {error && <div style={{ position: 'absolute', zIndex: 1, padding: '8px', background: '#fee', color: '#900', margin: 12, borderRadius: 6 }}>{error}</div>}
      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  )
}

export default App