import React, { FunctionComponent, ReactNode, useEffect, useRef, useState } from 'react'
import { useBrowser, useDataUpdate, useSessions, useStoredSessions } from '@app/components/DataProvider'
import classnames from 'classnames'

import { WindowDescriptor } from '@app/types'
import { DRAGGABLE_SAVED_TAB_MIME, DRAGGABLE_TAB_MIME } from '@app/constants'
import { Tab } from '../Tab/Tab'
import { extractTabData, hasTabData } from '@app/utils/tabData'
import { useClickHandler } from '@app/hooks/useClickHandler'
import { Icon } from '../Icon/Icon'
import { Spacer } from '../Spacer/Spacer'

import classes from './Window.module.scss'
import { sendRuntimeMessage } from '@app/utils/sendRuntimeMessage'
import { assertNever } from '@app/utils/assertNever'
import { convertStoredTabToTabCreateProperties } from '@app/utils/convertStoredTabToTabCreateProperties'
import { useEvent } from '@app/hooks/useEvent'
import { useWithErrorHandling } from '@app/hooks/useShowError'
import { usePush } from '../Popup/PopupContext'
import { RenamePopup } from '../RenamePopup/RenamePopup'

export const Window: FunctionComponent<{ window: WindowDescriptor; index: number }> = ({ window, index }) => {
  const browser = useBrowser()
  const { tabs } = useSessions()
  const titleRef = useRef<HTMLDivElement>(null)
  const [dragover, setDragover] = useState(false)
  const { windows: sessions, tabs: storedTabs } = useStoredSessions()
  const { updateStoredSessions } = useDataUpdate()
  const withErrorHandling = useWithErrorHandling()
  const push = usePush()

  const windowTabs = tabs.filter(tab => tab.window_id === window.id)
  const storedSession = (window.associated_window_id && sessions.find(w => w.associated_window_id === window.associated_window_id)) || null

  const getStoredTabs = useEvent(() => storedTabs)

  const rename = useEvent(() => {
    if (!storedSession) return
    push(ctx => (
      <RenamePopup
        ctx={ctx}
        onUpdate={value => {
          updateStoredSessions(stored => ({
            ...stored,
            windows: stored.windows.map(w => (w.session_id === storedSession.session_id ? { ...w, title: value } : w)),
          }))
          ctx.close()
        }}
        value={storedSession.title}
      />
    ))
  })

  const activateHandler = useClickHandler(async () => {
    await browser.windows.update(window.id, { focused: true })
  })

  const closeHandler = useClickHandler(async () => {
    await browser.windows.remove(window.id)
  })

  const renameHandler = useClickHandler(e => {
    e.preventDefault()
    rename()
  })

  const linkWindowHandler = useClickHandler(async () => {
    sendRuntimeMessage(browser, {
      type: 'linkWindow',
      windowId: window.id,
    })
  })

  const unlinkStoredHandler = useClickHandler(async () => {
    const sid = window.associated_window_id
    if (!sid) throw new Error('No session id')

    sendRuntimeMessage(browser, {
      type: 'unlinkStored',
      associatedSessionId: sid,
    })
  })

  useEffect(() => {
    const el = titleRef.current!

    const enter = (e: DragEvent) => {
      const data = extractTabData(e)
      if (!data) return
      if (data.type === DRAGGABLE_TAB_MIME && data?.window_id === window.id) return
      setDragover(true)
    }

    const over = (e: DragEvent) => {
      if (!e.dataTransfer) return
      if (!hasTabData(e)) return
      const data = extractTabData(e)
      if (!data) return
      if (data.type === DRAGGABLE_TAB_MIME && data.window_id === window.id) return
      e.preventDefault()
    }

    const leave = () => {
      setDragover(false)
    }

    const drop = withErrorHandling(async (e: DragEvent) => {
      setDragover(false)
      const data = extractTabData(e)
      if (!data) return
      e.preventDefault()
      switch (data.type) {
        case DRAGGABLE_TAB_MIME: {
          console.info('[Tabsaver] moving tab to window', data, 'to', window.id)
          browser.tabs.move(data.id, { windowId: window.id, index: -1 })
          break
        }
        case DRAGGABLE_SAVED_TAB_MIME: {
          const stab = getStoredTabs().find(t => t.id === data.id)
          if (!stab) return
          console.info('[Tabsaver] moving stored tab to window', data, 'to', window.id)
          const props = convertStoredTabToTabCreateProperties(stab)
          await browser.tabs.create({ ...props, windowId: window.id, index: Number.MAX_SAFE_INTEGER })
          if (e.dataTransfer?.dropEffect === 'move') {
            updateStoredSessions(stored => ({
              ...stored,
              tabs: stored.tabs.filter(t => t.id !== data.id),
            }))
          }
          break
        }
        default:
          assertNever(data)
      }
    })

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
  }, [browser, getStoredTabs, updateStoredSessions, window.id, withErrorHandling])

  const label: ReactNode = storedSession ? storedSession.title : `Window ${index + 1}`

  return (
    <div className={classnames(classes.window, { [classes.is_active]: window.focused })} key={window.id}>
      <div className={classes.window_top} ref={titleRef} {...activateHandler}>
        {window.incognito && <div className={classes.incognito} />}
        <div className={classes.window_title}>{label}</div>
        <Spacer />
        {storedSession && <Icon className={classes.icon} name="edit" title="Rename" {...renameHandler} />}
        {storedSession ? (
          <Icon className={classes.icon} name="minus" title="Unlink session" {...unlinkStoredHandler} />
        ) : (
          <Icon className={classes.icon} name="plus" title="Save session" {...linkWindowHandler} />
        )}
        <Icon className={classes.icon} name="close" title="Close window" {...closeHandler} />
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
