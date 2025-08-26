import { getPropertyMonth } from '../../utils/dateUtils'
import { MonthSeparator } from './MonthSeparator'
import { PropertyCard } from './PropertyCard'

/**
 * Property list component for displaying properties grouped by month (sublets) or flat list (exchanges)
 * @param {Object} props
 * @param {Array} props.filteredLocations - Array of filtered location data
 * @param {number} props.selectedIndex - Currently selected property index
 * @param {boolean} props.loading - Whether the app is in loading state
 * @param {string} props.selectedSegment - Current segment ('sublets' or 'exchanges')
 * @param {string} props.selectedMonth - Currently selected month filter ('all' or YYYY-MM format)
 * @param {Function} props.onSelect - Function to call when a property is selected
 * @returns {JSX.Element}
 */
export const PropertyList = ({ filteredLocations, selectedIndex, loading, selectedSegment, selectedMonth, onSelect }) => {
  const elements = []
  let staggerIndex = 0
  
  if (selectedSegment === 'exchanges') {
    // For exchanges: no month grouping, just show flat list
    filteredLocations.forEach((row, indexInFiltered) => {
      const groupIndex = Math.floor(staggerIndex / 3)
      const itemInGroup = staggerIndex % 3
      const baseDelay = groupIndex * 250 + itemInGroup * 120
      const delay = Math.min(baseDelay, 2500)
      
      elements.push(
        <PropertyCard
          key={indexInFiltered}
          row={row}
          itemIndex={indexInFiltered}
          isActive={indexInFiltered === selectedIndex}
          loading={loading}
          style={!loading ? { animationDelay: `${delay}ms` } : undefined}
          onClick={onSelect}
          segment={selectedSegment}
        />
      )
      staggerIndex += 1
    })
  } else {
    // For sublets: group by month
    const locationsByMonth = {}
    filteredLocations.forEach((row, originalIndex) => {
      const month = getPropertyMonth(row)
      if (!locationsByMonth[month]) {
        locationsByMonth[month] = []
      }
      locationsByMonth[month].push({ row, indexInFiltered: originalIndex })
    })
    
    // Sort months
    const months = Object.keys(locationsByMonth).sort((a, b) => {
      if (a === 'FLEXIBLE') return 1
      if (b === 'FLEXIBLE') return -1
      return a.localeCompare(b)
    })
    
    months.forEach(month => {
      // Add month header
      elements.push(
        <MonthSeparator key={`month-${month}`} month={month} selectedMonth={selectedMonth} />
      )
      
      // Add properties for this month
      locationsByMonth[month].forEach(({ row, indexInFiltered }) => {
        const groupIndex = Math.floor(staggerIndex / 3)
        const itemInGroup = staggerIndex % 3
        const baseDelay = groupIndex * 250 + itemInGroup * 120
        const delay = Math.min(baseDelay, 2500)
        
        elements.push(
          <PropertyCard
            key={indexInFiltered}
            row={row}
            itemIndex={indexInFiltered}
            isActive={indexInFiltered === selectedIndex}
            loading={loading}
            style={!loading ? { animationDelay: `${delay}ms` } : undefined}
            onClick={onSelect}
            segment={selectedSegment}
          />
        )
        staggerIndex += 1
      })
    })
  }
  
  return <>{elements}</>
}
