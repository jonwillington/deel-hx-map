import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'

/**
 * Custom hook for managing locations data from CSV
 * @param {string} segment - The current segment ('sublets' or 'exchanges')
 * @returns {Object} Locations state and loading/error states
 */
export const useLocations = (segment = 'sublets') => {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSkeletons, setShowSkeletons] = useState(true)

  const csvUrl = useMemo(() => {
    const baseSheetId = '14YSy-w-db4rqXa1nHyaPZCVp7Qcd3UcOBJOqfZXENdo'
    
    // Generate sheet-specific URLs with correct GIDs
    if (segment === 'exchanges') {
      // Exchanges sheet GID: 432320278
      const exchangesUrl = `https://docs.google.com/spreadsheets/d/${baseSheetId}/export?format=csv&gid=432320278`
      console.log('useLocations: Generated Exchanges URL:', exchangesUrl)
      return exchangesUrl
    } else {
      // Sublets sheet GID: 0 (first sheet)
      const subletsUrl = import.meta.env.VITE_SHEET_CSV || `https://docs.google.com/spreadsheets/d/${baseSheetId}/export?format=csv&gid=0`
      console.log('useLocations: Generated Sublets URL:', subletsUrl)
      return subletsUrl
    }
  }, [segment])

  useEffect(() => {
    // Reset states when segment changes
    setLoading(true)
    setShowSkeletons(true)
    setError('')
    setLocations([])
    
    console.log(`useLocations: Fetching data for segment: ${segment}`)
    console.log(`useLocations: Using URL: ${csvUrl}`)
    console.log(`useLocations: Expected GID for ${segment}:`, segment === 'exchanges' ? '432320278' : '0')
    
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
        console.log(`useLocations: CSV parsing complete for ${segment}, raw results:`, results)
        console.log('useLocations: First few rows:', results.data?.slice(0, 3))
        const rows = (results.data || []).filter(r => r && (r.City || r.city))
        console.log('useLocations: Filtered rows:', rows)
        console.log('useLocations: Sample row structure:', rows[0])
        console.log('useLocations: All rows with City/Country:', rows.map(r => ({ City: r.City, Country: r.Country })))
        
        if (rows.length === 0) {
          console.error('useLocations: No valid rows found! Raw data:', results.data?.slice(0, 5))
          console.error('useLocations: Available columns:', results.data?.[0] ? Object.keys(results.data[0]) : 'No data')
        }
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
        console.error(`useLocations: Error fetching ${segment} data:`, err)
        setError(err?.message || 'Failed to fetch CSV')
        setLoading(false)
      }
    })
  }, [csvUrl, segment])

  return {
    locations,
    loading,
    error,
    showSkeletons
  }
}
