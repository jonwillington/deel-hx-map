/**
 * Month filter component for filtering properties by availability periods
 * @param {Object} props
 * @param {string} props.selectedMonth - Currently selected month filter ('all' or YYYY-MM format)
 * @param {Function} props.onMonthChange - Function to call when month changes
 * @returns {JSX.Element}
 */
export const MonthFilter = ({ selectedMonth, onMonthChange }) => {
  // Generate next 12 months starting from current month
  const generateMonthOptions = () => {
    const options = [{ value: 'all', label: 'All' }]
    const now = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const monthKey = `${year}-${String(month).padStart(2, '0')}`
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthName = monthNames[date.getMonth()]
      const label = `${monthName} ${year}`
      
      options.push({ value: monthKey, label })
    }
    
    return options
  }

  const monthOptions = generateMonthOptions()

  return (
    <div className="month-filter">
      <div className="select-wrapper">
        <select 
          className="month-filter-select"
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
        >
          {monthOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
