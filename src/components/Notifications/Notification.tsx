import React, { FunctionComponent, ReactNode } from 'react'
import classNames from 'classnames'
import { NotificationControls } from './NotificationsContext'
import { useEvent } from '@app/hooks/useEvent'

import classes from './Notification.module.scss'

export const Notification: FunctionComponent<{ ctx: NotificationControls; level: 'error' | 'info'; description: ReactNode }> = ({
  ctx,
  level,
  description,
}) => {
  const handleClose = useEvent(() => {
    ctx.close()
  })

  return (
    <div className={classNames(classes.notification, classes[`is_${level}`])} onClick={handleClose}>
      {description}
    </div>
  )
}
