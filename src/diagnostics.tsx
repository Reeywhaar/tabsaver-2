import React, { FunctionComponent } from 'react'
import { createRoot } from 'react-dom/client'
import { DataProvider, useBrowser, useDataUpdate, useSessions, useStoredSessions } from './components/DataProvider'
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
  const browser = useBrowser()
  const data = useSessions()
  const storedData = useStoredSessions()
  const { updateStoredSessions } = useDataUpdate()

  const handleImport = useEvent(() => {
    updateStoredSessions(_data => ({
      windows: [
        {
          title: 'Saved window',
          session_id: 'savedwindow',
        },
        {
          title: 'Another saved window',
          session_id: 'anothersavedwindow',
        },
      ],
      tabs: [
        {
          id: 'savedwindow:1',
          index: 0,
          window_session_id: 'savedwindow',
          url: 'https://example.com',
          title: 'Example',
        },
        {
          id: 'savedwindow:2',
          index: 1,
          window_session_id: 'savedwindow',
          url: 'https://vyrtsev.com',
          title: 'Vyrtsev',
        },
        {
          id: 'anothersavedwindow:1',
          index: 0,
          window_session_id: 'anothersavedwindow',
          url: 'https://ya.ru',
          title: 'Yandex',
        },
        {
          id: 'anothersavedwindow:2',
          index: 1,
          window_session_id: 'anothersavedwindow',
          url: 'https://vyrtsev.com',
          title: 'Vyrtsev',
        },
      ],
    }))
  })

  const handleOpenTestWindows = useEvent(() => {
    browser.windows.create({
      url: [
        //
        'https://example.com',
        'https://ya.ru',
        'https://google.com',
        'https://wikipedia.org',
      ],
    })

    browser.windows.create({
      url: [
        //
        'https://vyrtsev.com',
        'https://ya.ru',
        'https://google.com',
        'https://wikipedia.org',
      ],
    })
  })

  return (
    <div>
      <h1>Diagnostics</h1>
      <section>
        <p>Import data</p>
        <div>
          <button onClick={handleImport}>Import data</button>
        </div>
      </section>
      <section>
        <p>Open test windows</p>
        <div>
          <button onClick={handleOpenTestWindows}>Open test windows</button>
        </div>
      </section>
      <section>
        <p>Some diagnostic information</p>
        <div>
          <code style={{ whiteSpace: 'pre', fontSize: '0.8rem' }}>{JSON.stringify({ data, storedData }, null, 2)}</code>
        </div>
      </section>
    </div>
  )
}

main()
