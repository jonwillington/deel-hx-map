import { getPropertyMonth } from '../../utils/dateUtils'
import { MonthSeparator } from './MonthSeparator'
import { PropertyCard } from './PropertyCard'

/**
 * Property list component for displaying properties grouped by month
 * @param {Object} props
 * @param {Array} props.filteredLocations - Array of filtered location data
 * @param {number} props.selectedIndex - Currently selected property index
 * @param {boolean} props.loading - Whether the app is in loading state
 * @param {Function} props.onSelect - Function to call when a property is selected
 * @returns {JSX.Element}
 */
export const PropertyList = ({ filteredLocations, selectedIndex, loading, onSelect }) => {
  // Group properties by month
  const locationsByMonth = {}
  filteredLocations.forEach((row, originalIndex) => {
    const month = getPropertyMonth(row)
    if (!locationsByMonth[month]) {
      locationsByMonth[month] = []
    }
    // We need to pass the index from the filteredLocations array
    locationsByMonth[month].push({ row, indexInFiltered: originalIndex })
  })
  
  // Sort months
  const months = Object.keys(locationsByMonth).sort((a, b) => {
    if (a === 'FLEXIBLE') return 1
    if (b === 'FLEXIBLE') return -1
    return a.localeCompare(b)
  })
  
  const elements = []
  let staggerIndex = 0
  months.forEach(month => {
    // Add month header
    elements.push(
      <MonthSeparator key={`month-${month}`} month={month} />
    )
    
    // Add properties for this month
    locationsByMonth[month].forEach(({ row, indexInFiltered }) => {
      // Ultra-premium stagger: luxuriously slow cascade
      const groupIndex = Math.floor(staggerIndex / 3)
      const itemInGroup = staggerIndex % 3
      const baseDelay = groupIndex * 250 + itemInGroup * 120
      const delay = Math.min(baseDelay, 2500)
      
      elements.push(
        <PropertyCard
          key={indexInFiltered}
          row={row}
          itemIndex={indexInFiltered} // Pass the correct index
          isActive={indexInFiltered === selectedIndex}
          loading={loading}
          // Airbnb-style premium stagger
          style={!loading ? { animationDelay: `${delay}ms` } : undefined}
          onClick={onSelect}
        />
      )
      staggerIndex += 1
    })
  })
  
  return <>{elements}</>
}
