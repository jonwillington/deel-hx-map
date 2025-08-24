/**
 * Segmented control component for switching between sublets and exchange
 * @param {Object} props
 * @param {string} props.selectedSegment - Currently selected segment
 * @param {Function} props.onSegmentChange - Function to call when segment changes
 * @returns {JSX.Element}
 */
export const SegmentedControl = ({ selectedSegment, onSegmentChange }) => {
  return (
    <div className="segmented-control">
      <button 
        className={`segment-button ${selectedSegment === 'sublets' ? 'active' : ''}`}
        onClick={() => onSegmentChange('sublets')}
      >
        Sublet
      </button>
      <button 
        className={`segment-button ${selectedSegment === 'exchange' ? 'active' : ''}`}
        onClick={() => onSegmentChange('exchange')}
      >
        Exchange
      </button>
    </div>
  )
}
