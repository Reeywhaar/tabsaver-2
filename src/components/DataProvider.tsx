import React, { createContext, FunctionComponent, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'
import { OutgoingMessageDescriptor, SavedSessionsDescriptor, SessionsDescriptor } from '@app/types'
import { sendRuntimeMessage } from '@app/utils/sendRuntimeMessage'
import { useEvent } from '@app/hooks/useEvent'

export type Data = {
  sessions: SessionsDescriptor
  storedSessions: SavedSessionsDescriptor
  br: typeof browser
}

type DataUpdateContext = {
  updateStoredSessions: (updater: (data: SavedSessionsDescriptor) => SavedSessionsDescriptor) => void
}

const DataContext = createContext<Data>({
  sessions: {
    windows: [],
    tabs: [],
  },
  storedSessions: {
    windows: [],
    tabs: [],
  },
  br: browser,
})

const DataUpdateProviderContext = createContext<DataUpdateContext>({
  updateStoredSessions: () => {},
})

export const DataProvider: FunctionComponent<PropsWithChildren<{ br: typeof browser }>> = ({ br, children }) => {
  const [data, setData] = useState<Data>({
    sessions: {
      windows: [],
      tabs: [],
    },
    storedSessions: {
      windows: [],
      tabs: [],
    },
    br: browser,
  })

  const updateStoredSessions = useEvent<DataUpdateContext['updateStoredSessions']>(updater => {
    setData(prev => {
      const newData = {
        ...prev,
        storedSessions: updater(prev.storedSessions),
      }
      sendRuntimeMessage(br, { type: 'updateStoredData', storedData: newData.storedSessions })
      return newData
    })
  })

  const updateContext = useMemo<DataUpdateContext>(
    () => ({
      updateStoredSessions,
    }),
    [updateStoredSessions]
  )

  useEffect(() => {
    const handler = (message: OutgoingMessageDescriptor) => {
      console.info('[tabsaver] [App] Incoming message', message)
      switch (message.type) {
        case 'update':
          setData({
            sessions: message.data,
            storedSessions: message.storedData,
            br: browser,
          })
      }
    }

    browser.runtime.onMessage.addListener(handler)

    sendRuntimeMessage(br, { type: 'getData' })

    return () => {
      browser.runtime.onMessage.removeListener(handler)
    }
  }, [br])

  return (
    <DataContext.Provider value={data}>
      <DataUpdateProviderContext.Provider value={updateContext}>{children}</DataUpdateProviderContext.Provider>
    </DataContext.Provider>
  )
}

export const useSessions = () => {
  return useContext(DataContext).sessions
}

export const useStoredSessions = () => {
  return useContext(DataContext).storedSessions
}

export const useDataUpdate = () => {
  return useContext(DataUpdateProviderContext)
}

export const useBrowser = () => {
  return useContext(DataContext).br
}
