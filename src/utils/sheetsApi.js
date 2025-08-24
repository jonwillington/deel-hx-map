/**
 * Google Sheets API utilities for fetching embedded images
 */

const SHEET_ID = '14YSy-w-db4rqXa1nHyaPZCVp7Qcd3UcOBJOqfZXENdo'
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY

// Google Apps Script Web App URL for embedded images
// TODO: Replace with your deployed Apps Script URL after setup
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || null

/**
 * Get embedded images from Google Sheets using Google Apps Script
 * @param {string} gid - Sheet GID (0 for first sheet, 432320278 for exchanges)
 * @returns {Promise<Object>} Mapping of row numbers to image URLs
 */
export const getEmbeddedImages = async (gid = '0') => {
  try {
    // Method 1: Try Google Apps Script (preferred for embedded images)
    if (APPS_SCRIPT_URL) {
      console.log('Fetching embedded images from Google Apps Script...')
      const appsScriptResponse = await fetch(`${APPS_SCRIPT_URL}?gid=${gid}`)
      
      if (appsScriptResponse.ok) {
        const appsScriptData = await appsScriptResponse.json()
        console.log('Apps Script response:', appsScriptData)
        
        if (appsScriptData.success && appsScriptData.images) {
          const imageCount = Object.keys(appsScriptData.images).length
          console.log(`Successfully retrieved ${imageCount} embedded images from Apps Script`)
          return appsScriptData.images
        } else {
          console.warn('Apps Script returned no images:', appsScriptData.error || 'Unknown error')
        }
      } else {
        console.warn('Apps Script request failed:', appsScriptResponse.status, appsScriptResponse.statusText)
      }
    }
    
    // Method 2: Fallback to Google Sheets API v4 (limited - cannot access embedded images)
    if (API_KEY) {
      console.log('Falling back to Google Sheets API v4...')
      const sheetName = gid === '432320278' ? 'Exchange' : 'Sublet'
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!L:L?key=${API_KEY}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Google Sheets API fallback response:', data)
      
      // Check for URLs in Photo column (column L)
      const images = {}
      if (data.values) {
        data.values.forEach((row, index) => {
          const rowNumber = index + 1 // Convert to 1-based indexing
          const cellValue = row[0] // First (and only) column in the L:L range
          
          if (cellValue && typeof cellValue === 'string') {
            // Check if it's a valid URL
            if (cellValue.startsWith('http') || cellValue.startsWith('data:image/')) {
              images[rowNumber.toString()] = cellValue
              console.log(`Found image URL in row ${rowNumber}: ${cellValue.substring(0, 50)}...`)
            }
            // Check if it's an =IMAGE() formula
            else if (cellValue.includes('=IMAGE(')) {
              const urlMatch = cellValue.match(/=IMAGE\s*\(\s*"([^"]+)"\s*\)/i)
              if (urlMatch) {
                images[rowNumber.toString()] = urlMatch[1]
                console.log(`Found IMAGE formula in row ${rowNumber}: ${urlMatch[1]}`)
              }
            }
          }
        })
      }
      
      const imageCount = Object.keys(images).length
      if (imageCount > 0) {
        console.log(`Found ${imageCount} images via API fallback`)
        return images
      }
    }
    
    // Method 3: Development fallback
    console.warn('No images found via any method. Using development fallback.')
    return {
      // Row 2 (Jon Willington's Barcelona listing) - 1-based indexing
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
 * Instructions for setting up Google Apps Script for embedded images
 */
export const getApiSetupInstructions = () => {
  return {
    title: "Setting up Google Apps Script for Embedded Images",
    sections: [
      {
        title: "Step 1: Create Google Apps Script",
        steps: [
          "1. Go to script.google.com",
          "2. Click 'New project'",
          "3. Replace the code with the content from google-apps-script.js",
          "4. Save the project with a meaningful name (e.g., 'Deel HX Map Images')"
        ]
      },
      {
        title: "Step 2: Deploy as Web App",
        steps: [
          "1. Click 'Deploy' → 'New deployment'",
          "2. Choose type: 'Web app'",
          "3. Set 'Execute as': 'Me'",
          "4. Set 'Who has access': 'Anyone'",
          "5. Click 'Deploy' and authorize the app",
          "6. Copy the Web App URL"
        ]
      },
      {
        title: "Step 3: Configure Environment",
        steps: [
          "1. Add VITE_APPS_SCRIPT_URL=your_web_app_url to .env",
          "2. Restart your development server",
          "3. Test the integration"
        ]
      }
    ],
    troubleshooting: [
      "• If images don't appear, check the Apps Script logs at script.google.com",
      "• Ensure the sheet ID matches in both your app and the script",
      "• Test the script functions directly in the Apps Script editor",
      "• Make sure users add images via Insert → Image → Image in cell"
    ],
    userInstructions: {
      title: "For Users: How to Add Photos",
      steps: [
        "1. Click on the Photo cell in your row",
        "2. Go to Insert → Image → Image in cell",
        "3. Upload or choose your photo",
        "4. The image will appear in the map automatically!"
      ]
    }
  }
}
