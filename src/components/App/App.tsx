import React, { FunctionComponent } from 'react'
import { DataProvider } from '@app/components/DataProvider'
import { WindowsList } from '../WindowsList/WindowsList'
import { IS_PRODUCTION } from '@app/constants'
import { Diagnostics } from '../Diagnostics/Diagnostics'

export const App: FunctionComponent = () => {
  return (
    <DataProvider br={browser}>
      <WindowsList />
      {!IS_PRODUCTION && <Diagnostics />}
    </DataProvider>
  )
}
