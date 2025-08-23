/**
 * Geocode a location using Mapbox API
 * @param {Object} row - Property data row with City and Country
 * @returns {Promise<Array>} Coordinates [lng, lat] or null
 */
export const geocode = async (row) => {
  const city = row.City || row.city || ''
  const country = row.Country || row.country || ''
  const query = [city, country].filter(Boolean).join(', ')
  
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
      console.log('geocode: Found coordinates:', data.features[0].center)
      return data.features[0].center
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
  const distanceMultiplier = Math.min(distance * 2000, 3) // Cap at 3x for very long distances
  return Math.max(baseDuration, Math.min(baseDuration * distanceMultiplier, 2500))
}
