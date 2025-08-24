/**
 * Map component for displaying the interactive map
 * @param {Object} props
 * @param {Array} props.locations - Array of location data
 * @param {Function} props.onLocationSelect - Function to call when a location is selected
 * @param {boolean} props.loading - Whether the app is in loading state
 * @param {string} props.error - Error message if any
 * @param {Object} props.mapRef - Map container ref from parent
 * @returns {JSX.Element}
 */
export const MapComponent = ({ locations, onLocationSelect, loading, error, mapRef }) => {

  return (
    <div className="map-area">
      {loading && (
        <div style={{ 
          position: 'absolute', 
          zIndex: 2, 
          left: 16, 
          top: 12, 
          padding: '8px', 
          background: 'rgba(255,255,255,0.95)', 
          borderRadius: 6, 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          Loading…
        </div>
      )}
      
      {error && (
        <div style={{ 
          position: 'absolute', 
          zIndex: 2, 
          left: 16, 
          top: 12, 
          padding: '8px', 
          background: '#fee', 
          color: '#900', 
          borderRadius: 6, 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          {error}
        </div>
      )}

      <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
      
      {/* Create Listing Button */}
      <a 
        href="https://google.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="create-listing-button"
      >
        Create listing
      </a>
      
      <div className="feedback-bar">
        <div className="feedback-bar-left">
          <a href="https://google.com" target="_blank" rel="noopener noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m18 2 4 4-12 12H6v-4L18 2z"/>
            </svg>
            Update sublets
          </a>
          <span className="interpunct">•</span>
          <a href="https://google.com" target="_blank" rel="noopener noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m18 2 4 4-12 12H6v-4L18 2z"/>
            </svg>
            Update exchanges
          </a>
        </div>
        <div className="feedback-bar-right">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a7 7 0 0 0-7 7c0 2.96 1.63 5.73 4 7.17V20a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-3.83c2.37-1.44 4-4.21 4-7.17A7 7 0 0 0 12 2Z"/>
          </svg>
          Got any feature suggestions or feedback? <a href="https://google.com" target="_blank" rel="noopener noreferrer">Send them here!</a>
        </div>
      </div>
    </div>
  )
}
