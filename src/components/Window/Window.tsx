import React, { FunctionComponent, ReactNode, useEffect, useRef, useState } from 'react'
import { useBrowser, useSessions, useStoredSessions } from '@app/components/DataProvider'
import classnames from 'classnames'

import { WindowDescriptor } from '@app/types'
import { DRAGGABLE_TAB_MIME } from '@app/constants'
import { Tab } from '../Tab/Tab'
import { extractTabData } from '@app/utils/tabData'
import { useClickHandler } from '@app/hooks/useClickHandler'
import { Icon } from '../Icon/Icon'
import { Spacer } from '../Spacer/Spacer'

import classes from './Window.module.scss'
import { sendRuntimeMessage } from '@app/utils/sendRuntimeMessage'

export const Window: FunctionComponent<{ window: WindowDescriptor; index: number }> = ({ window, index }) => {
  const browser = useBrowser()
  const { tabs } = useSessions()
  const titleRef = useRef<HTMLDivElement>(null)
  const [dragover, setDragover] = useState(false)
  const { windows: storedWindows } = useStoredSessions()

  const activateHandler = useClickHandler(async () => {
    await browser.windows.update(window.id, { focused: true })
  })

  const closeHandler = useClickHandler(async () => {
    await browser.windows.remove(window.id)
  })

  const unlinkStoredHandler = useClickHandler(async () => {
    const sid = window.session_id
    if (!sid) throw new Error('No session id')

    sendRuntimeMessage(browser, {
      type: 'unlinkStored',
      sessionId: sid,
    })
    await browser.windows.remove(window.id)
  })

  useEffect(() => {
    const el = titleRef.current!

    const enter = (e: DragEvent) => {
      const data = extractTabData(e)
      if (data?.window_id === window.id) return
      setDragover(true)
    }

    const over = (e: DragEvent) => {
      if (!e.dataTransfer) return
      if (!e.dataTransfer.types.includes(DRAGGABLE_TAB_MIME)) return
      const data = extractTabData(e)
      if (data?.window_id === window.id) return
      e.preventDefault()
    }

    const leave = () => {
      // if (e.target !== e.currentTarget) return
      setDragover(false)
    }

    const drop = (e: DragEvent) => {
      setDragover(false)
      const data = extractTabData(e)
      if (!data) return
      e.preventDefault()
      console.info('[Tabsaver] moving tab to window', data, 'to', window.id)
      browser.tabs.move(data.id, { windowId: window.id, index: -1 })
    }

    el.addEventListener('dragenter', enter, true)
    el.addEventListener('dragover', over, true)
    el.addEventListener('dragleave', leave, true)
    el.addEventListener('drop', drop, true)

    return () => {
      el.removeEventListener('dragenter', enter, true)
      el.removeEventListener('dragover', over, true)
      el.removeEventListener('dragleave', leave, true)
      el.removeEventListener('drop', drop, true)
    }
  }, [browser, window.id])

  const windowTabs = tabs.filter(tab => tab.window_id === window.id)
  const storedSession = (window.session_id && storedWindows.find(w => w.session_id === window.session_id)) || null
  const label: ReactNode = storedSession ? storedSession.title : `Window ${index + 1}`
  return (
    <div className={classnames(classes.window, { [classes.is_active]: window.focused })} key={window.id}>
      <div className={classes.window_title} ref={titleRef} {...activateHandler}>
        <div>{label}</div>
        <Spacer />
        {storedSession && <Icon name="minus" {...unlinkStoredHandler} />}
        <Icon name="close" {...closeHandler} />
      </div>
      <div>
        {windowTabs.map(tab => (
          <Tab key={tab.id} tab={tab} window={window} />
        ))}
        {dragover && <div className={classes.window_overlay} />}
      </div>
    </div>
  )
}
