import React, { FunctionComponent, useEffect, useMemo, useRef, useState } from 'react'
import { SavedWindowDescriptor } from '@app/types'
import { useBrowser, useDataUpdate, useSessions, useStoredSessions } from '../DataProvider'
import { StoredTab } from '../StoredTab/StoredTab'

import { Icon } from '../Icon/Icon'
import { Spacer } from '../Spacer/Spacer'
import { useClickHandler } from '@app/hooks/useClickHandler'
import { sendRuntimeMessage } from '@app/utils/sendRuntimeMessage'

import windowClasses from '../Window/Window.module.scss'
import classes from './StoredWindow.module.scss'
import classNames from 'classnames'
import { useWithErrorHandling } from '@app/hooks/useShowError'
import { extractTabData, hasTabData } from '@app/utils/tabData'
import { DRAGGABLE_SAVED_TAB_MIME, DRAGGABLE_TAB_MIME } from '@app/constants'
import { assertNever } from '@app/utils/assertNever'
import { convertTabToStoredTab } from '@app/utils/convertTabToStoredTab'
import { useEvent } from '@app/hooks/useEvent'
import { usePush } from '../Popup/PopupContext'
import { RenamePopup } from '../RenamePopup/RenamePopup'
import { ConfirmPopup } from '../ConfirmPopup/ConfirmPopup'

export type StoredWindowProps = {
  window: SavedWindowDescriptor
}

export const StoredWindow: FunctionComponent<StoredWindowProps> = ({ window }) => {
  const br = useBrowser()
  const { updateStoredSessions } = useDataUpdate()
  const { tabs: activeTabs } = useSessions()
  const { tabs } = useStoredSessions()
  const titleRef = useRef<HTMLDivElement>(null)
  const [dragover, setDragover] = useState(false)
  const push = usePush()

  const withErrorHandling = useWithErrorHandling()

  const getActiveTabs = useEvent(() => activeTabs)
  const getStoredTabs = useEvent(() => tabs)

  const windowTabs = useMemo(() => tabs.filter(t => t.session_id === window.session_id), [tabs, window.session_id])

  const remove = useEvent(() => {
    push(controls => (
      <ConfirmPopup
        controls={controls}
        onConfirm={() => {
          updateStoredSessions(stored => ({
            ...stored,
            windows: stored.windows.filter(w => w.session_id !== window.session_id),
            tabs: stored.tabs.filter(t => t.session_id !== window.session_id),
          }))
        }}
        title={
          <div>
            Are you sure you want to delete <strong>"{window.title}"</strong>?
          </div>
        }
      />
    ))
  })

  const rename = useEvent(() => {
    push(ctx => (
      <RenamePopup
        ctx={ctx}
        onUpdate={value => {
          updateStoredSessions(stored => ({
            ...stored,
            windows: stored.windows.map(w => (w.session_id === window.session_id ? { ...w, title: value } : w)),
          }))
          ctx.close()
        }}
        value={window.title}
      />
    ))
  })

  const removeHandler = useClickHandler(e => {
    e.preventDefault()
    remove()
  })

  const openHandler = useClickHandler(e => {
    e.preventDefault()
    return withErrorHandling(async () => {
      await sendRuntimeMessage(br, {
        type: 'openSession',
        id: window.session_id,
      })
    })()
  })

  const renameHandler = useClickHandler(e => {
    e.preventDefault()
    rename()
  })

  useEffect(() => {
    const el = titleRef.current!

    const enter = (e: DragEvent) => {
      const data = extractTabData(e)
      if (!data) return
      if (data.type === DRAGGABLE_SAVED_TAB_MIME && data.session_id === window.session_id) return
      setDragover(true)
    }

    const over = (e: DragEvent) => {
      if (!e.dataTransfer) return
      if (!hasTabData(e)) return
      const data = extractTabData(e)
      if (!data) return
      if (data.type === DRAGGABLE_SAVED_TAB_MIME && data.session_id === window.session_id) return
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
          console.info('[Tabsaver] moving tab to stored window', data, 'to', window.session_id)
          const tab = getActiveTabs().find(t => t.id === data.id)
          if (!tab) throw new Error('Tab not found')
          const maxIndex = getStoredTabs()
            .filter(t => t.session_id === window.session_id)
            .reduce((max, t) => Math.max(max, t.index), -1)
          const stab = convertTabToStoredTab(window.session_id, { ...tab, index: maxIndex + 1 })
          if (!stab) throw new Error('Failed to convert tab')

          updateStoredSessions(stored => ({
            ...stored,
            tabs: [...stored.tabs, stab],
          }))
          if (e.dataTransfer?.dropEffect === 'move') {
            await browser.tabs.remove(data.id)
          }
          break
        }
        case DRAGGABLE_SAVED_TAB_MIME: {
          // todo: implement

          // const stab = getStoredTabs().find(t => t.id === data.id)
          // if (!stab) return
          // console.info('[Tabsaver] moving stored tab to window', data, 'to', window.id)
          // const props = convertStoredTabToTabCreateProperties(stab)
          // await browser.tabs.create({ ...props, windowId: window.id, index: Number.MAX_SAFE_INTEGER })
          // if (e.dataTransfer?.dropEffect === 'move') {
          //   updateStoredSessions(stored => ({
          //     ...stored,
          //     tabs: stored.tabs.filter(t => t.id !== data.id),
          //   }))
          // }
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
  }, [getActiveTabs, getStoredTabs, updateStoredSessions, window.session_id, withErrorHandling])

  return (
    <div className={classNames(windowClasses.window, classes.window)}>
      <div className={windowClasses.window_top} ref={titleRef}>
        <div className={windowClasses.window_title}>{window.title}</div>
        <Spacer />
        <Icon className={windowClasses.icon} name="edit" {...renameHandler} />
        <Icon className={windowClasses.icon} name="open" {...openHandler} />
        <Icon className={windowClasses.icon} name="close" {...removeHandler} />
      </div>
      <div>
        {windowTabs.map(t => (
          <StoredTab key={t.id} tab={t} window={window} />
        ))}
        {dragover && <div className={windowClasses.window_overlay} />}
      </div>
    </div>
  )
}
