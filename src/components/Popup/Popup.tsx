import React, { FunctionComponent, MouseEventHandler, PropsWithChildren } from 'react'
import { PopupControls } from './types'

import classes from './Popup.module.scss'
import { useEvent } from '@app/hooks/useEvent'

export const Popup: FunctionComponent<PropsWithChildren<{ controls: PopupControls }>> = ({ controls, children }) => {
  const handleClick = useEvent<MouseEventHandler<HTMLDivElement>>(e => {
    if (e.target !== e.currentTarget) return
    e.preventDefault()
    controls.close()
  })

  return (
    <div className={classes.root} onClickCapture={handleClick}>
      {children}
    </div>
  )
}
