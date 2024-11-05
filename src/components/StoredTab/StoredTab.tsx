import React, { FunctionComponent } from 'react'
import { SavedTabDescriptor, SavedWindowDescriptor } from '@app/types'

import tabClasses from '../Tab/Tab.module.scss'
import { Spacer } from '../Spacer/Spacer'
import { Icon } from '../Icon/Icon'
import { useDataUpdate } from '../DataProvider'
import { useClickHandler } from '@app/hooks/useClickHandler'

export type StoredTabProps = {
  tab: SavedTabDescriptor
  window: SavedWindowDescriptor
}

export const StoredTab: FunctionComponent<StoredTabProps> = ({ tab, window }) => {
  const { updateStoredSessions } = useDataUpdate()

  const removeHandler = useClickHandler(e => {
    e.preventDefault()

    updateStoredSessions(stored => ({ ...stored, tabs: stored.tabs.filter(t => t.id !== tab.id) }))
  })

  return (
    <div className={tabClasses.tab}>
      <div className={tabClasses.tab_label}>{tab.title ?? tab.id}</div>
      <Spacer />
      <Icon name="close" {...removeHandler} />
    </div>
  )
}
