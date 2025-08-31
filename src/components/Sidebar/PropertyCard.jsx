import { Flag } from '../Flag'
import { useImageUrl } from '../../hooks/useImageUrl'

/**
 * Property card component for displaying individual properties in the sidebar
 * @param {Object} props
 * @param {Object} props.row - Property data
 * @param {number} props.itemIndex - Index in the filtered data array
 * @param {boolean} props.isActive - Whether this card is currently selected
 * @param {boolean} props.loading - Whether the app is in loading state
 * @param {Function} props.onClick - Function to call when card is clicked
 * @returns {JSX.Element}
 */
export const PropertyCard = ({ row, itemIndex, isActive, loading, onClick, style, segment = 'sublets' }) => {
  // Load image URL asynchronously
  const { imageUrl, loading: imageLoading } = useImageUrl(row, itemIndex, segment)
  const getDisplayText = () => {
    if (row.Status && row.Status.toUpperCase() === 'ASK') {
      return (
        <span>Contact for availability</span>
      )
    }
    
    // Build the display with icons
    const parts = []
    
    // Add size part with bed icon (first)
    const size = row.Size || row.size || ''
    if (size && size.trim()) {
      parts.push(
        <span key="size" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-quaternary-light)" strokeWidth="1.5">
            <path d="M2 4v16"/>
            <path d="M2 8h18a2 2 0 0 1 2 2v10"/>
            <path d="M2 17h20"/>
            <path d="M6 8v9"/>
          </svg>
          {size.trim()}
        </span>
      )
    }
    
    // Add duration part with calendar icon (second)
    const duration = row['Duration '] || row.Duration || row.duration || ''
    if (duration && duration.trim()) {
      parts.push(
        <span key="duration" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-quaternary-light)" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {duration.trim()}
        </span>
      )
    }
    
    if (parts.length === 0) {
      return <span>Available</span>
    }
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {parts.map((part, index) => [
          part,
          index < parts.length - 1 && (
            <span key={`bullet-${index}`} style={{ color: 'var(--color-text-quaternary-light)', fontSize: '12px' }}>•</span>
          )
        ]).flat().filter(Boolean)}
      </div>
    )
  }

  return (
    <button 
      className={`small-card ${isActive ? 'active' : ''} ${!loading ? 'fade-in' : ''}`} 
      onClick={() => onClick(itemIndex)}
      style={style}
    >
                <div className="small-card-content">
            <div className="small-card-photo">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="Property" 
                  style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    console.error('PropertyCard image failed to load:', e.target.src.substring(0, 100) + '...')
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div className="small-card-placeholder" style={{ display: imageUrl ? 'none' : 'flex' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-text-disabled-light)">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
            </div>
        <div className="small-card-details">
          <div className="small-card-location">
            <Flag country={row.Country} className="flag-inline" /> {row.City || ''}
          </div>
          <div className="small-card-dates">
            {getDisplayText()}
          </div>
        </div>
      </div>
    </button>
  )
}
