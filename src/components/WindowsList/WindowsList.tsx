import React, { FunctionComponent, useMemo } from 'react'
import { useSessions, useStoredSessions } from '@app/components/DataProvider'
import { Window } from '../Window/Window'
import { isNotNil } from '@app/utils/isNotNil'
import { StoredWindow } from '../StoredWindow/StoredWindow'

import classes from './WindowsList.module.scss'
import classNames from 'classnames'

export const WindowsList: FunctionComponent = () => {
  const { windows } = useSessions()
  const stored = useStoredSessions()

  const activeSessions = useMemo(() => windows.map(w => w.session_id).filter(isNotNil), [windows])
  const inactiveStoredWindows = useMemo(() => stored.windows.filter(w => !activeSessions.includes(w.session_id)), [activeSessions, stored.windows])

  return (
    <div className={classes.root}>
      {windows.map((window, index) => (
        <div className={classNames(classes.window, { [classes.is_active]: window.focused })} key={window.id}>
          <Window index={index} window={window} />
        </div>
      ))}
      {inactiveStoredWindows.map(w => (
        <div className={classes.window} key={w.session_id}>
          <StoredWindow window={w} />
        </div>
      ))}
    </div>
  )
}
