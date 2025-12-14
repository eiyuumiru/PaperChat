/**
 * useAutoDismiss hook
 * Custom hook to auto-dismiss error messages after a delay
 */

import { useEffect, type Dispatch, type SetStateAction } from 'react';

/**
 * Auto-dismisses a value after a delay by setting it to null
 * @param error - Error message to watch
 * @param setError - Function to clear the error
 * @param delay - Delay in milliseconds (default: 5000)
 */
export function useAutoDismiss(
    error: string | null,
    setError: Dispatch<SetStateAction<string | null>> | null,
    delay: number = 5000
): void {
    useEffect(() => {
        if (error && setError) {
            const timer = setTimeout(() => setError(null), delay);
            return () => clearTimeout(timer);
        }
    }, [error, setError, delay]);
}
