import { getMonthName } from '../../utils/dateUtils'

/**
 * Month separator component for displaying month dividers
 * @param {Object} props
 * @param {string} props.month - Month key (YYYY-MM format or 'FLEXIBLE')
 * @param {string} props.selectedMonth - Currently selected month filter ('all' or YYYY-MM format)
 * @returns {JSX.Element}
 */
export const MonthSeparator = ({ month, selectedMonth }) => {
  if (month === 'FLEXIBLE') {
    return (
      <div className="year-separator">
        <div className="year-separator-text">Flexible - Open to exchange</div>
      </div>
    )
  }

  const [year, monthNum] = month.split('-')
  const monthName = getMonthName(parseInt(monthNum))

  // If any month is selected (not "all"), show "STARTS IN X" for ALL separators
  if (selectedMonth !== 'all') {
    console.log('🗓️ MonthSeparator: Showing STARTS IN for month:', month, 'selectedMonth:', selectedMonth)
    return (
      <div className="year-separator">
        <div className="year-separator-text">STARTS IN {monthName.toUpperCase()}</div>
      </div>
    )
  }

  return (
    <div className="year-separator">
      <div className="year-separator-text">{monthName} {year}</div>
    </div>
  )
}
