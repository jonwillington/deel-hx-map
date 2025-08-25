import { useState } from 'react'
import './DevTools.css'

export function DevTools({ onLogout, onToggleAuth }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div 
        className={`dev-tools-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Dev Tools"
      >
        ⚙️
      </div>
      
      {isOpen && (
        <div className="dev-tools-panel">
          <div className="dev-tools-header">
            <h4>Dev Tools</h4>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="dev-tools-content">
            <button 
              className="dev-btn logout-btn"
              onClick={onLogout}
            >
              🚪 Logout
            </button>
            
            <button 
              className="dev-btn auth-btn"
              onClick={onToggleAuth}
            >
              🔓 Toggle Auth
            </button>
            
            <div className="dev-info">
              <small>Quick dev actions</small>
            </div>
          </div>
        </div>
      )}
    </>
  )
}