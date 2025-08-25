import { useState, useEffect } from 'react'

const CORRECT_PASSWORD = 'letmein!' // You can change this to whatever password you want
const STORAGE_KEY = 'app_authenticated'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user was previously authenticated
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const authenticate = (password) => {
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem(STORAGE_KEY, 'true')
      return { success: true }
    } else {
      return { success: false, error: 'Incorrect password. Please try again.' }
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  const toggleAuth = () => {
    if (isAuthenticated) {
      logout()
    } else {
      setIsAuthenticated(true)
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }

  return {
    isAuthenticated,
    isLoading,
    authenticate,
    logout,
    toggleAuth
  }
}