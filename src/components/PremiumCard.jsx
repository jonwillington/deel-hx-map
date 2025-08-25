import { useState, useRef, useEffect } from 'react'
import { Flag } from './Flag'
import { getListingType } from '../utils/locationUtils'
import { formatReadableDate } from '../utils/dateUtils'
import { useImageUrl } from '../hooks/useImageUrl'

/**
 * Premium card component for displaying detailed property information
 * @param {Object} props
 * @param {Object} props.location - Property location data
 * @param {Function} props.onClose - Function to close the card
 * @param {boolean} props.isClosing - Whether the card is closing
 * @param {string} props.segment - Current segment ('sublets' or 'exchange')
 * @returns {JSX.Element|null}
 */
export const PremiumCard = ({ location, onClose, isClosing, segment, rowIndex = null }) => {
  const [showModal, setShowModal] = useState(false)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const scrollableRef = useRef(null)
  
  // Load image URL asynchronously
  const { imageUrl, loading: imageLoading, error: imageError } = useImageUrl(location, rowIndex, segment)
  
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
        {imageUrl && !imageLoading ? (
          <img 
            key={`${location.Name}-${location.City}-${rowIndex}`}
            src={imageUrl} 
            alt="Property" 
            onError={(e) => {
              console.error('Image failed to load:', e.target.src.substring(0, 100) + '...')
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div className="premium-card-placeholder" style={{ display: (imageUrl && !imageLoading) ? 'none' : 'flex' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#e0e0e0">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </div>
        <div className="premium-card-image-overlay">
          <h3 className="premium-card-title-overlay">{location.City || ''}</h3>
        </div>
        <button className="premium-card-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      {/* Scrollable cells section */}
      <div className="premium-card-scrollable" ref={scrollableRef}>
        <div className="premium-card-cells">
          {/* Notes as prominent body text - moved to scrollable area */}
          {location['Any notes'] && (
            <div className="premium-card-notes">
              <p>{location['Any notes']}</p>
            </div>
          )}
          <div className="premium-card-cell">
            <div className="premium-card-cell-label">Country</div>
            <div className="premium-card-cell-value">
              <Flag country={location.Country} className="flag-inline" /> {location.Country || 'Not specified'}
            </div>
          </div>

          {location.Neighbourhood && (
            <div className="premium-card-cell">
              <div className="premium-card-cell-label">Neighbourhood</div>
              <div className="premium-card-cell-value">{location.Neighbourhood}</div>
            </div>
          )}

          {(!location.Status || location.Status.toLowerCase() !== 'flexible') && (
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
          )}

          <div className="premium-card-cell">
            <div className="premium-card-cell-label">Size</div>
            <div className="premium-card-cell-value">{location.Size || 'Not specified'}</div>
          </div>

          <div className="premium-card-cell">
            <div className="premium-card-cell-label">Entire place</div>
            <div className="premium-card-cell-value">
              {location['Entire Place'] === 'TRUE' || location['Entire Place'] === true ? 
                <span className="premium-card-toggle premium-card-toggle-yes">Yes</span> : 
                <span className="premium-card-toggle premium-card-toggle-no">Sharing</span>
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
                    <div className="interest-modal-illustration">
                      <img src="/img/message-sent.svg" alt="Message sent illustration" />
                    </div>
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
