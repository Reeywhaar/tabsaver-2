import React, { FunctionComponent } from 'react'
import { DataProvider } from '@app/components/DataProvider'
import { WindowsList } from '../WindowsList/WindowsList'
import { ENABLE_DIAGNOSTICS } from '@app/constants'
import { Diagnostics } from '../Diagnostics/Diagnostics'

export const App: FunctionComponent = () => {
  return (
    <DataProvider br={browser}>
      <WindowsList />
      {ENABLE_DIAGNOSTICS && <Diagnostics />}
    </DataProvider>
  )
}
