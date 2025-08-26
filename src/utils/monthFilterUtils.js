import { parseDate } from './dateUtils'

/**
 * Check if a property's availability overlaps with a target month
 * @param {Object} row - Property data row
 * @param {string} targetMonthKey - Target month in YYYY-MM format
 * @returns {boolean} Whether the property overlaps with the target month
 */
export const propertyOverlapsMonth = (row, targetMonthKey) => {
  if (!targetMonthKey || targetMonthKey === 'all') return true
  
  
  // Get target month start and end dates
  const [year, month] = targetMonthKey.split('-').map(Number)
  const targetMonthStart = new Date(year, month - 1, 1)
  const targetMonthEnd = new Date(year, month, 0) // Last day of month
  
  // Parse property start date
  const startDate = parseDate(row.Start)
  if (!startDate) {
    // If no start date, it's flexible - exclude when specific month is selected
    return false
  }
  
  // For properties with duration, calculate end date
  let endDate = null
  const duration = row['Duration '] || row.Duration || row.duration || ''
  
  if (duration && duration.trim()) {
    const durationText = duration.trim().toLowerCase()
    let durationMonths = 1 // Default to 1 month
    
    // Parse common duration patterns
    if (durationText.includes('week')) {
      const weeks = parseFloat(durationText) || 1
      durationMonths = weeks / 4.33 // Approximate weeks to months
    } else if (durationText.includes('month')) {
      durationMonths = parseFloat(durationText) || 1
    } else if (durationText.includes('year')) {
      const years = parseFloat(durationText) || 1
      durationMonths = years * 12
    } else if (durationText.includes('night')) {
      const nights = parseFloat(durationText) || 1
      durationMonths = nights / 30.44 // Convert nights to months
    } else if (durationText.includes('day')) {
      const days = parseFloat(durationText) || 30
      durationMonths = days / 30.44 // Approximate days to months
    }
    
    // Calculate end date
    endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + durationMonths)
  } else {
    // If no duration specified, assume at least 1 month
    endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 1)
  }
  
  
  // Check if property period overlaps with target month
  // Property overlaps if: start <= targetMonthEnd AND end >= targetMonthStart
  return startDate <= targetMonthEnd && endDate >= targetMonthStart
}

/**
 * Filter locations by month availability
 * @param {Array} locations - Array of location data
 * @param {string} selectedMonth - Selected month filter ('all' or YYYY-MM format)
 * @returns {Array} Filtered locations
 */
export const filterLocationsByMonth = (locations, selectedMonth) => {
  if (!locations || locations.length === 0) return []
  if (!selectedMonth || selectedMonth === 'all') return locations
  
  return locations.filter(location => propertyOverlapsMonth(location, selectedMonth))
}
