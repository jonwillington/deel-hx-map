/**
 * Geocode a location using Mapbox API
 * @param {Object} row - Property data row with City, Country, and Neighbourhood
 * @returns {Promise<Array>} Coordinates [lng, lat] or null
 */
export const geocode = async (row) => {
  const neighbourhood = row.Neighbourhood || row.neighbourhood || ''
  const city = row.City || row.city || ''
  const country = row.Country || row.country || ''
  
  // Try neighbourhood-specific geocoding first
  if (neighbourhood && city && country) {
    // Prioritize city in neighbourhood geocoding to avoid wrong locations
    const queries = [
      `${neighbourhood} ${city}, ${country}`,  // Most specific - neighbourhood + city + country
      `${neighbourhood}, ${city}, ${country}`, // Standard format
      `${city}, ${country}`,                   // Fallback to city level if neighbourhood fails
      `${neighbourhood} ${city}`               // Less specific but still includes city
    ]
    
    // Special handling for known neighborhoods that might be geocoded incorrectly
    if (neighbourhood.toLowerCase() === 'el born' && city.toLowerCase() === 'barcelona') {
      console.log('geocode: Detected El Born, Barcelona - applying special geocoding logic')
      // El Born is a specific neighborhood in Barcelona's Gothic Quarter
      // Try more specific queries that might give better results
      const elBornQueries = [
        'El Born Barcelona Spain',
        'El Born, Barcelona, Spain',
        'Born Barcelona Spain',
        'Born, Barcelona, Spain',
        'Carrer del Born, Barcelona, Spain',
        'Passeig del Born, Barcelona, Spain'
      ]
      queries.unshift(...elBornQueries)
      console.log('geocode: El Born queries to try:', queries)
    }
    
    for (const query of queries) {
      console.log('geocode: Trying neighbourhood query format:', query)
      const neighbourhoodCoords = await geocodeQuery(query)
      if (neighbourhoodCoords) {
        console.log('geocode: Successfully geocoded neighbourhood:', neighbourhood, 'to coords:', neighbourhoodCoords, 'with query:', query)
        
        // Validate that the coordinates are in the correct city area
        if (city && country) {
          const cityCoords = await geocodeQuery(`${city}, ${country}`)
          if (cityCoords) {
            const distance = calculateDistance(neighbourhoodCoords, cityCoords)
            console.log('geocode: Distance from city center:', distance, 'for', city)
            
            // If the neighbourhood is more than 0.1 degrees from city center, it might be wrong
            if (distance > 0.1) {
              console.log('geocode: Neighbourhood too far from city center, trying city-level geocoding instead')
              continue // Try the next query or fall back to city-level
            }
          }
        }
        
        return neighbourhoodCoords
      } else {
        console.log('geocode: Query failed for:', query)
      }
    }
    console.log('geocode: All neighbourhood geocoding attempts failed for:', neighbourhood)
    
    // Special fallback for El Born if all geocoding attempts fail
    if (neighbourhood.toLowerCase() === 'el born' && city.toLowerCase() === 'barcelona') {
      console.log('geocode: All queries failed, using known coordinates for El Born, Barcelona: [2.1814, 41.3851]')
      // El Born is located at approximately these coordinates in Barcelona's Gothic Quarter
      return [2.1814, 41.3851]
    }
  }
  
  // Fallback to city-level geocoding
  let query = ''
  if (city && country) {
    query = `${city}, ${country}`
  } else if (city) {
    query = city
  }
  
  console.log('geocode: Row data:', row)
  console.log('geocode: Neighbourhood:', neighbourhood, 'City:', city, 'Country:', country)
  console.log('geocode: Query:', query)
  console.log('geocode: Query length:', query.length)
  
  if (!query) {
    console.log('geocode: No query, returning null')
    return null
  }
  
  return await geocodeQuery(query)
}

/**
 * Internal function to geocode a specific query string
 * @param {string} query - The query string to geocode
 * @returns {Promise<Array>} Coordinates [lng, lat] or null
 */
async function geocodeQuery(query) {
  const accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoiam9uYXRoYW53aWxsaW5ndG9uIiwiYSI6ImNsZ2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5In0.example'
  
  try {
    console.log('geocodeQuery: Making API request for:', query)
    const resp = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}&limit=1`
    )
    const data = await resp.json()
    console.log('geocodeQuery: API response:', data)
    
    if (data.features && data.features.length > 0) {
      const coords = data.features[0].center
      const placeName = data.features[0].place_name
      console.log('geocodeQuery: Found coordinates:', coords)
      console.log('geocodeQuery: Place name:', placeName)
      
      // Validate coordinates
      if (Array.isArray(coords) && coords.length === 2) {
        const [lng, lat] = coords
        if (isFinite(lng) && isFinite(lat) && 
            lng >= -180 && lng <= 180 && 
            lat >= -85 && lat <= 85) {
          return coords
        } else {
          console.warn('geocodeQuery: Invalid coordinates returned:', coords)
        }
      } else {
        console.warn('geocodeQuery: Invalid coordinate format:', coords)
      }
    } else {
      console.log('geocodeQuery: No features found in response')
    }
  } catch (error) {
    console.error('geocodeQuery: Geocoding error:', error)
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
