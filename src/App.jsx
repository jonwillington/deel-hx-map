import { useState } from 'react'
import { useLocations } from './hooks/useLocations'
import { useFilteredLocations } from './hooks/useFilteredLocations'
import { useMap } from './hooks/useMap'
import { useAuth } from './hooks/useAuth'
import { Sidebar } from './components/Sidebar/Sidebar'
import { MapComponent } from './components/Map/MapComponent'
import { PremiumCard } from './components/PremiumCard'
import { PasswordPage } from './components/PasswordPage'
import { DevTools } from './components/DevTools'
import { getImageEmbedInstructions } from './utils/imageUtils'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'flag-icons/css/flag-icons.min.css'
import './App.css'

function App() {
  const { isAuthenticated, isLoading, authenticate, logout, toggleAuth } = useAuth()
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showPremiumCard, setShowPremiumCard] = useState(false)
  const [isClosingPremiumCard, setIsClosingPremiumCard] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [selectedSegment, setSelectedSegment] = useState('sublets')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Custom hooks - pass selectedSegment to dynamically fetch correct sheet
  const { locations, loading, error, showSkeletons } = useLocations(selectedSegment)
  const filteredLocations = useFilteredLocations(locations, selectedSegment, selectedMonth)
  
  // Handle property selection
  function handleSelect(index) {
    // If clicking the already selected item, close the drawer
    if (selectedIndex === index && showPremiumCard) {
      handlePremiumCardClose()
      return
    }

    setSelectedIndex(index)
    
    if (index >= 0 && index < filteredLocations.length) {
      const location = filteredLocations[index]
      setCurrentLocation(location)
      setShowPremiumCard(true) // Always show detail sheet when item is selected
      
      // Trigger map movement to the selected location
      handleLocationSelect(index)
    } else {
      setShowPremiumCard(false)
      setCurrentLocation(null)
    }
  }

  // Map hook - must be after handleSelect is defined
  const { mapContainerRef, handleLocationSelect, refreshMarkers } = useMap(filteredLocations, handleSelect, loading)

  // Handle segment change
  const handleSegmentChange = (segment) => {
    setSelectedSegment(segment)
    setSelectedIndex(-1)
    setShowPremiumCard(false)
    setCurrentLocation(null)
    setSelectedMonth('all') // Reset month filter when changing segments
  }

  // Handle month filter change
  const handleMonthChange = (month) => {
    setSelectedMonth(month)
    setSelectedIndex(-1)
    setShowPremiumCard(false)
    setCurrentLocation(null)
  }

  // Handle premium card close with animation
  const handlePremiumCardClose = () => {
    setIsClosingPremiumCard(true)
    setTimeout(() => {
      setShowPremiumCard(false)
      setIsClosingPremiumCard(false)
      setSelectedIndex(-1)
      setCurrentLocation(null)
    }, 300) // Match the animation duration
  }

  // Handle password submission
  const handlePasswordSubmit = (password) => {
    const result = authenticate(password)
    if (!result.success) {
      setPasswordError(result.error)
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>
  }

  // Show password page if not authenticated
  if (!isAuthenticated) {
    return <PasswordPage onPasswordSubmit={handlePasswordSubmit} error={passwordError} />
  }

  return (
    <>
      {/* Mobile message for screens < 600px */}
      <div className="mobile-message">
        <h2>Currently only supported on Desktop!</h2>
        <p>Please visit this site on a desktop or laptop computer for the best experience.</p>
      </div>

      <div style={{ height: '100vh', width: '100vw' }}>
        <Sidebar 
          filteredLocations={filteredLocations}
          selectedIndex={selectedIndex}
          loading={loading}
          showSkeletons={showSkeletons}
          selectedSegment={selectedSegment}
          selectedMonth={selectedMonth}
          onSelect={handleSelect}
          onSegmentChange={handleSegmentChange}
          onMonthChange={handleMonthChange}
        />

        <MapComponent 
          locations={filteredLocations}
          onLocationSelect={handleSelect}
          loading={loading}
          error={error}
          mapRef={mapContainerRef}
          segment={selectedSegment}
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          refreshMarkers={refreshMarkers}
        />
        
        {(showPremiumCard || isClosingPremiumCard) && (
          <PremiumCard 
            location={currentLocation} 
            onClose={handlePremiumCardClose}
            isClosing={isClosingPremiumCard}
            segment={selectedSegment}
            rowIndex={selectedIndex}
          />
        )}
        
        <DevTools onLogout={logout} onToggleAuth={toggleAuth} />
      </div>

      {/* Create Listing Modal - Rendered at root level */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-listing-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowCreateModal(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            {/* Banner image */}
            <div className="create-listing-banner">
              <img src="/img/banner.jpg" alt="Create listing banner" />
            </div>
            
            <div className="modal-body">
              <h3>To create a listing,<br />follow these steps</h3>
              
              <div className="create-listing-steps">
                <div className="create-listing-step">
                  <div className="step-number">1</div>
                  <div className="step-content">Request access to sheet</div>
                </div>
                
                <div className="create-listing-step">
                  <div className="step-number">2</div>
                  <div className="step-content">Add your details to the row</div>
                </div>
                
                <div className="create-listing-step">
                  <div className="step-number">3</div>
                  <div className="step-content">For photos: Send image to yourself on Slack → Copy image URL → Paste in Photo cell</div>
                </div>
                
                <div className="create-listing-step">
                  <div className="step-number">4</div>
                  <div className="step-content">If the property is no longer active, delete the row at any time</div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="premium-card-interest-button"
                onClick={() => {
                  window.open('https://docs.google.com/spreadsheets/d/14YSy-w-db4rqXa1nHyaPZCVp7Qcd3UcOBJOqfZXENdo/edit?usp=sharing', '_blank')
                }}
              >
                Open Google Sheet
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '8px' }}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15,3 21,3 21,9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App