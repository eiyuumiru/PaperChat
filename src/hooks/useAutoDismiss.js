import { useEffect } from 'react'

/**
 * Custom hook to auto-dismiss error messages after a delay
 * @param {string|null} error - Error message to watch
 * @param {Function} setError - Function to clear the error
 * @param {number} delay - Delay in milliseconds (default: 5000)
 */
export function useAutoDismiss(error, setError, delay = 5000) {
  useEffect(() => {
    if (error && setError) {
      const timer = setTimeout(() => setError(null), delay)
      return () => clearTimeout(timer)
    }
  }, [error, setError, delay])
}