/**
 * Utility functions for handling embedded images in Google Sheets
 */

import { getImageForRow } from './sheetsApi'

/**
 * Get image URL from location data
 * @param {Object} location - Location data object
 * @param {number} rowIndex - The index of the location in the filtered array
 * @param {string} segment - The current segment ('sublets' or 'exchanges')
 * @returns {Promise<string|null>} Image URL or null if no image
 */
export const getImageUrl = async (location, rowIndex = null, segment = 'sublets') => {
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
  
  // Try to get embedded image from Google Sheets API
  if (rowIndex !== null) {
    const gid = (segment === 'exchanges' || segment === 'exchange') ? '432320278' : '0'
    const rowNumber = rowIndex + 2 // +2 because row 1 is header, and we want 1-based indexing
    return await getImageForRow(rowNumber, location, gid)
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
 * Instructions for users on how to add images to Google Sheets
 */
export const getImageEmbedInstructions = () => {
  return {
    title: "How to Add Photos to Your Listing",
    methods: [
      {
        title: "Method 1: Slack (Easiest)",
        steps: [
          "1. Open Slack and send your photo to yourself in DMs",
          "2. Click on the uploaded image",
          "3. Click 'Open in browser' or right-click → 'Copy image address'", 
          "4. Paste the direct URL in your Photo cell",
          "5. Photo appears on the map instantly!"
        ]
      },
      {
        title: "Method 2: Google Drive",
        steps: [
          "1. Upload photo to Google Drive",
          "2. Right-click → Share → 'Anyone with the link'",
          "3. Copy URL and convert: change '/file/d/ID/view' to '/uc?id=ID'",
          "4. Paste converted URL in Photo cell"
        ]
      },
      {
        title: "Method 3: Any Image Host", 
        steps: [
          "1. Upload to Imgur, Dropbox, or any image host",
          "2. Get the direct image URL (ends in .jpg, .png, etc.)",
          "3. Paste URL in Photo cell"
        ]
      }
    ],
    troubleshooting: [
      "• Make sure URLs are publicly accessible (not private)",
      "• Google Drive links need proper sharing permissions", 
      "• Supported formats: JPG, PNG, GIF, WebP",
      "• If images don't appear, refresh the page and check browser console"
    ],
    urlConverter: {
      title: "Google Drive URL Converter",
      instructions: [
        "Convert Google Drive share links to direct image URLs:",
        "From: https://drive.google.com/file/d/FILE_ID/view",
        "To: https://drive.google.com/uc?id=FILE_ID"
      ]
    }
  }
}

/**
 * Convert Google Drive share URL to direct image URL
 * @param {string} shareUrl - Google Drive share URL
 * @returns {string|null} Direct image URL or null if invalid
 */
export const convertGoogleDriveUrl = (shareUrl) => {
  if (!shareUrl || typeof shareUrl !== 'string') return null;
  
  // Match Google Drive share URL pattern
  const match = shareUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/uc?id=${fileId}`;
  }
  
  return null;
}

/**
 * Validate if URL is a direct image URL
 * @param {string} url - URL to validate
 * @returns {boolean} Whether URL appears to be a direct image
 */
export const isDirectImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
  const drivePattern = /drive\.google\.com\/uc\?id=/;
  
  return imageExtensions.test(url) || drivePattern.test(url);
}
