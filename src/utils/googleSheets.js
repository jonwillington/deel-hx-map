const { google } = require('googleapis');
require('dotenv').config();

class GoogleSheetsAPI {
  constructor() {
    this.sheets = google.sheets({ version: 'v4' });
    this.auth = null;
  }

  // Initialize authentication
  async initializeAuth() {
    try {
      // For public sheets, we can use API key authentication
      if (process.env.GOOGLE_SHEETS_API_KEY) {
        this.auth = process.env.GOOGLE_SHEETS_API_KEY;
        return true;
      }

      // For private sheets, we need OAuth2
      if (process.env.GOOGLE_SHEETS_CLIENT_ID && process.env.GOOGLE_SHEETS_CLIENT_SECRET) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_SHEETS_CLIENT_ID,
          process.env.GOOGLE_SHEETS_CLIENT_SECRET,
          process.env.GOOGLE_SHEETS_REDIRECT_URI
        );
        
        // You'll need to implement token refresh logic here
        // For now, we'll use API key approach
        console.warn('OAuth2 not fully implemented. Please use API key for public sheets.');
        return false;
      }

      throw new Error('No authentication credentials provided');
    } catch (error) {
      console.error('Authentication initialization failed:', error);
      return false;
    }
  }

  // Get sheet metadata
  async getSheetMetadata(sheetId = process.env.SHEET_ID) {
    try {
      if (!this.auth) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.get({
        auth: this.auth,
        spreadsheetId: sheetId,
      });

      return {
        title: response.data.properties.title,
        sheets: response.data.sheets.map(sheet => ({
          title: sheet.properties.title,
          sheetId: sheet.properties.sheetId,
          gridProperties: sheet.properties.gridProperties,
        })),
      };
    } catch (error) {
      console.error('Error fetching sheet metadata:', error);
      throw error;
    }
  }

  // Get data from a specific range
  async getSheetData(range, sheetId = process.env.SHEET_ID) {
    try {
      if (!this.auth) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.values.get({
        auth: this.auth,
        spreadsheetId: sheetId,
        range: range,
      });

      return response.data.values || [];
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw error;
    }
  }

  // Get all data from the first sheet
  async getAllData(sheetId = process.env.SHEET_ID) {
    try {
      const metadata = await this.getSheetMetadata(sheetId);
      const firstSheet = metadata.sheets[0];
      
      if (!firstSheet) {
        throw new Error('No sheets found in the spreadsheet');
      }

      const range = `${firstSheet.title}!A:Z`; // Get all columns
      const data = await this.getSheetData(range, sheetId);
      
      return {
        metadata,
        data,
        headers: data.length > 0 ? data[0] : [],
        rows: data.slice(1), // Skip header row
      };
    } catch (error) {
      console.error('Error fetching all data:', error);
      throw error;
    }
  }

  // Get data from a specific sheet by name
  async getSheetByName(sheetName, sheetId = process.env.SHEET_ID) {
    try {
      const range = `${sheetName}!A:Z`;
      const data = await this.getSheetData(range, sheetId);
      
      return {
        headers: data.length > 0 ? data[0] : [],
        rows: data.slice(1),
      };
    } catch (error) {
      console.error(`Error fetching sheet '${sheetName}':`, error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const googleSheetsAPI = new GoogleSheetsAPI();

module.exports = googleSheetsAPI;