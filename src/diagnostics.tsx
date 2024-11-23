import React, { FunctionComponent } from 'react'
import { createRoot } from 'react-dom/client'
import { DataProvider, useBrowser, useDataUpdate, useSessions, useStoredSessions } from './components/DataProvider'
import { useEvent } from './hooks/useEvent'
import { NotificationProvider, useNotification } from './components/Notifications/NotificationsContext'
import { SavedTabDescriptor, SavedWindowDescriptor } from './types'
import { v4 } from 'uuid'

function main() {
  const root = createRoot(document.getElementsByClassName('main')[0])
  root.render(<App />)
}

const App: FunctionComponent = () => {
  return (
    <DataProvider br={browser}>
      <NotificationProvider>
        <Diagnostics />
      </NotificationProvider>
    </DataProvider>
  )
}

const Diagnostics: FunctionComponent = () => {
  const browser = useBrowser()
  const data = useSessions()
  const storedData = useStoredSessions()
  const { updateStoredSessions } = useDataUpdate()

  const notify = useNotification()

  const handleImport = useEvent(() => {
    const words = ['horse', 'battery', 'staple', 'correct', 'summon', 'triest', 'bold', 'marrow', 'system']
    const urls = [
      'https://example.com',
      'https://ya.ru',
      'https://google.com',
      'https://wikipedia.org',
      'https://vyrtsev.com',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://facebook.com',
      'https://vk.com',
      'https://instagram.com',
      'https://twitter.com',
      'https://reddit.com',
    ]

    const windows: SavedWindowDescriptor[] = new Array(15).fill(null).map(() => ({
      session_id: v4(),
      title: new Array(5)
        .fill(0)
        .map(() => words[Math.floor(Math.random() * words.length)])
        .join(' '),
    }))

    const tabs = windows.flatMap(w =>
      new Array(5 + Math.floor(Math.random() * 20)).fill(null).map(
        (_, i): SavedTabDescriptor => ({
          id: `${w.session_id}:${i}`,
          index: i,
          session_id: w.session_id,
          url: urls[Math.floor(Math.random() * urls.length)],
          title: '',
        })
      )
    )

    updateStoredSessions(_data => ({
      windows,
      tabs,
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

  const openInfoNotification = useEvent(() => {
    const ctx = notify(_ctx => ({
      level: 'info',
      description: 'This is an info notification',
    }))

    setTimeout(() => {
      ctx.close()
    }, 3000)
  })

  const openErrorNotification = useEvent(() => {
    const ctx = notify(_ctx => ({
      level: 'error',
      description: 'This is an error notification',
    }))

    setTimeout(() => {
      ctx.close()
    }, 3000)
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
        <p>Notifications</p>
        <div>
          <button onClick={openInfoNotification}>Open info notification</button>
          <button onClick={openErrorNotification}>Open Error notification</button>
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
