'use client'

import { toast } from 'sonner'
import type { ActionResponse } from '@/types'

// Generic type parameter (Placeholder type) defaults to void if you don't provide one
type ActionToastOptions<T = void> = {
  loading: string
  success?:
    | string
    | ((response: Extract<ActionResponse<T>, { ok: true }>) => string)
  error?:
    | string
    | ((response: Extract<ActionResponse<T>, { ok: false }>) => string)
}

export async function runActionWithToast<T = void>(
  actionPromise: Promise<ActionResponse<T>>,
  options: ActionToastOptions<T>,
): Promise<ActionResponse<T>> {
  const toastId = toast.loading(options.loading)

  try {
    const response = await actionPromise

    if (response.ok) {
      const successMessage =
        typeof options.success === 'function'
          ? options.success(response)
          : (options.success ?? response.message ?? 'Success')
      toast.success(successMessage, { id: toastId })
      return response
    }

    const errorMessage =
      typeof options.error === 'function'
        ? options.error(response)
        : (options.error ?? response.message)
    toast.error(errorMessage, { id: toastId })
    return response
  } catch (error) {
    const fallbackErrorMessage =
      typeof options.error === 'string' ? options.error : 'Something went wrong'
    const errorMessage =
      error instanceof Error && error.message.length > 0
        ? error.message
        : fallbackErrorMessage
    toast.error(errorMessage, { id: toastId })
    return { ok: false, message: errorMessage }
  }
}
