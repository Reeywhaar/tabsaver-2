import { useNotification } from '@app/components/Notifications/NotificationsContext'
import { useEvent } from './useEvent'
import { asError } from '@app/utils/asError'

export const useShowError = () => {
  const notify = useNotification()

  return useEvent((error: unknown, timeout = 5000) => {
    const ctx = notify(_ctx => ({
      level: 'error',
      description: extractMessage(asError(error)),
    }))

    setTimeout(() => {
      ctx.close()
    }, timeout)
  })
}

const extractMessage = (error: Error) => error.message

export const useWithErrorHandling = () => {
  const showError = useShowError()

  return useEvent(<T extends (...args: any[]) => any>(fn: T) => {
    return (async (...args: Parameters<T>) => {
      try {
        await fn(...args)
      } catch (e) {
        showError(e)
      }
    }) as (...args: Parameters<T>) => void
  })
}
