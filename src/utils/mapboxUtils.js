/**
 * Geocode a location using Mapbox API
 * @param {Object} row - Property data row with City and Country
 * @returns {Promise<Array>} Coordinates [lng, lat] or null
 */
export const geocode = async (row) => {
  const city = row.City || row.city || ''
  const country = row.Country || row.country || ''
  // Use city only if country is not available
  const query = country ? [city, country].filter(Boolean).join(', ') : city
  
  console.log('geocode: Row data:', row)
  console.log('geocode: City:', city, 'Country:', country)
  console.log('geocode: Query:', query)
  
  if (!query) {
    console.log('geocode: No query, returning null')
    return null
  }
  
  const accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoiam9uYXRoYW53aWxsaW5ndG9uIiwiYSI6ImNsZ2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5In0.example'
  
  try {
    console.log('geocode: Making API request with token:', accessToken.substring(0, 20) + '...')
    const resp = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}&limit=1`
    )
    const data = await resp.json()
    console.log('geocode: API response:', data)
    
    if (data.features && data.features.length > 0) {
      const coords = data.features[0].center
      console.log('geocode: Found coordinates:', coords)
      
      // Validate coordinates
      if (Array.isArray(coords) && coords.length === 2) {
        const [lng, lat] = coords
        if (isFinite(lng) && isFinite(lat) && 
            lng >= -180 && lng <= 180 && 
            lat >= -85 && lat <= 85) {
          return coords
        } else {
          console.warn('geocode: Invalid coordinates returned:', coords)
        }
      } else {
        console.warn('geocode: Invalid coordinate format:', coords)
      }
    } else {
      console.log('geocode: No features found in response')
    }
  } catch (error) {
    console.error('geocode: Geocoding error:', error)
  }
  
  return null
}

/**
 * Calculate distance between two points
 * @param {Array} point1 - [lng, lat]
 * @param {Array} point2 - [lng, lat]
 * @returns {number} Distance in degrees
 */
export const calculateDistance = (point1, point2) => {
  const [lng1, lat1] = point1
  const [lng2, lat2] = point2
  
  return Math.sqrt(
    Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2)
  )
}

/**
 * Calculate animation duration based on distance
 * @param {Array} from - Starting coordinates [lng, lat]
 * @param {Array} to - Target coordinates [lng, lat]
 * @param {number} baseDuration - Base duration in ms
 * @returns {number} Calculated duration in ms
 */
export const calculateAnimationDuration = (from, to, baseDuration = 1000) => {
  const distance = calculateDistance(from, to)
  
  // If distance is very small (less than 0.001 degrees), use minimum duration
  if (distance < 0.001) {
    return Math.min(baseDuration, 500) // Very short animation for tiny movements
  }
  
  // For normal distances, calculate with reasonable multiplier
  const distanceMultiplier = Math.min(distance * 800, 2.5) // Reduced multiplier and cap
  const calculatedDuration = baseDuration * distanceMultiplier
  
  // Ensure duration is within reasonable bounds (200ms to 2500ms)
  return Math.max(200, Math.min(calculatedDuration, 2500))
}
