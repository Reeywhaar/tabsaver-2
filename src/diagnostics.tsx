import React, { FunctionComponent } from 'react'
import { createRoot } from 'react-dom/client'
import { DataProvider, useSessions } from './components/DataProvider'

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
  const { windows, tabs } = useSessions()

  return (
    <div>
      <h1>Diagnostics</h1>
      <p>Some diagnostic information</p>
      <div>
        <code style={{ whiteSpace: 'pre', fontSize: '0.8rem' }}>{JSON.stringify({ windows, tabs }, null, 2)}</code>
      </div>
    </div>
  )
}

main()
