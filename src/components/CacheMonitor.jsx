import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getMapboxCacheStats, clearGeocodingCache, invalidateGeocodingCache } from '../utils/geocodingCache'

/**
 * Development component for monitoring React Query cache performance
 * Shows cache statistics and provides cache management controls
 */
export const CacheMonitor = ({ geocodingStats = {}, show = true }) => {
  const queryClient = useQueryClient()
  const [cacheStats, setCacheStats] = useState({})
  const [isExpanded, setIsExpanded] = useState(false)

  // Update cache stats every 5 seconds (silently for UI updates)
  useEffect(() => {
    const updateStats = () => {
      const newStats = getMapboxCacheStats(queryClient, true) // Silent mode
      setCacheStats(newStats)
    }
    
    updateStats() // Initial update
    const interval = setInterval(updateStats, 5000) // Increased to 5 seconds
    
    return () => clearInterval(interval)
  }, [queryClient])

  const handleClearCache = () => {
    console.log('🧹 Clearing geocoding cache via CacheMonitor')
    clearGeocodingCache(queryClient)
    setCacheStats(getMapboxCacheStats(queryClient, false)) // Log when manually triggered
  }

  const handleInvalidateCache = () => {
    console.log('🔄 Invalidating geocoding cache via CacheMonitor')
    invalidateGeocodingCache(queryClient)
  }

  if (!show) return null

  return (
    <div 
      className="cache-monitor"
      style={{
        position: 'fixed',
        top: '10px',
        left: '320px', // After sidebar
        backgroundColor: 'var(--color-bg-card-light)',
        border: '1px solid var(--color-border-primary-light)',
        borderRadius: '8px',
        padding: isExpanded ? '16px' : '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 10000,
        minWidth: '200px',
        boxShadow: '0 4px 12px var(--color-shadow-md-light)',
        transition: 'all 0.3s ease'
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: isExpanded ? '12px' : '0'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <strong style={{ color: 'var(--color-text-primary-light)' }}>
          💾 Cache Monitor
        </strong>
        <span style={{ color: 'var(--color-text-secondary-light)' }}>
          {isExpanded ? '−' : '+'}
        </span>
      </div>
      
      {isExpanded && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary-light)', marginBottom: '4px' }}>
              🗃️ Cache Statistics
            </div>
            <div style={{ color: 'var(--color-text-secondary-light)' }}>
              Total Cached: <span style={{ color: 'var(--color-success-light)' }}>{cacheStats.totalCached || 0}</span>
            </div>
            <div style={{ color: 'var(--color-text-secondary-light)' }}>
              Active: <span style={{ color: 'var(--color-primary-light)' }}>{cacheStats.activeQueries || 0}</span>
            </div>
            <div style={{ color: 'var(--color-text-secondary-light)' }}>
              Successful: <span style={{ color: 'var(--color-success-light)' }}>{cacheStats.successQueries || 0}</span>
            </div>
            <div style={{ color: 'var(--color-text-secondary-light)' }}>
              Errors: <span style={{ color: 'var(--color-danger-light)' }}>{cacheStats.errorQueries || 0}</span>
            </div>
            <div style={{ color: 'var(--color-text-secondary-light)' }}>
              Est. API Calls Saved: <span style={{ color: 'var(--color-accent-green-light)' }}>{Math.round(cacheStats.estimatedAPICallsSaved || 0)}</span>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary-light)', marginBottom: '4px' }}>
              📊 Geocoding Statistics
            </div>
            <div style={{ color: 'var(--color-text-secondary-light)' }}>
              Total Locations: <span style={{ color: 'var(--color-text-primary-light)' }}>{geocodingStats.total || 0}</span>
            </div>
            <div style={{ color: 'var(--color-text-secondary-light)' }}>
              Loading: <span style={{ color: 'var(--color-warning-light)' }}>{geocodingStats.loading || 0}</span>
            </div>
            <div style={{ color: 'var(--color-text-secondary-light)' }}>
              Success: <span style={{ color: 'var(--color-success-light)' }}>{geocodingStats.success || 0}</span>
            </div>
            <div style={{ color: 'var(--color-text-secondary-light)' }}>
              Cached: <span style={{ color: 'var(--color-primary-light)' }}>{geocodingStats.cached || 0}</span>
            </div>
            <div style={{ color: 'var(--color-text-secondary-light)' }}>
              Completion: <span style={{ color: 'var(--color-accent-green-light)' }}>{geocodingStats.completionPercentage || 0}%</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleInvalidateCache}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '1px solid var(--color-border-primary-light)',
                borderRadius: '4px',
                backgroundColor: 'var(--color-primary-light)',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleClearCache}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '1px solid var(--color-border-primary-light)',
                borderRadius: '4px',
                backgroundColor: 'var(--color-danger-light)',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🧹 Clear
            </button>
          </div>
        </>
      )}
    </div>
  )
}