import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'

/**
 * Custom hook for managing locations data from CSV
 * @returns {Object} Locations state and loading/error states
 */
export const useLocations = () => {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSkeletons, setShowSkeletons] = useState(true)

  const csvUrl = useMemo(() => 
    import.meta.env.VITE_SHEET_CSV || 'https://docs.google.com/spreadsheets/d/14YSy-w-db4rqXa1nHyaPZCVp7Qcd3UcOBJOqfZXENdo/export?format=csv&gid=0', 
    []
  )

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
        console.log('useLocations: CSV parsing complete, raw results:', results)
        console.log('useLocations: First few rows:', results.data?.slice(0, 3))
        const rows = (results.data || []).filter(r => r && (r.City || r.city))
        console.log('useLocations: Filtered rows:', rows)
        console.log('useLocations: Sample row structure:', rows[0])
        console.log('useLocations: All rows with City/Country:', rows.map(r => ({ City: r.City, Country: r.Country })))
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

  return {
    locations,
    loading,
    error,
    showSkeletons
  }
}
