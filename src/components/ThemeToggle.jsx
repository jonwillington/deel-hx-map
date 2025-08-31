import { useTheme } from '../contexts/ThemeContext'

export const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb">
          {isDarkMode ? (
            // Moon icon - currently in dark mode
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8.59 8.59 0 0 1 .25-2A1 1 0 0 0 8 2.36a10.14 10.14 0 1 0 14 11.69 1 1 0 0 0-.36-1.05z"/>
            </svg>
          ) : (
            // Sun icon - currently in light mode
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="4" fill="currentColor"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M17.36 17.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M17.36 6.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </div>
      </div>
    </button>
  )
}