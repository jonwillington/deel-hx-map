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
export const MapComponent = ({ locations, onLocationSelect, loading, error, mapRef, segment, showCreateModal, setShowCreateModal, refreshMarkers }) => {

  return (
    <div className="map-area">
      {loading && (
        <div style={{ 
          position: 'absolute', 
          zIndex: 2, 
          left: '380px', 
          top: '20px', 
          padding: '12px 16px', 
          background: '#1a0d3f', 
          borderRadius: 6, 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'white'
        }}>
          <div className="spinner-small-dark"></div>
          <span>
            {segment === 'exchange' || segment === 'exchanges' 
              ? 'Checking for the latest exchanges' 
              : 'Checking for the latest sublets'
            }
          </span>
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
      
      {/* Temporary Refresh Button for El Born Fix */}
      {refreshMarkers && (
        <button 
          onClick={refreshMarkers}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10,
            padding: '8px 12px',
            background: '#1a0d3f',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Refresh Markers
        </button>
      )}
      
      {/* Create Listing Button */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="create-listing-button"
      >
        Create listing
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '8px' }}>
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
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
          <a href="https://docs.google.com/spreadsheets/d/14YSy-w-db4rqXa1nHyaPZCVp7Qcd3UcOBJOqfZXENdo/edit#gid=432320278" target="_blank" rel="noopener noreferrer">
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
      

    </div>
  )
}
