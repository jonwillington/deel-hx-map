import { getCountryFlag } from '../../utils/locationUtils'

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
export const PropertyCard = ({ row, itemIndex, isActive, loading, onClick }) => {
  const getDisplayText = () => {
    if (row.Status && row.Status.toUpperCase() === 'ASK') {
      return 'Contact for availability'
    }
    
    // Build the display string: duration • size
    const parts = []
    
    // Add duration part
    const duration = row['Duration '] || row.Duration || row.duration || ''
    if (duration && duration.trim()) {
      parts.push(duration.trim())
    }
    
    // Add size part
    const size = row.Size || row.size || ''
    if (size && size.trim()) {
      parts.push(size.trim())
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Available'
  }

  return (
    <button 
      className={`small-card ${isActive ? 'active' : ''} ${!loading ? 'fade-in' : ''}`} 
      onClick={() => onClick(itemIndex)}
    >
      <div className="small-card-content">
        {row.Photo && (
          <div className="small-card-photo">
            <img src={row.Photo} alt="Property" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div className="small-card-details">
          <div className="small-card-location" style={{ fontSize: '18px', fontWeight: '500', marginBottom: '2px', letterSpacing: '-0.3px', fontFamily: 'Bagoss Standard, sans-serif' }}>
            {row.City || ''} {getCountryFlag(row.Country)}
          </div>
          <div className="small-card-dates" style={{ fontSize: '14px', color: '#6d6d70', marginBottom: '6px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            {getDisplayText()}
          </div>
          <div className="small-card-name" style={{ fontSize: '14px', color: '#86868b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            {row.Name}
          </div>
        </div>
      </div>
    </button>
  )
}
