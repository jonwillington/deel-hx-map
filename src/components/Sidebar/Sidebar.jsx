import { SegmentedControl } from './SegmentedControl'
import { MonthFilter } from './MonthFilter'
import { PropertyList } from './PropertyList'

/**
 * Main sidebar component
 * @param {Object} props
 * @param {Array} props.filteredLocations - Array of filtered location data
 * @param {number} props.selectedIndex - Currently selected property index
 * @param {boolean} props.loading - Whether the app is in loading state
 * @param {boolean} props.showSkeletons - Whether to show loading skeletons
 * @param {string} props.selectedSegment - Currently selected segment
 * @param {string} props.selectedMonth - Currently selected month filter
 * @param {Function} props.onSelect - Function to call when a property is selected
 * @param {Function} props.onSegmentChange - Function to call when segment changes
 * @param {Function} props.onMonthChange - Function to call when month filter changes
 * @returns {JSX.Element}
 */
export const Sidebar = ({ 
  filteredLocations, 
  selectedIndex, 
  loading, 
  showSkeletons, 
  selectedSegment, 
  selectedMonth,
  onSelect, 
  onSegmentChange,
  onMonthChange
}) => {
  return (
    <div className="sidebar">
      <SegmentedControl 
        selectedSegment={selectedSegment}
        onSegmentChange={onSegmentChange}
      />
      
      {selectedSegment === 'sublets' && (
        <MonthFilter 
          selectedMonth={selectedMonth}
          onMonthChange={onMonthChange}
        />
      )}
      
      <div className="sidebar-list">
        {/* Render list only after skeleton has fully faded out to avoid overlap/jump */}
        {!loading && !showSkeletons && (
          <PropertyList 
            filteredLocations={filteredLocations}
            selectedIndex={selectedIndex}
            loading={loading}
            selectedSegment={selectedSegment}
            selectedMonth={selectedMonth}
            onSelect={onSelect}
          />
        )}

        {loading && (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={`skeleton-${i}`} className={`skeleton-card ${!showSkeletons ? 'fade-out' : ''}`}>
              <div className="skeleton-card-content">
                <div className="skeleton-photo"></div>
                <div className="skeleton-details">
                  <div className="skeleton-location"></div>
                  <div className="skeleton-dates"></div>
                  <div className="skeleton-name"></div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {filteredLocations.length === 0 && !loading && (
          <div className="empty">
            <img src="/img/No Content.svg" alt="No content illustration" className="empty-lock-icon" />
            <div className="empty-text">
              {selectedSegment === 'exchanges' || selectedSegment === 'exchange' 
                ? 'No exchanges currently live' 
                : 'Nothing available yet'
              }
            </div>
            <div className="empty-caption">
              {selectedSegment === 'exchanges' || selectedSegment === 'exchange'
                ? 'Please check back again soon. Are you interested in listing your place? Add your location and preferred dates to the sheet.'
                : 'Please check back again soon. Are you planning on going away? Add your place to sheet!'
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
