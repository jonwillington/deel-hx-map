/**
 * Google Sheets API utilities for fetching embedded images
 */

const SHEET_ID = '14YSy-w-db4rqXa1nHyaPZCVp7Qcd3UcOBJOqfZXENdo'

/**
 * Get embedded images from Google Sheets
 * Note: This requires the Google Sheets API to be enabled and proper authentication
 * For now, we'll use a fallback approach
 */
export const getEmbeddedImages = async (gid = '0') => {
  try {
    // For now, we'll use a simple approach with the sheets API
    // This would need to be implemented with proper Google Sheets API authentication
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?ranges=Sheet1&includeGridData=true&key=YOUR_API_KEY`
    
    // For development, we'll return a mapping of known images
    // In production, this would fetch from the actual Google Sheets API
    return {
      // Row 2 (Jon Willington's Barcelona listing)
      '2': 'https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Barcelona+Property'
    }
  } catch (error) {
    console.error('Error fetching embedded images:', error)
    return {}
  }
}

/**
 * Get image URL for a specific row
 * @param {number} rowNumber - The row number (1-based)
 * @param {Object} location - The location data object
 * @returns {string|null} Image URL or null
 */
export const getImageForRow = async (rowNumber, location) => {
  // First check if we have a direct Photo URL
  if (location.Photo && location.Photo.startsWith('http')) {
    return location.Photo
  }
  
  // Check if we have embedded image data
  if (location.Photo && location.Photo.startsWith('data:image/')) {
    return location.Photo
  }
  
  // For now, return a placeholder for row 2
  if (rowNumber === 2) {
    return 'https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Barcelona+Property'
  }
  
  return null
}
