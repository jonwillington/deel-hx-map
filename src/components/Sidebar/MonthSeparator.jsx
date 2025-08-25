import { getMonthName } from '../../utils/dateUtils'

/**
 * Month separator component for displaying month dividers
 * @param {Object} props
 * @param {string} props.month - Month key (YYYY-MM format or 'FLEXIBLE')
 * @returns {JSX.Element}
 */
export const MonthSeparator = ({ month }) => {
  if (month === 'FLEXIBLE') {
    return (
      <div className="year-separator">
        <div className="year-separator-text">Flexible - Open to exchange</div>
      </div>
    )
  }

  const [year, monthNum] = month.split('-')
  const monthName = getMonthName(parseInt(monthNum))

  return (
    <div className="year-separator">
      <div className="year-separator-text">{monthName} {year}</div>
    </div>
  )
}
