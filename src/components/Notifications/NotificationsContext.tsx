import React, { createContext, FunctionComponent, PropsWithChildren, ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { NotificationDescriptor } from './types'
import { v4 } from 'uuid'
import { Notification } from './Notification'

import classes from './NotificationsContext.module.scss'

export type NotificationControls = {
  close: () => void
}

type NotificationContextData = {
  notifications: NotificationDescriptor[]
}

type NotificationContextType = { data: NotificationContextData; update: (cb: (p: NotificationContextData) => NotificationContextData) => void }

const NotificationContext = createContext<NotificationContextType | null>(null)

export const NotificationProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const [data, setData] = useState<NotificationContextData>({ notifications: [] })

  const ctx = useMemo<NotificationContextType>(() => ({ data, update: setData }), [data])

  return (
    <NotificationContext.Provider value={ctx}>
      {children}
      {!!ctx.data.notifications.length && (
        <div className={classes.notifications}>
          {ctx.data.notifications.map(n => (
            <React.Fragment key={n.id}>{n.node}</React.Fragment>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  )
}

const useNotificationContext = () => useContext(NotificationContext)!

export const useNotification = () => {
  const { update } = useNotificationContext()

  return useCallback(
    (notification: (ctx: NotificationControls) => { level: 'info' | 'error'; description: ReactNode }) => {
      const id = v4()
      const ctx: NotificationControls = {
        close: () => update(ctx => ({ ...ctx, notifications: ctx.notifications.filter(p => p.id !== id) })),
      }

      const data = notification(ctx)

      const descriptor: NotificationDescriptor = {
        id,
        node: <Notification ctx={ctx} description={data.description} level={data.level} />,
      }

      update(ctx => ({ ...ctx, notifications: [...ctx.notifications, descriptor] }))

      return ctx
    },
    [update]
  )
}
