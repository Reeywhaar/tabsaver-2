import React, { FunctionComponent } from 'react'
import { DataProvider } from '@app/components/DataProvider'
import { WindowsList } from '../WindowsList/WindowsList'
import { ENABLE_DIAGNOSTICS } from '@app/constants'
import { Diagnostics } from '../Diagnostics/Diagnostics'
import { NotificationProvider } from '../Notifications/NotificationsContext'
import { PopupProvider } from '../Popup/PopupContext'
import { ErrorListener } from '../ErrorListener/ErrorListener'

export const App: FunctionComponent = () => {
  return (
    <DataProvider br={browser}>
      <NotificationProvider>
        <PopupProvider>
          <ErrorListener />
          <WindowsList />
          {ENABLE_DIAGNOSTICS && <Diagnostics />}
        </PopupProvider>
      </NotificationProvider>
    </DataProvider>
  )
}
