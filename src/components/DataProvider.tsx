import React, { createContext, FunctionComponent, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { OutgoingMessageDescriptor, SavedSessionsDescriptor, SessionsDescriptor } from '@app/types'
import { sendRuntimeMessage } from '@app/utils/sendRuntimeMessage'

export type Data = {
  sessions: SessionsDescriptor
  storedSessings: SavedSessionsDescriptor
  br: typeof browser
}

const DataProviderContext = createContext<Data>({
  sessions: {
    windows: [],
    tabs: [],
  },
  storedSessings: {
    windows: [],
    tabs: [],
  },
  br: browser,
})

export const DataProvider: FunctionComponent<PropsWithChildren<{ br: typeof browser }>> = ({ br, children }) => {
  const [data, setData] = useState<Data>({
    sessions: {
      windows: [],
      tabs: [],
    },
    storedSessings: {
      windows: [],
      tabs: [],
    },
    br: browser,
  })

  useEffect(() => {
    sendRuntimeMessage(br, { type: 'getData' })
    const handler = (message: OutgoingMessageDescriptor) => {
      console.info('[tabsaver] [App] Incoming message', message)
      switch (message.type) {
        case 'update':
          setData({
            sessions: message.data,
            storedSessings: message.storedData,
            br: browser,
          })
      }
    }

    browser.runtime.onMessage.addListener(handler)

    return () => {
      browser.runtime.onMessage.removeListener(handler)
    }
  }, [br])

  return <DataProviderContext.Provider value={data}>{children}</DataProviderContext.Provider>
}

export const useSessions = () => {
  return useContext(DataProviderContext).sessions
}

export const useStoredSessions = () => {
  return useContext(DataProviderContext).storedSessings
}

export const useBrowser = () => {
  return useContext(DataProviderContext).br
}
