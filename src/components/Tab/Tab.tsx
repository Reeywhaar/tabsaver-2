import { TabDescriptor, WindowDescriptor } from '@app/types'
import React, { FunctionComponent, ReactNode, useEffect, useRef, useState } from 'react'
import { useBrowser } from '../DataProvider'
import { DRAGGABLE_TAB_MIME } from '@app/constants'
import { extractTabData } from '@app/utils/tabData'
import classNames from 'classnames'

import classes from './Tab.module.scss'
import { Icon } from '../Icon/Icon'
import { useClickHandler } from '@app/hooks/useClickHandler'

export const Tab: FunctionComponent<{ tab: TabDescriptor; window?: WindowDescriptor }> = ({ tab, window }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const browser = useBrowser()
  const [dragover, setDragover] = useState<null | 'top' | 'bottom'>()

  const activateHandler = useClickHandler(async () => {
    if (window) await browser.windows.update(window.id, { focused: true })
    await browser.tabs.update(tab.id, { active: true })
  })

  const removeHandler = useClickHandler(async e => {
    console.info(`[Tab] removing tab with id ${tab.id}`)
    e.preventDefault()
    e.stopPropagation()
    await browser.tabs.remove(tab.id)
  })

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
      className={classNames(
        classes.tab,
        { [classes.is_window_active]: window?.focused },
        { [classes.is_active]: tab.active },
        dragover === 'top' ? classes.is_dragover_top : dragover === 'bottom' ? classes.is_dragover_bottom : null
      )}
      draggable={true}
      ref={rootRef}
      title={tab.url}
      {...activateHandler}
    >
      {isFaviconIncluded(tab.favicon_url) && <img alt="" className={classes.tab_fav} src={tab.favicon_url} title={tab.favicon_url} />}
      <div className={classes.tab_label}>
        {label} {!excludedURLS.includes(tab.url) && <span className={classes.tab_url}>{tab.url}</span>}
      </div>
      <div className={classes.spacer} />
      <Icon name="close" {...removeHandler} />
    </div>
  )
}

const getTabData = (tab: TabDescriptor): string => {
  return JSON.stringify({
    id: tab.id,
    window_id: tab.window_id,
    index: tab.index,
  })
}

const excludedURLS = ['about:newtab', 'about:home', 'about:blank']
const isFaviconIncluded = (url?: string): url is string => {
  if (!url) return false
  if (url.startsWith('chrome://')) return false
  return true
}
