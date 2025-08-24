import { useState } from 'react'

/**
 * Map component for displaying the interactive map
 * @param {Object} props
 * @param {Array} props.locations - Array of location data
 * @param {Function} props.onLocationSelect - Function to call when a location is selected
 * @param {boolean} props.loading - Whether the app is in loading state
 * @param {string} props.error - Error message if any
 * @param {Object} props.mapRef - Map container ref from parent
 * @param {string} props.segment - Current segment ('sublets' or 'exchange')
 * @returns {JSX.Element}
 */
export const MapComponent = ({ locations, onLocationSelect, loading, error, mapRef, segment }) => {
  const [showCreateModal, setShowCreateModal] = useState(false)

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
          {segment === 'exchange' || segment === 'exchanges' 
            ? 'Checking for latest exchanges…' 
            : 'Checking for latest sublets…'
          }
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
      <button 
        onClick={() => setShowCreateModal(true)}
        className="create-listing-button"
      >
        Create listing
      </button>
      
      <div className="feedback-bar">
        <div className="feedback-bar-left">
          <a href="https://docs.google.com/spreadsheets/d/14YSy-w-db4rqXa1nHyaPZCVp7Qcd3UcOBJOqfZXENdo/edit?usp=sharing" target="_blank" rel="noopener noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m18 2 4 4-12 12H6v-4L18 2z"/>
            </svg>
            Update sublets
          </a>
          <span className="interpunct">•</span>
          <a href="https://docs.google.com/spreadsheets/d/14YSy-w-db4rqXa1nHyaPZCVp7Qcd3UcOBJOqfZXENdo/edit?usp=sharing" target="_blank" rel="noopener noreferrer">
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
          Feature suggestions or feedback? <a href="https://docs.google.com/forms/d/e/1FAIpQLSfk_wdWveHHQMBQCSigX1l4lXcghmle3Gu5oQdui7N9Xh78DQ/viewform?usp=dialog" target="_blank" rel="noopener noreferrer">Send them here!</a>
        </div>
      </div>
      
      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-listing-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowCreateModal(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            {/* Illustration space */}
            <div className="create-listing-illustration"></div>
            
            <div className="modal-body">
              <h3>To create a listing, follow these steps</h3>
              
              <div className="create-listing-steps">
                <div className="create-listing-step">
                  <div className="step-number">1</div>
                  <div className="step-content">Request access to sheet</div>
                </div>
                
                <div className="create-listing-step">
                  <div className="step-number">2</div>
                  <div className="step-content">Add your details to the row</div>
                </div>
                
                <div className="create-listing-step">
                  <div className="step-number">3</div>
                  <div className="step-content">If the property is no longer active, delete the row at any time</div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="premium-card-interest-button"
                onClick={() => {
                  window.open('https://docs.google.com/spreadsheets/d/14YSy-w-db4rqXa1nHyaPZCVp7Qcd3UcOBJOqfZXENdo/edit?usp=sharing', '_blank')
                }}
              >
                Open Google Sheet
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '8px' }}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15,3 21,3 21,9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
