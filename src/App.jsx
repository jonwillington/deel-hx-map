import { useState } from 'react'
import { useLocations } from './hooks/useLocations'
import { useFilteredLocations } from './hooks/useFilteredLocations'
import { useMap } from './hooks/useMap'
import { Sidebar } from './components/Sidebar/Sidebar'
import { MapComponent } from './components/Map/MapComponent'
import { PremiumCard } from './components/PremiumCard'
import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'

function App() {
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showPremiumCard, setShowPremiumCard] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [selectedSegment, setSelectedSegment] = useState('sublets')

  // Custom hooks
  const { locations, loading, error, showSkeletons } = useLocations()
  const filteredLocations = useFilteredLocations(locations, selectedSegment)
  
  // Handle property selection
  function handleSelect(index) {
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
  const { mapContainerRef, handleLocationSelect } = useMap(filteredLocations, handleSelect)

  // Handle segment change
  const handleSegmentChange = (segment) => {
    setSelectedSegment(segment)
    setSelectedIndex(-1)
    setShowPremiumCard(false)
    setCurrentLocation(null)
  }

  // Handle premium card close
  const handlePremiumCardClose = () => {
    setShowPremiumCard(false)
      setSelectedIndex(-1)
      setCurrentLocation(null)
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <Sidebar 
        filteredLocations={filteredLocations}
        selectedIndex={selectedIndex}
        loading={loading}
        showSkeletons={showSkeletons}
        selectedSegment={selectedSegment}
        onSelect={handleSelect}
        onSegmentChange={handleSegmentChange}
      />

      <MapComponent 
        locations={filteredLocations}
        onLocationSelect={handleSelect}
        loading={loading}
        error={error}
        mapRef={mapContainerRef}
      />
      
      {showPremiumCard && (
        <PremiumCard 
          location={currentLocation} 
          onClose={handlePremiumCardClose}
        />
      )}
    </div>
  )
}

export default App