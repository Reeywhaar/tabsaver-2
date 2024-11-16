import React, { FunctionComponent, useMemo } from 'react'
import { SavedWindowDescriptor } from '@app/types'
import { useBrowser, useDataUpdate, useStoredSessions } from '../DataProvider'
import { StoredTab } from '../StoredTab/StoredTab'

import { Icon } from '../Icon/Icon'
import { Spacer } from '../Spacer/Spacer'
import { useClickHandler } from '@app/hooks/useClickHandler'
import { sendRuntimeMessage } from '@app/utils/sendRuntimeMessage'

import windowClasses from '../Window/Window.module.scss'
import classes from './StoredWindow.module.scss'
import classNames from 'classnames'

export type StoredWindowProps = {
  window: SavedWindowDescriptor
}

export const StoredWindow: FunctionComponent<StoredWindowProps> = ({ window }) => {
  const br = useBrowser()
  const { updateStoredSessions } = useDataUpdate()
  const { tabs } = useStoredSessions()

  const windowTabs = useMemo(() => tabs.filter(t => t.window_session_id === window.session_id), [tabs, window.session_id])

  const removeHandler = useClickHandler(async e => {
    e.preventDefault()

    updateStoredSessions(stored => ({
      ...stored,
      windows: stored.windows.filter(w => w.session_id !== window.session_id),
      tabs: stored.tabs.filter(t => t.window_session_id !== window.session_id),
    }))
  })

  const openHandler = useClickHandler(async e => {
    e.preventDefault()
    await sendRuntimeMessage(br, {
      type: 'openSession',
      id: window.session_id,
    })
  })

  return (
    <div className={classNames(windowClasses.window, classes.window)}>
      <div className={windowClasses.window_title}>
        <div>{window.title}</div>
        <Spacer />
        <Icon name="open" {...openHandler} />
        <Icon name="close" {...removeHandler} />
      </div>
      <div>
        {windowTabs.map(t => (
          <StoredTab key={t.id} tab={t} window={window} />
        ))}
      </div>
    </div>
  )
}
