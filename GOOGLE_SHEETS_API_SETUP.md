# Google Sheets API Setup for Embedded Images

## Overview
This guide will help you set up the Google Sheets API to fetch embedded images directly from Google Sheets cells.

## Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Name it something like "Deel Housing Exchange Map"
   - Click "Create"

3. **Enable Google Sheets API**
   - In the left sidebar, go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click on it and click "Enable"

## Step 2: Create API Credentials

1. **Go to Credentials**
   - In the left sidebar, go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"

2. **Configure API Key**
   - Copy the generated API key
   - Click "Restrict Key" to secure it
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `localhost:5174/*` for development)
   - Under "API restrictions", select "Restrict key"
   - Select "Google Sheets API" from the dropdown
   - Click "Save"

## Step 3: Add API Key to Environment

1. **Add to .env file**
   ```bash
   VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
   ```

2. **Update sheetsApi.js**
   - Replace the placeholder API key in the code

## Step 4: Test the Setup

1. **Add an embedded image to Google Sheets**
   - Open your Google Sheet
   - Click on a Photo cell
   - Go to Insert → Image → Image in cell
   - Choose an image file
   - The image will be embedded in the cell

2. **Test in the app**
   - The embedded image should now appear on the map

## Security Notes

- Keep your API key secure
- Set up proper CORS restrictions
- Consider using a service account for production
- Monitor API usage in Google Cloud Console

## Troubleshooting

- **CORS errors**: Make sure your domain is in the API key restrictions
- **403 errors**: Check that Google Sheets API is enabled
- **No images**: Verify the sheet ID and GID are correct
