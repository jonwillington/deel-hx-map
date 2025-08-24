import { useState } from 'react'
import { getCountryFlag, getListingType } from '../utils/locationUtils'
import { formatReadableDate } from '../utils/dateUtils'

/**
 * Premium card component for displaying detailed property information
 * @param {Object} props
 * @param {Object} props.location - Property location data
 * @param {Function} props.onClose - Function to close the card
 * @returns {JSX.Element|null}
 */
export const PremiumCard = ({ location, onClose, isClosing }) => {
  const [showModal, setShowModal] = useState(false)
  
  if (!location) return null

  return (
    <div className={`premium-card ${isClosing ? 'premium-card-closing' : ''}`}>
      {/* Full-width image at top */}
      <div className="premium-card-image">
        {location.Photo ? (
          <img src={location.Photo} alt="Property" />
        ) : (
          <div className="premium-card-placeholder">No Image</div>
        )}
        <div className="premium-card-image-overlay">
          <h3 className="premium-card-title-overlay">{location.City || ''}</h3>
          <p className="premium-card-country-overlay">{getCountryFlag(location.Country)} {location.Country || ''}</p>
        </div>
        <button className="premium-card-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      {/* Fixed content section */}
      <div className="premium-card-fixed-content">
        {/* Notes as prominent body text - moved above cells */}
        {location['Any notes'] && (
          <div className="premium-card-notes">
            <p>{location['Any notes']}</p>
          </div>
        )}
      </div>

      {/* Scrollable cells section */}
      <div className="premium-card-scrollable">
        <div className="premium-card-cells">
          <div className="premium-card-cell">
            <div className="premium-card-cell-label">Type</div>
            <div className="premium-card-cell-value">
              {getListingType(location) ? (
                <span className="premium-card-tag">{getListingType(location)}</span>
              ) : (
                'Not specified'
              )}
            </div>
          </div>
          
          <div className="premium-card-cell">
            <div className="premium-card-cell-label">Neighbourhood</div>
            <div className="premium-card-cell-value">{location.Neighbourhood || 'Not specified'}</div>
          </div>
          
                          <div className="premium-card-cell">
                  <div className="premium-card-cell-label">Available from</div>
            <div className="premium-card-cell-value">
              {location.Status && location.Status.toUpperCase() === 'ASK' ? 
                'Contact for availability' :
                (() => {
                  if (!location.Start) return 'Not specified'
                  const formattedDate = formatReadableDate(location.Start)
                  return formattedDate
                })()
              }
            </div>
          </div>

          <div className="premium-card-cell">
            <div className="premium-card-cell-label">Duration</div>
            <div className="premium-card-cell-value">
              {(() => {
                const duration = location['Duration '] || location.Duration || location.duration || ''
                return (duration && typeof duration === 'string' && duration.trim()) 
                  ? duration.trim() 
                  : 'Not specified'
              })()}
            </div>
          </div>

                          {location['Dates free start 2'] && (
                  <div className="premium-card-cell">
                    <div className="premium-card-cell-label">Also available from</div>
              <div className="premium-card-cell-value">{formatReadableDate(location['Dates free start 2'])}</div>
            </div>
          )}

          <div className="premium-card-cell">
            <div className="premium-card-cell-label">Size</div>
            <div className="premium-card-cell-value">{location.Size || 'Not specified'}</div>
          </div>

          <div className="premium-card-cell">
            <div className="premium-card-cell-label">Entire place</div>
            <div className="premium-card-cell-value">
              {location['Entire place'] ? 
                <span className="premium-card-toggle premium-card-toggle-yes">Yes</span> : 
                <span className="premium-card-toggle premium-card-toggle-no">No</span>
              }
            </div>
          </div>

          <div className="premium-card-cell">
            <div className="premium-card-cell-label">Pets</div>
            <div className="premium-card-cell-value">
              {location.Pets ? 
                <span className="premium-card-toggle premium-card-toggle-yes">Yes</span> : 
                <span className="premium-card-toggle premium-card-toggle-no">No</span>
              }
            </div>
          </div>
          

        </div>
        
        {/* Interest Button */}
        <button 
          className="premium-card-interest-button"
          onClick={() => setShowModal(true)}
        >
          I'm interested!
        </button>
      </div>
      
      {/* Modal - Portal to body */}
      {showModal && (
        <>
          {/* Create portal to render outside of premium card */}
          {typeof document !== 'undefined' && (
            <div className="modal-portal">
              <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="modal-close"
                    onClick={() => setShowModal(false)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  <div className="modal-body">
                    <h3>Great!</h3>
                    <p>Please give <strong>{location.Name || 'them'}</strong> a message on Slack!</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
