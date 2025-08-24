/**
 * Google Sheets API utilities for fetching embedded images
 */

const SHEET_ID = '14YSy-w-db4rqXa1nHyaPZCVp7Qcd3UcOBJOqfZXENdo'
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY

/**
 * Get embedded images from Google Sheets using the API
 * @param {string} gid - Sheet GID (0 for first sheet, 432320278 for exchanges)
 * @returns {Promise<Object>} Mapping of row numbers to image URLs
 */
export const getEmbeddedImages = async (gid = '0') => {
  try {
    // If no API key is configured, return development fallback
    if (!API_KEY) {
      console.warn('Google Sheets API key not configured. Using development fallback.')
      return {
        // Row 2 (Jon Willington's Barcelona listing) - 1-based indexing
        '2': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&h=300&fit=crop&crop=center'
      }
    }
    
    const sheetName = gid === '432320278' ? 'Sheet2' : 'Sheet1'
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?ranges=${sheetName}&includeGridData=true&key=${API_KEY}`
    
    console.log('Fetching embedded images from Google Sheets API...')
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('Google Sheets API response:', data)
    
    // Extract embedded images from the response
    const images = {}
    if (data.sheets && data.sheets[0] && data.sheets[0].data && data.sheets[0].data[0]) {
      const sheetData = data.sheets[0].data[0]
      
      // Look for embedded images in the grid data
      if (sheetData.rowData) {
        sheetData.rowData.forEach((row, rowIndex) => {
          if (row.values) {
            row.values.forEach((cell, colIndex) => {
              // Check if this cell contains an embedded image
              if (cell.effectiveFormat && cell.effectiveFormat.backgroundColor) {
                // This is a simplified check - in practice, you'd need to look for
                // specific image-related properties in the cell data
                console.log(`Found potential image in row ${rowIndex + 1}, column ${colIndex + 1}`)
              }
            })
          }
        })
      }
    }
    
    // For now, return the development fallback
    // TODO: Implement proper image extraction from API response
    return {
      '2': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&h=300&fit=crop&crop=center'
    }
    
  } catch (error) {
    console.error('Error fetching embedded images:', error)
    // Return development fallback on error
    return {
      '2': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&h=300&fit=crop&crop=center'
    }
  }
}

/**
 * Get image URL for a specific row
 * @param {number} rowNumber - The row number (1-based)
 * @param {Object} location - The location data object
 * @param {string} gid - Sheet GID
 * @returns {Promise<string|null>} Image URL or null
 */
export const getImageForRow = async (rowNumber, location, gid = '0') => {
  // First check if we have a direct Photo URL
  if (location.Photo && location.Photo.startsWith('http')) {
    return location.Photo
  }
  
  // Check if we have embedded image data
  if (location.Photo && location.Photo.startsWith('data:image/')) {
    return location.Photo
  }
  
  // Try to get embedded image from Google Sheets API
  try {
    const embeddedImages = await getEmbeddedImages(gid)
    return embeddedImages[rowNumber.toString()] || null
  } catch (error) {
    console.error('Error getting embedded image:', error)
    return null
  }
}

/**
 * Instructions for setting up Google Sheets API
 */
export const getApiSetupInstructions = () => {
  return {
    title: "Setting up Google Sheets API for Embedded Images",
    steps: [
      "1. Go to Google Cloud Console (https://console.cloud.google.com/)",
      "2. Create a new project or select existing one",
      "3. Enable Google Sheets API",
      "4. Create API credentials (API Key or Service Account)",
      "5. Add the API key to your environment variables",
      "6. Update the sheetsApi.js file with your API key"
    ],
    note: "This will allow the app to fetch embedded images directly from Google Sheets cells."
  }
}
