/**
 * Parse a date string in DD/MM/YY format
 * @param {string} dateStr - Date string in DD/MM/YY format
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseDate = (dateStr) => {
  if (!dateStr || dateStr.trim() === '') return null
  const parts = dateStr.trim().split('/')
  if (parts.length !== 3) return null
  const day = parseInt(parts[0])
  const month = parseInt(parts[1]) - 1 // JS months are 0-indexed
  let year = parseInt(parts[2])
  if (year < 100) year += 2000
  return new Date(year, month, day)
}

/**
 * Get the month key for a property (YYYY-MM format)
 * @param {Object} row - Property data row
 * @returns {string} Month key or 'FLEXIBLE' if no date
 */
export const getPropertyMonth = (row) => {
  // If property has a start date, use that month
  if (row.Start) {
    const start = parseDate(row.Start)
    if (start) {
      return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
    }
  }
  
  // If no start date, group under "FLEXIBLE"
  return 'FLEXIBLE'
}

/**
 * Format a date for popup display
 * @param {string} startDate - Start date string
 * @param {string} duration - Duration string
 * @returns {string} Formatted date string
 */
export const formatPopupDate = (startDate, duration) => {
  if (!startDate) return 'Flexible dates'
  
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr.trim() === '') return null
    const parts = dateStr.trim().split('/')
    if (parts.length !== 3) return null
    const day = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1
    let year = parseInt(parts[2])
    if (year < 100) year += 2000
    return new Date(year, month, day)
  }
  
  const start = parseDate(startDate)
  if (!start) return startDate
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthName = monthNames[start.getMonth()]
  const year = start.getFullYear()
  
  let result = `${monthName} ${year}`
  if (duration && duration.trim()) {
    result += ` • ${duration.trim()}`
  }
  
  return result
}

/**
 * Format a date as a readable string like "4th April 2025"
 * @param {string} dateStr - Date string in DD/MM/YY format
 * @returns {string} Formatted date string
 */
export const formatReadableDate = (dateStr) => {
  if (!dateStr) return 'Available'
  
  const date = parseDate(dateStr)
  if (!date) return dateStr
  
  const day = date.getDate()
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const monthName = monthNames[date.getMonth()]
  const year = date.getFullYear()
  
  // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinalSuffix = (n) => {
    if (n >= 11 && n <= 13) return 'th'
    switch (n % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }
  
  return `${day}${getOrdinalSuffix(day)} ${monthName} ${year}`
}

/**
 * Get abbreviated month name from month number
 * @param {number} monthNum - Month number (1-12)
 * @returns {string} Abbreviated month name
 */
export const getMonthName = (monthNum) => {
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return monthNames[monthNum - 1] || 'UNK'
}
