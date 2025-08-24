/**
 * Utility functions for handling embedded images in Google Sheets
 */

/**
 * Get image URL from location data
 * @param {Object} location - Location data object
 * @returns {string|null} Image URL or null if no image
 */
export const getImageUrl = (location) => {
  // Check if there's a direct Photo URL (existing functionality)
  if (location.Photo && location.Photo.startsWith('http')) {
    return location.Photo
  }
  
  // Check for embedded image data in Photo field
  if (location.Photo) {
    // Google Sheets embedded images often start with =IMAGE( or contain base64 data
    if (location.Photo.startsWith('=IMAGE(')) {
      // Extract URL from =IMAGE("URL") format
      const match = location.Photo.match(/=IMAGE\("([^"]+)"\)/)
      if (match) {
        return match[1]
      }
    }
    
    // Check if it's a Google Sheets image URL
    if (location.Photo.includes('docs.google.com') || location.Photo.includes('drive.google.com')) {
      return location.Photo
    }
    
    // Check if it's base64 data (with or without data:image/ prefix)
    if (location.Photo.startsWith('data:image/')) {
      return location.Photo
    }
    
    // Check if it's raw base64 data (common in Google Sheets exports)
    if (location.Photo.startsWith('/9j/') || location.Photo.startsWith('iVBORw0KGgo') || location.Photo.startsWith('R0lGODlh')) {
      // Determine image type from base64 header
      let mimeType = 'image/jpeg' // default
      if (location.Photo.startsWith('iVBORw0KGgo')) {
        mimeType = 'image/png'
      } else if (location.Photo.startsWith('R0lGODlh')) {
        mimeType = 'image/gif'
      }
      return `data:${mimeType};base64,${location.Photo}`
    }
  }
  
  // TEMPORARY: Add placeholder for Barcelona listing (Jon Willington)
  if (location?.Name === 'Jon Willington' && location?.City === 'Barcelona') {
    return 'https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Barcelona+Property'
  }
  
  return null
}

/**
 * Check if an image URL is valid
 * @param {string} url - Image URL to check
 * @returns {Promise<boolean>} Whether the image loads successfully
 */
export const isValidImageUrl = async (url) => {
  if (!url) return false
  
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

/**
 * Instructions for users on how to embed images in Google Sheets
 */
export const getImageEmbedInstructions = () => {
  return {
    title: "How to Add Photos to Your Listing",
    steps: [
      "1. In the Google Sheet, click on the Photo cell for your listing",
      "2. Click Insert → Image → Image in cell",
      "3. Choose your photo file",
      "4. The image will be embedded directly in the cell",
      "5. Save the sheet - the photo will automatically appear on the map!"
    ]
  }
}
