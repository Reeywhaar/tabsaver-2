import { TabDescriptor, WindowDescriptor } from '@app/types'
import React, { FunctionComponent, MouseEventHandler, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useBrowser, useDataUpdate, useStoredSessions } from '../DataProvider'
import { DRAGGABLE_SAVED_TAB_MIME, DRAGGABLE_TAB_MIME } from '@app/constants'
import { DragTabData, extractTabData, hasTabData } from '@app/utils/tabData'
import classNames from 'classnames'

import classes from './Tab.module.scss'
import { Icon } from '../Icon/Icon'
import { useClickHandler } from '@app/hooks/useClickHandler'
import { Spacer } from '../Spacer/Spacer'
import { joinNodesWithIds } from '@app/utils/joinNodes'
import { assertNeverSilent } from '@app/utils/assertNever'
import { defineAll } from '@app/utils/defineAll'
import { useEvent } from '@app/hooks/useEvent'
import { convertStoredTabToTabCreateProperties } from '@app/utils/convertStoredTabToTabCreateProperties'
import { isMiddleClick } from '@app/utils/isMiddleClick'
import { useWithErrorHandling } from '@app/hooks/useShowError'
import { isNil } from '@app/utils/isNil'
import { TabFavicon } from '../TabFavicon/TabFavicon'
import { ContainerLabel } from '../ContainerLabel/ContainerLabel'

export const Tab: FunctionComponent<{ tab: TabDescriptor; window?: WindowDescriptor }> = ({ tab, window }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const browser = useBrowser()
  const [dragover, setDragover] = useState<null | 'top' | 'bottom'>()
  const { tabs: storedTabs } = useStoredSessions()
  const { updateStoredSessions } = useDataUpdate()
  const discardable = useMemo(() => {
    if (tab.active) return false
    if (tab.discarded) return false
    if (tab.url.startsWith('about:')) return false
    if (tab.url.startsWith('chrome:')) return false
    return true
  }, [tab])

  const withErrorHandling = useWithErrorHandling()

  const getStoredTabs = useEvent(() => storedTabs)
  const getTab = useEvent(() => tab)

  const handleAuxClick = useEvent<MouseEventHandler>(e => {
    if (isMiddleClick(e.nativeEvent)) {
      e.preventDefault()
      e.stopPropagation()
      browser.tabs.remove(tab.id)
      return
    }
  })

  const clickHandler = useClickHandler(async () => {
    await browser.tabs.update(tab.id, { active: true })
    if (window) await browser.windows.update(window.id, { focused: true })
  })

  const removeHandler = useClickHandler(async e => {
    console.info(`[Tab] removing tab with id ${tab.id}`)
    e.preventDefault()
    e.stopPropagation()
    await browser.tabs.remove(tab.id)
  })

  const discardHandler = useClickHandler(async e => {
    e.preventDefault()
    await browser.tabs.discard(tab.id)
  })

  useEffect(() => {
    const el = rootRef.current!

    const start = (e: DragEvent) => {
      if (!e.dataTransfer) return
      e.dataTransfer.setData(DRAGGABLE_TAB_MIME, getTabData(getTab()))
      e.dataTransfer.effectAllowed = 'copyMove'
    }

    el.addEventListener('dragstart', start, true)

    return () => {
      el.removeEventListener('dragstart', start, true)
    }
  }, [getTab])

  useEffect(() => {
    const el = rootRef.current!

    let height = el.getBoundingClientRect().height
    let dragover: null | 'top' | 'bottom' = null

    const enter = () => {
      height = el.getBoundingClientRect().height
    }

    const over = (e: DragEvent) => {
      if (!e.dataTransfer) return
      if (hasTabData(e)) {
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

    const drop = withErrorHandling(async (e: DragEvent) => {
      const tab = getTab()
      const dr = dragover
      dragover = null
      setDragover(null)
      const data = extractTabData(e)
      if (!data) return
      e.preventDefault()
      switch (data.type) {
        case DRAGGABLE_TAB_MIME: {
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
          console.info('[Tabsaver] moving tab', data, 'to', tab.window_id, index)
          await browser.tabs.move(data.id, { windowId: tab.window_id, index })
          break
        }
        case DRAGGABLE_SAVED_TAB_MIME: {
          let index: number | undefined = tab.index + (dr === 'bottom' ? 0 : -1)
          if (index < 0) index = undefined
          const stab = getStoredTabs().find(t => t.id === data.id)
          if (!stab) return
          console.info('[Tabsaver] moving stored tab', data, 'to', tab.window_id, index ?? 'undefined')
          const newTab = await browser.tabs.create({ ...convertStoredTabToTabCreateProperties(stab), title: undefined, windowId: tab.window_id, index })
          if (isNil(index)) {
            if (!newTab.id) throw new Error('Tab id is undefined')
            await browser.tabs.move(newTab.id, { index: 0 })
          }
          if (e.dataTransfer?.dropEffect === 'move') {
            updateStoredSessions(stored => ({
              ...stored,
              tabs: stored.tabs.filter(t => t.id !== stab.id),
            }))
          }
          break
        }
        default:
          assertNeverSilent(data)
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
  }, [browser.tabs, getStoredTabs, getTab, updateStoredSessions, withErrorHandling])

  const label = (() => {
    const parts: { key: string; node: ReactNode }[] = []
    if (tab.title) {
      parts.push({ key: 'title', node: <span>{tab.title}</span> })
    }
    if (tab.url && !excludedURLS.includes(tab.url)) {
      parts.push({ key: 'url', node: <span className={classes.tab_url}>{tab.url}</span> })
    }
    if (!parts.length) {
      parts.push({ key: 'empty', node: <span className={classes.tab_url}>Empty Tab</span> })
    }
    return parts
  })()

  const title = [tab.title, tab.url].filter(Boolean).join('\n')

  return (
    <div
      className={classNames(
        classes.tab,
        { [classes.is_window_active]: window?.focused },
        { [classes.is_active]: tab.active },
        { [classes.is_discarded]: tab.discarded },
        dragover === 'top' ? classes.is_dragover_top : dragover === 'bottom' ? classes.is_dragover_bottom : null
      )}
      draggable={true}
      onAuxClick={handleAuxClick}
      ref={rootRef}
      title={title}
      {...clickHandler}
    >
      {tab.pinned && <div className={classes.pin} />}
      <TabFavicon url={tab.favicon_url} />
      <div className={classes.tab_label}>
        {joinNodesWithIds(label, index => (
          <span className={classes.tab_separator} key={`spacer-${index}`}>
            {' — '}
          </span>
        ))}
      </div>
      <Spacer />
      <ContainerLabel id={tab.cookie_store_id} />
      {discardable && <Icon className={classes.tab_icon} name="power" title="Discard" {...discardHandler} />}
      <Icon className={classes.tab_icon} name="close" title="Close tab" {...removeHandler} />
    </div>
  )
}

const getTabData = (tab: TabDescriptor): string => {
  return JSON.stringify(
    defineAll<DragTabData>({
      type: DRAGGABLE_TAB_MIME,
      id: tab.id,
      window_id: tab.window_id,
      index: tab.index,
    })
  )
}

export const excludedURLS = ['about:newtab', 'about:home', 'about:blank', 'chrome://browser/content/blanktab.html']
