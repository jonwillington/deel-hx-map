/**
 * Google Apps Script for extracting embedded images from Google Sheets
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to script.google.com
 * 2. Create new project
 * 3. Paste this code
 * 4. Deploy as Web App with access "Anyone"
 * 5. Copy the Web App URL and update your sheetsApi.js
 */

const SHEET_ID = '14YSy-w-db4rqXa1nHyaPZCVp7Qcd3UcOBJOqfZXENdo';

/**
 * Main function to handle GET requests
 * IMPORTANT: Deploy this as a web app with "Execute as: Me" and "Who has access: Anyone"
 */
function doGet(e) {
  const action = e.parameter.action;
  
  // Debug endpoint
  if (action === 'debug') {
    return ContentService.createTextOutput(JSON.stringify(testImageExtraction()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Normal operation
  try {
    const gid = e.parameter.gid || '0';
    const sheetName = gid === '432320278' ? 'Exchange' : 'Sublet';
    
    console.log(`Processing sheet: ${sheetName} (GID: ${gid})`);
    
    const images = getEmbeddedImages(sheetName);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      images: images,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error in doGet:', error);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message || error.toString(),
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle CORS preflight requests
 */
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Extract embedded images from the specified sheet
 */
function getEmbeddedImages(sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }
    
    const images = {};
    console.log(`Analyzing sheet: ${sheetName}`);
    
    // Method 1: Get drawings (images inserted via Insert > Drawing or Insert > Image > Over cells)  
    const drawings = sheet.getDrawings();
    console.log(`Found ${drawings.length} drawings in ${sheetName}`);
    
    drawings.forEach((drawing, index) => {
      try {
        const containerInfo = drawing.getContainerInfo();
        const anchorRow = containerInfo.getAnchorRow();
        const anchorCol = containerInfo.getAnchorColumn();
        
        console.log(`Drawing ${index}: Row ${anchorRow}, Col ${anchorCol} (Photo col is 12)`);
        
        // Process ALL drawings first to see what we have
        const blob = drawing.getBlob();
        const base64Data = Utilities.base64Encode(blob.getBytes());
        const mimeType = blob.getContentType();
        
        console.log(`Drawing ${index}: Type ${mimeType}, Size: ${blob.getBytes().length} bytes`);
        
        // Store image for any drawing near the Photo column area
        if (anchorCol >= 10 && anchorCol <= 15) {
          images[anchorRow.toString()] = `data:${mimeType};base64,${base64Data}`;
          console.log(`Stored drawing ${index} for row ${anchorRow}`);
        } else {
          console.log(`Drawing ${index} not in Photo area (col ${anchorCol}), skipping`);
        }
        
      } catch (drawingError) {
        console.error(`Error processing drawing ${index}:`, drawingError);
      }
    });
    
    // Method 2: Check Photo column (L) for in-cell images and URLs
    const photoColIndex = 12; // L column (1-based)
    const maxRows = Math.min(sheet.getLastRow(), 50); // Limit to reasonable number
    
    if (sheet.getLastColumn() >= photoColIndex) {
      // Get all values in Photo column at once for efficiency  
      const photoRange = sheet.getRange(1, photoColIndex, maxRows, 1);
      const photoValues = photoRange.getValues();
      
      for (let i = 1; i < photoValues.length; i++) { // Skip header row
        const row = i + 1;
        const cellValue = photoValues[i][0];
        
        if (cellValue) {
          if (typeof cellValue === 'string') {
            // Handle URLs and formulas
            if (cellValue.startsWith('http') || cellValue.startsWith('data:image/')) {
              images[row.toString()] = cellValue;
              console.log(`Found image data in row ${row}: ${cellValue.substring(0, 50)}...`);
            } else if (cellValue.includes('IMAGE(')) {
              const urlMatch = cellValue.match(/IMAGE\s*\(\s*"([^"]+)"\s*\)/i);
              if (urlMatch) {
                images[row.toString()] = urlMatch[1];
                console.log(`Found IMAGE formula in row ${row}: ${urlMatch[1]}`);
              }
            }
          }
          
          // Method 3: Try to detect in-cell images using advanced techniques
          try {
            const cell = sheet.getRange(row, photoColIndex);
            const richText = cell.getRichTextValue();
            
            // Check if cell has rich text that might contain images
            if (richText && richText.getText() === '' && !images[row.toString()]) {
              // This might be an in-cell image - we'll need to handle this differently
              console.log(`Possible in-cell image detected in row ${row}`);
            }
          } catch (richTextError) {
            // Rich text check failed, continue
          }
        }
      }
    }
    
    console.log(`Total images found: ${Object.keys(images).length}`);
    console.log('Image summary:', Object.keys(images).map(row => `Row ${row}: ${images[row].substring(0, 30)}...`));
    
    return images;
    
  } catch (error) {
    console.error('Error in getEmbeddedImages:', error);
    throw error;
  }
}

/**
 * Test function to debug image extraction - returns detailed info
 */
function testImageExtraction() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName('Sublet');
    const drawings = sheet.getDrawings();
    
    const debug = {
      totalDrawings: drawings.length,
      drawingDetails: [],
      images: {}
    };
    
    drawings.forEach((drawing, index) => {
      try {
        const containerInfo = drawing.getContainerInfo();
        const anchorRow = containerInfo.getAnchorRow();
        const anchorCol = containerInfo.getAnchorColumn();
        const blob = drawing.getBlob();
        
        const detail = {
          index: index,
          row: anchorRow,
          col: anchorCol,
          mimeType: blob.getContentType(),
          sizeBytes: blob.getBytes().length
        };
        
        debug.drawingDetails.push(detail);
        
        if (anchorCol >= 10 && anchorCol <= 15) {
          const base64Data = Utilities.base64Encode(blob.getBytes());
          debug.images[anchorRow.toString()] = `data:${blob.getContentType()};base64,${base64Data.substring(0, 50)}...`;
        }
        
      } catch (error) {
        debug.drawingDetails.push({index: index, error: error.toString()});
      }
    });
    
    return debug;
    
  } catch (error) {
    return {error: error.toString()};
  }
}


/**
 * Function to help identify where images might be located
 */
function debugSheetStructure() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName('Sublet');
    
    console.log('Sheet info:');
    console.log('- Max rows:', sheet.getMaxRows());
    console.log('- Max columns:', sheet.getMaxColumns());
    console.log('- Data range:', sheet.getDataRange().getA1Notation());
    
    // Check for drawings
    const drawings = sheet.getDrawings();
    console.log('- Number of drawings:', drawings.length);
    
    // Check specific cells for content
    const testCells = ['L1', 'L2', 'L3'];
    testCells.forEach(cellAddress => {
      const cell = sheet.getRange(cellAddress);
      const value = cell.getValue();
      const formula = cell.getFormula();
      const note = cell.getNote();
      
      console.log(`Cell ${cellAddress}:`);
      console.log('  Value:', value);
      console.log('  Formula:', formula);
      console.log('  Note:', note);
      console.log('  Type:', typeof value);
    });
    
    return 'Debug complete - check logs';
    
  } catch (error) {
    console.error('Debug error:', error);
    return error.toString();
  }
}