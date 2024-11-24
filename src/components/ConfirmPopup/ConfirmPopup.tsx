import React, { FunctionComponent, ReactNode } from 'react'
import { PopupControls } from '../Popup/types'
import { Popup } from '../Popup/Popup'

import buttonClasses from '@app/styles/button.module.scss'
import classes from './ConfirmPopup.module.scss'
import { useClickHandler } from '@app/hooks/useClickHandler'

export const ConfirmPopup: FunctionComponent<{ controls: PopupControls; title: ReactNode; onConfirm: () => unknown }> = ({ controls, title, onConfirm }) => {
  const handleBailHandler = useClickHandler(async () => {
    controls.close()
  })

  const handleConfirmHandler = useClickHandler(async () => {
    await onConfirm()
    controls.close()
  })

  return (
    <Popup controls={controls}>
      <div className={classes.overlay}>
        <div className={classes.content}>
          <div>{title}</div>
          <div className={classes.buttons}>
            <button className={buttonClasses.button} {...handleBailHandler}>
              No
            </button>
            <button autoFocus className={buttonClasses.button} {...handleConfirmHandler}>
              Yes
            </button>
          </div>
        </div>
      </div>
    </Popup>
  )
}
