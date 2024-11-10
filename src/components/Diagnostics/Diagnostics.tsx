import React, { FunctionComponent, useCallback } from 'react'

import button from '@app/styles/button.module.scss'
import classes from './Diagnostics.module.scss'
import classNames from 'classnames'

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

  const reload = useCallback(() => {
    browser.runtime.reload()
  }, [])

  const renderButton = (label: string, action: () => void) => {
    return (
      <div>
        <button className={classNames(button.button, classes.button)} onClick={action}>
          {label}
        </button>
      </div>
    )
  }

  return (
    <div className={classes.diag_buttons}>
      {renderButton('Reload', reload)}
      {renderButton('Open devtools', openDevtools)}
      {renderButton('Open diagnostics', openDiagnostics)}
      {renderButton('Open panel', openPanel)}
    </div>
  )
}
