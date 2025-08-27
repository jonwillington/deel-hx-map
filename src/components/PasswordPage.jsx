import { useState } from 'react'
import './PasswordPage.css'

export function PasswordPage({ onPasswordSubmit, error: externalError }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password.trim()) {
      onPasswordSubmit(password.trim())
    }
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    if (error) setError('')
  }

  const displayError = externalError || error

  return (
    <>
      {/* Mobile message for screens < 600px */}
      <div className="mobile-message">
        <h2>Currently only supported on Desktop!</h2>
        <p>Please visit this site on a desktop or laptop computer for the best experience.</p>
      </div>

      <div className="password-page">
        <div className="password-container">
        <div className="password-form">
          <img src="/img/lock.svg" alt="Lock icon" className="password-lock-icon" />
          <h2>Got a password?</h2>
          <p>Please enter the password to access the application.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Password"
                className={displayError ? 'error' : ''}
                autoFocus
              />
              {displayError && <div className="error-message">{displayError}</div>}
            </div>
            
            <button type="submit" className="premium-card-interest-button">
              Let me in!
            </button>
          </form>
        </div>
        </div>
      </div>
    </>
  )
}