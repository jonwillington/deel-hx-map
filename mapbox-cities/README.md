# Deel HX Map

A premium property listing map application built with React, Mapbox GL JS, and Vite.

## Features

- Interactive map with smooth panning and premium animations
- Property filtering by type (Sublets/Exchange) and dates
- Premium card interface with detailed property information
- iOS-style segmented controls and switches
- Responsive design with glass morphism effects
- Bagoss Standard and Inter typography

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   Create a `.env` file in the root directory:
   ```
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   VITE_SHEET_CSV=your_google_sheet_csv_url_here
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages:

1. The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically build and deploy the app when you push to the `main` branch
2. Your site will be available at: `https://jonwillington.github.io/deel-hx-map/`

## Technologies Used

- React 18
- Mapbox GL JS
- Vite
- Papa Parse (CSV parsing)
- CSS3 with modern features (backdrop-filter, etc.)

## Fonts

- **Bagoss Standard**: Used for location names and premium elements
- **Inter**: Default font for all other text
