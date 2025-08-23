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
      
      <div className="feedback-bar">
        Got any feature suggestions or feedback? Send them <a href="https://google.com" target="_blank" rel="noopener noreferrer">here!</a>
      </div>
    </div>
  )
}
