import React, { createContext, FunctionComponent, PropsWithChildren, ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { PopupControls, PopupDescriptor } from './types'
import { v4 } from 'uuid'

import classes from './PopupContext.module.scss'

type PopupContextData = {
  popups: PopupDescriptor[]
}

type PopupContextType = { data: PopupContextData; update: (cb: (p: PopupContextData) => PopupContextData) => void }

const PopupContext = createContext<PopupContextType | null>(null)

export const PopupProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const [data, setData] = useState<PopupContextData>({ popups: [] })

  const ctx = useMemo<PopupContextType>(() => ({ data, update: setData }), [data])

  return (
    <PopupContext.Provider value={ctx}>
      {children}
      {!!ctx.data.popups.length && (
        <div className={classes.popups}>
          {ctx.data.popups.map(p => {
            return <React.Fragment key={p.id}>{p.node}</React.Fragment>
          })}
        </div>
      )}
    </PopupContext.Provider>
  )
}

const usePopupContext = () => useContext(PopupContext)!

export const usePush = () => {
  const { update } = usePopupContext()

  return useCallback(
    (popup: (controls: PopupControls) => ReactNode) => {
      const id = v4()
      const ctx: PopupControls = {
        close: () => update(ctx => ({ ...ctx, popups: ctx.popups.filter(p => p.id !== descriptor.id) })),
      }

      const descriptor: PopupDescriptor = {
        id,
        node: popup(ctx),
      }

      update(ctx => ({ ...ctx, popups: [...ctx.popups, descriptor] }))

      return ctx
    },
    [update]
  )
}
