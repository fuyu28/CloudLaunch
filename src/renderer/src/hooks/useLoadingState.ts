import { useState, useCallback } from "react"
import toast from "react-hot-toast"

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
  executeWithLoading: <T>(
    asyncFn: () => Promise<T>,
    options?: {
      loadingMessage?: string
      successMessage?: string
      errorMessage?: string
      showToast?: boolean
    }
  ) => Promise<T | null>
} {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null
  })

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
    async <T>(
      asyncFn: () => Promise<T>,
      options?: {
        loadingMessage?: string
        successMessage?: string
        errorMessage?: string
        showToast?: boolean
      }
    ): Promise<T | null> => {
      const { loadingMessage, successMessage, errorMessage, showToast = true } = options || {}

      let toastId: string | undefined

      try {
        setLoading(true)
        setError(null)

        if (showToast && loadingMessage) {
          toastId = toast.loading(loadingMessage)
        }

        const result = await asyncFn()

        if (showToast) {
          if (successMessage) {
            if (toastId) {
              toast.success(successMessage, { id: toastId })
            } else {
              toast.success(successMessage)
            }
          } else if (toastId) {
            toast.dismiss(toastId)
          }
        }

        return result
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        setError(errorMsg)

        if (showToast) {
          const displayMessage = errorMessage || errorMsg
          if (toastId) {
            toast.error(displayMessage, { id: toastId })
          } else {
            toast.error(displayMessage)
          }
        }

        return null
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError]
  )

  return {
    ...state,
    setLoading,
    setError,
    reset,
    executeWithLoading
  }
}
