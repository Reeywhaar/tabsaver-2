import React, { FunctionComponent } from 'react'
import { createRoot } from 'react-dom/client'
import { DataProvider, useDataUpdate, useSessions, useStoredSessions } from './components/DataProvider'
import { useEvent } from './hooks/useEvent'

function main() {
  const root = createRoot(document.getElementsByClassName('main')[0])
  root.render(<App />)
}

const App: FunctionComponent = () => {
  return (
    <DataProvider br={browser}>
      <Diagnostics />
    </DataProvider>
  )
}

const Diagnostics: FunctionComponent = () => {
  const data = useSessions()
  const storedData = useStoredSessions()
  const { updateStoredSessions } = useDataUpdate()

  const handleImport = useEvent(() => {
    updateStoredSessions(_data => ({
      windows: [
        {
          title: 'Saved window',
          session_id: '123',
        },
      ],
      tabs: [
        {
          id: '123',
          index: 0,
          window_session_id: '123',
          url: 'https://example.com',
          title: 'Example',
        },
      ],
    }))
  })

  return (
    <div>
      <h1>Diagnostics</h1>
      <p>Import data</p>
      <div>
        <button onClick={handleImport}>Import data</button>
      </div>
      <p>Some diagnostic information</p>
      <div>
        <code style={{ whiteSpace: 'pre', fontSize: '0.8rem' }}>{JSON.stringify({ data, storedData }, null, 2)}</code>
      </div>
    </div>
  )
}

main()
