import React, { FunctionComponent } from 'react'
import { DataProvider } from '@app/components/DataProvider'
import { WindowsList } from '../WindowsList/WindowsList'
import { ENABLE_DIAGNOSTICS } from '@app/constants'
import { Diagnostics } from '../Diagnostics/Diagnostics'
import { NotificationProvider } from '../Notifications/NotificationsContext'
import { PopupProvider } from '../Popup/PopupContext'

export const App: FunctionComponent = () => {
  return (
    <DataProvider br={browser}>
      <NotificationProvider>
        <PopupProvider>
          <WindowsList />
          {ENABLE_DIAGNOSTICS && <Diagnostics />}
        </PopupProvider>
      </NotificationProvider>
    </DataProvider>
  )
}
