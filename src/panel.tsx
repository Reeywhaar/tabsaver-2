import { App } from '@app/components/App/App'
import React from 'react'
import { createRoot } from 'react-dom/client'

import '@app/styles/colors.css'

function main() {
  const root = createRoot(document.getElementsByClassName('main')[0])
  root.render(<App />)
}

main()
