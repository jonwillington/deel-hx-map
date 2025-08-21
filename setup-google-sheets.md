# Google Sheets API Setup Guide

This guide will help you set up the Google Sheets API to access your spreadsheet data.

## Step 1: Enable Google Sheets API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Google Sheets API" and enable it

## Step 2: Create API Credentials

### Option A: API Key (Recommended for public sheets)

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Optional) Restrict the API key to Google Sheets API only

### Option B: OAuth 2.0 (For private sheets)

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add `http://localhost:3000/auth/callback` to authorized redirect URIs
5. Copy the Client ID and Client Secret

## Step 3: Configure Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual credentials:

```env
# For API Key approach (public sheets)
GOOGLE_SHEETS_API_KEY=your_actual_api_key_here

# For OAuth 2.0 approach (private sheets)
GOOGLE_SHEETS_CLIENT_ID=your_client_id_here
GOOGLE_SHEETS_CLIENT_SECRET=your_client_secret_here
GOOGLE_SHEETS_REDIRECT_URI=http://localhost:3000/auth/callback

# Sheet ID (already configured)
SHEET_ID=14YSy-w-db4rqXa1nHyaPZCVp7Qcd3UcOBJOqfZXENdo
```

## Step 4: Make Your Sheet Public (if using API Key)

If you're using the API Key approach, you need to make your Google Sheet publicly accessible:

1. Open your Google Sheet
2. Click "Share" in the top right
3. Click "Change to anyone with the link"
4. Set permission to "Viewer"
5. Click "Done"

## Step 5: Test the Application

1. Start the development server:
   ```bash
   npm start
   ```

2. Open your browser to `http://localhost:3000`
3. The application should load and display your Google Sheets data

## Troubleshooting

### Common Issues:

1. **"No authentication credentials provided"**
   - Make sure you've added your API key to the `.env` file
   - Ensure the `.env` file is in the project root

2. **"Access denied" or "Forbidden"**
   - If using API Key: Make sure your sheet is publicly accessible
   - If using OAuth: Complete the OAuth flow

3. **"API not enabled"**
   - Make sure Google Sheets API is enabled in your Google Cloud Console

4. **"Invalid API key"**
   - Check that your API key is correct
   - Ensure the API key has access to Google Sheets API

### Security Notes:

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore` to prevent accidental commits
- For production, use environment variables on your hosting platform

## API Usage Limits

- Google Sheets API has quotas and rate limits
- Free tier: 300 requests per minute per project
- Monitor usage in Google Cloud Console > APIs & Services > Quotas