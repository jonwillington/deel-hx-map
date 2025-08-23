import { getCountryFlag, getListingType } from '../utils/locationUtils'

/**
 * Premium card component for displaying detailed property information
 * @param {Object} props
 * @param {Object} props.location - Property location data
 * @param {Function} props.onClose - Function to close the card
 * @returns {JSX.Element|null}
 */
export const PremiumCard = ({ location, onClose }) => {
  if (!location) return null

  return (
    <div className="premium-card">
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
            <div className="premium-card-cell-label">Available From</div>
            <div className="premium-card-cell-value">
              {location.Status && location.Status.toUpperCase() === 'ASK' ? 
                'Contact for availability' :
                (() => {
                  if (!location.Start) return 'Not specified'
                  const duration = location['Duration '] || location.Duration || location.duration || ''
                  if (duration && typeof duration === 'string' && duration.trim()) {
                    return `${location.Start} (${duration.trim()})`
                  }
                  return location.Start
                })()
              }
            </div>
          </div>

          {location['Dates free start 2'] && (
            <div className="premium-card-cell">
              <div className="premium-card-cell-label">Also Available From</div>
              <div className="premium-card-cell-value">{location['Dates free start 2']}</div>
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
          
          <div className="premium-card-cell">
            <div className="premium-card-cell-label">Speak to</div>
            <div className="premium-card-cell-value">{location.Name || 'Not specified'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
