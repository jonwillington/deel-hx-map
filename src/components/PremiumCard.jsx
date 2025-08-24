import { useState, useRef, useEffect } from 'react'
import { getCountryFlag, getListingType } from '../utils/locationUtils'
import { formatReadableDate } from '../utils/dateUtils'
import { getImageUrl } from '../utils/imageUtils'

/**
 * Premium card component for displaying detailed property information
 * @param {Object} props
 * @param {Object} props.location - Property location data
 * @param {Function} props.onClose - Function to close the card
 * @param {boolean} props.isClosing - Whether the card is closing
 * @param {string} props.segment - Current segment ('sublets' or 'exchange')
 * @returns {JSX.Element|null}
 */
export const PremiumCard = ({ location, onClose, isClosing, segment }) => {
  const [showModal, setShowModal] = useState(false)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const scrollableRef = useRef(null)
  
  if (!location) return null

  // Handle scroll indicator and ensure trackpad scrolling works
  useEffect(() => {
    const scrollableElement = scrollableRef.current
    if (!scrollableElement) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollableElement
      const isScrollable = scrollHeight > clientHeight
      
      // Show indicator when there's content to scroll (regardless of scroll position)
      setShowScrollIndicator(isScrollable)
    }

    // Ensure the element can receive scroll events
    scrollableElement.style.webkitOverflowScrolling = 'touch'
    scrollableElement.tabIndex = 0
    
    scrollableElement.addEventListener('scroll', handleScroll)
    
    // Check initial state
    handleScroll()

    // Also check on window resize to handle dynamic content changes
    const handleResize = () => {
      setTimeout(handleScroll, 100) // Small delay to ensure DOM updates
    }
    window.addEventListener('resize', handleResize)

    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [location])

  return (
    <div className={`premium-card ${isClosing ? 'premium-card-closing' : ''}`}>
      {/* Full-width image at top */}
      <div className="premium-card-image">
        {getImageUrl(location) ? (
          <img 
            src={getImageUrl(location)} 
            alt="Property" 
            onError={(e) => {
              console.error('Image failed to load:', e.target.src.substring(0, 100) + '...')
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
        ) : null}
        <div className="premium-card-placeholder" style={{ display: getImageUrl(location) ? 'none' : 'block' }}>
          No Image
        </div>
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
      <div className="premium-card-scrollable" ref={scrollableRef}>
        <div className="premium-card-cells">
          <div className="premium-card-cell">
            <div className="premium-card-cell-label">Type</div>
            <div className="premium-card-cell-value">
              <span className="premium-card-tag">
                {segment === 'exchange' || segment === 'exchanges' ? 'Exchange' : 'Sublet'}
              </span>
            </div>
          </div>
          
          {location.Neighbourhood && (
            <div className="premium-card-cell">
              <div className="premium-card-cell-label">Neighbourhood</div>
              <div className="premium-card-cell-value">{location.Neighbourhood}</div>
            </div>
          )}
          
                          <div className="premium-card-cell">
                  <div className="premium-card-cell-label">
                    {segment === 'exchange' || segment === 'exchanges' ? 'Interested in' : 'Available from'}
                  </div>
            <div className="premium-card-cell-value">
              {(segment === 'exchange' || segment === 'exchanges') ? 
                (location['Destinations interested in swapping'] || 'Not specified') :
                (location.Status && location.Status.toUpperCase() === 'ASK' ? 
                  'Contact for availability' :
                  (() => {
                    if (!location.Start) return 'Not specified'
                    const formattedDate = formatReadableDate(location.Start)
                    return formattedDate
                  })()
                )
              }
            </div>
          </div>

          <div className="premium-card-cell">
            <div className="premium-card-cell-label">
              {segment === 'exchange' || segment === 'exchanges' ? 'Target time' : 'Duration'}
            </div>
            <div className="premium-card-cell-value">
              {(segment === 'exchange' || segment === 'exchanges') ? 
                (location['Target time'] || 'Not specified') :
                (() => {
                  const duration = location['Duration '] || location.Duration || location.duration || ''
                  return (duration && typeof duration === 'string' && duration.trim()) 
                    ? duration.trim() 
                    : 'Not specified'
                })()
              }
            </div>
          </div>

                          {(segment !== 'exchange' && segment !== 'exchanges') && location['Dates free start 2'] && (
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
            <div className="premium-card-cell-label">Pet friendly?</div>
            <div className="premium-card-cell-value">
              {location.Pets ? 
                <span className="premium-card-toggle premium-card-toggle-yes">Yes</span> : 
                <span className="premium-card-toggle premium-card-toggle-no">Not currently</span>
              }
            </div>
          </div>
          

        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className={`premium-card-scroll-indicator ${showScrollIndicator ? 'show' : ''}`}></div>
      
      {/* Interest Button - Fixed at bottom */}
      <div className="premium-card-button-container">
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
