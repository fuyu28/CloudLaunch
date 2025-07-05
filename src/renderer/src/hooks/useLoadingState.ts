import { useState, useCallback } from "react"
import { useToastHandler, executeWithToast, type ToastOptions } from "./useToastHandler"

export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export function useLoadingState(initialLoading = false): {
  isLoading: boolean
  error: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
  executeWithLoading: <T>(asyncFn: () => Promise<T>, options?: ToastOptions) => Promise<T | null>
} {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null
  })
  const toastHandler = useToastHandler()

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }))
  }, [])

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null })
  }, [])

  const executeWithLoading = useCallback(
    async <T>(asyncFn: () => Promise<T>, options?: ToastOptions): Promise<T | null> => {
      try {
        setLoading(true)
        setError(null)

        const result = await executeWithToast(asyncFn, options || {}, toastHandler)
        return result
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        setError(errorMsg)
        return null
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError, toastHandler]
  )

  return {
    ...state,
    setLoading,
    setError,
    reset,
    executeWithLoading
  }
}
