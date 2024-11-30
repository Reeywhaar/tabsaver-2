import React from 'react'
import { useNotification } from '@app/components/Notifications/NotificationsContext'
import { useEvent } from './useEvent'
import { asError } from '@app/utils/asError'

export const useShowError = () => {
  const notify = useNotification()

  return useEvent((error: unknown, timeout = 5000) => {
    const ctx = notify(_ctx => ({
      level: 'error',
      description: (
        <React.Fragment>
          {extractMessage(asError(error))
            .split('\n')
            .map((m, i) => (
              <div key="i">
                {i > 0 ? 'Cause: ' : null}
                {m}
              </div>
            ))}
        </React.Fragment>
      ),
    }))

    setTimeout(() => {
      ctx.close()
    }, timeout)
  })
}

const extractMessage = (error: Error) => {
  const strings = [error.message]
  if (error.cause) strings.push(extractMessage(asError(error.cause)))
  return strings
    .map(s => s.trim())
    .filter(s => !!s)
    .join('\n')
}

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
