import React, { FunctionComponent, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useBrowser, useSessions, useStoredSessions } from '@app/components/DataProvider'
import classnames from 'classnames'

import classes from './WindowsList.module.scss'
import { TabDescriptor, WindowDescriptor } from '@app/types'
import { DRAGGABLE_TAB_MIME } from '@app/constants'

export const WindowsList: FunctionComponent = () => {
  const { windows } = useSessions()

  return (
    <div>
      {windows.map((window, index) => (
        <Window index={index} key={window.id} window={window} />
      ))}
    </div>
  )
}

const Window: FunctionComponent<{ window: WindowDescriptor; index: number }> = ({ window, index }) => {
  const browser = useBrowser()
  const { tabs } = useSessions()
  const titleRef = useRef<HTMLDivElement>(null)
  const [dragover, setDragover] = useState(false)
  const { windows: storedWindows } = useStoredSessions()

  const activateWindow = useCallback(() => {
    browser.windows.update(window.id, { focused: true })
  }, [browser.windows, window.id])

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
    <div className={classnames(classes.window, { [classes.is_active]: window.focused })} key={window.id} onClick={activateWindow}>
      <div className={classes.window_title} ref={titleRef}>
        {label}
      </div>
      {windowTabs.map(tab => (
        <Tab key={tab.id} tab={tab} />
      ))}
      {dragover && <div className={classes.window_overlay} />}
    </div>
  )
}

const Tab: FunctionComponent<{ tab: TabDescriptor }> = ({ tab }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const browser = useBrowser()
  const [dragover, setDragover] = useState<null | 'top' | 'bottom'>()

  const activateTab = useCallback(() => {
    browser.tabs.update(tab.id, { active: true })
  }, [browser.tabs, tab.id])

  useEffect(() => {
    const el = rootRef.current!

    let height = el.getBoundingClientRect().height
    let dragover: null | 'top' | 'bottom' = null

    const start = (e: DragEvent) => {
      if (!e.dataTransfer) return
      e.dataTransfer.setData(DRAGGABLE_TAB_MIME, getTabData(tab))
      e.dataTransfer.effectAllowed = 'move'
    }

    const enter = () => {
      height = el.getBoundingClientRect().height
    }

    const over = (e: DragEvent) => {
      if (!e.dataTransfer) return
      if (e.dataTransfer.types.includes(DRAGGABLE_TAB_MIME)) {
        e.preventDefault()
      }
      if (e.offsetY > height / 2) {
        dragover = 'bottom'
        setDragover('bottom')
      } else {
        dragover = 'top'
        setDragover('top')
      }
    }

    const leave = () => {
      dragover = null
      setDragover(null)
    }

    const drop = (e: DragEvent) => {
      const dr = dragover
      dragover = null
      setDragover(null)
      const data = extractTabData(e)
      if (!data) return
      e.preventDefault()
      if (data.id === tab.id) return
      const index = (() => {
        if (data.window_id === tab.window_id) {
          if (data.index < tab.index) {
            return dr === 'top' ? tab.index - 1 : tab.index
          }
          return dr === 'top' ? tab.index : tab.index + 1
        }
        return tab.index + (dr === 'bottom' ? 1 : 0)
      })()
      console.info('[Tabsave] moving tab', data, 'to', tab.window_id, index)
      browser.tabs.move(data.id, { windowId: tab.window_id, index })
    }

    el.addEventListener('dragstart', start, true)
    el.addEventListener('dragenter', enter, true)
    el.addEventListener('dragover', over, true)
    el.addEventListener('dragleave', leave, true)
    el.addEventListener('drop', drop, true)

    return () => {
      el.removeEventListener('dragstart', start, true)
      el.removeEventListener('dragenter', enter, true)
      el.removeEventListener('dragover', over, true)
      el.removeEventListener('dragleave', leave, true)
      el.removeEventListener('drop', drop, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browser, tab.id, tab.index, tab.window_id])

  let label: ReactNode = `${tab.title || 'Unnamed tab'}`
  if (tab.pinned) {
    label = `• ${label}`
  }

  return (
    <div
      className={classnames(
        classes.tab,
        { [classes.is_active]: tab.active },
        dragover === 'top' ? classes.is_dragover_top : dragover === 'bottom' ? classes.is_dragover_bottom : null
      )}
      draggable={true}
      onClick={activateTab}
      ref={rootRef}
      title={tab.url}
    >
      {isFaviconIncluded(tab.favicon_url) && <img alt="" className={classes.tab_fav} src={tab.favicon_url} title={tab.favicon_url} />} {label}{' '}
      {!excludedURLS.includes(tab.url) && <span className={classes.tab_url}>{tab.url}</span>}
    </div>
  )
}

type DragTabData = {
  id: number
  window_id?: number
  index: number
}

const getTabData = (tab: TabDescriptor): string => {
  return JSON.stringify({
    id: tab.id,
    window_id: tab.window_id,
    index: tab.index,
  })
}

const extractTabData = (e: DragEvent): DragTabData | null => {
  const data = e.dataTransfer?.getData(DRAGGABLE_TAB_MIME)
  if (!data) return null
  return JSON.parse(data)
}

const excludedURLS = ['about:newtab', 'about:home', 'about:blank']
const isFaviconIncluded = (url?: string): url is string => {
  if (!url) return false
  if (url.startsWith('chrome://')) return false
  return true
}
