import { FunctionComponent, useEffect } from 'react'
import { useBrowser } from '../DataProvider'
import { OutgoingMessageDescriptor } from '@app/types'
import { assertNever } from '@app/utils/assertNever'
import { useShowError } from '@app/hooks/useShowError'

export const ErrorListener: FunctionComponent = () => {
  const browser = useBrowser()
  const showError = useShowError()

  useEffect(() => {
    const handler = (message: OutgoingMessageDescriptor) => {
      console.info('[tabsaver] [App] Incoming message', message)
      switch (message.type) {
        case 'error':
          showError(new Error(message.message))
          break
        case 'update':
          break
        default:
          assertNever(message)
      }
    }

    return () => {
      browser.runtime.onMessage.removeListener(handler)
    }
  }, [browser.runtime.onMessage, showError])

  return null
}
