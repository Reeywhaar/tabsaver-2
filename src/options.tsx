import React from 'react'
import { createRoot } from 'react-dom/client'
import { Options } from './components/Options/Options'
import { DataProvider } from './components/DataProvider'

function main() {
  const root = createRoot(document.getElementsByClassName('main')[0])
  root.render(
    <DataProvider br={browser}>
      <Options />
    </DataProvider>
  )
}

main()
