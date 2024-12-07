import React from 'react'
import { createRoot } from 'react-dom/client'
import { Options } from './components/Options/Options'
import { DataProvider } from './components/DataProvider'
import { NotificationProvider } from './components/Notifications/NotificationsContext'

import '@app/styles/colors.css'

function main() {
  const root = createRoot(document.getElementsByClassName('main')[0])
  root.render(
    <DataProvider br={browser}>
      <NotificationProvider>
        <Options />
      </NotificationProvider>
    </DataProvider>
  )
}

main()
