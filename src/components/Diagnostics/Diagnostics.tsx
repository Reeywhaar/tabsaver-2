import React, { FunctionComponent, useCallback } from 'react'

import button from '@app/styles/button.module.scss'
import classes from './Diagnostics.module.scss'

export const Diagnostics: FunctionComponent = () => {
  const openDevtools = useCallback(() => {
    browser.tabs.create({
      url: browser.runtime.getURL('dist/background.html'),
    })
  }, [])

  const openDiagnostics = useCallback(() => {
    browser.tabs.create({
      url: browser.runtime.getURL('dist/diagnostics.html'),
    })
  }, [])

  const openPanel = useCallback(() => {
    browser.tabs.create({
      url: browser.runtime.getURL('dist/panel.html'),
    })
  }, [])

  return (
    <div className={classes.diag_buttons}>
      <div>
        <button className={button.button} onClick={openDevtools}>
          Open devtools
        </button>
      </div>
      <div>
        <button className={button.button} onClick={openDiagnostics}>
          Open diagnostics
        </button>
      </div>
      <div>
        <button className={button.button} onClick={openPanel}>
          Open panel
        </button>
      </div>
    </div>
  )
}
