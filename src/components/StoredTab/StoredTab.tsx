import React, { FunctionComponent, MouseEventHandler, ReactNode, useEffect, useRef, useState } from 'react'
import { SavedTabDescriptor, SavedWindowDescriptor } from '@app/types'

import { Spacer } from '../Spacer/Spacer'
import { Icon } from '../Icon/Icon'
import { useDataUpdate, useSessions } from '../DataProvider'
import { useClickHandler } from '@app/hooks/useClickHandler'

import tabClasses from '../Tab/Tab.module.scss'
import { DragSavedTabData, extractTabData, hasTabData } from '@app/utils/tabData'
import { defineAll } from '@app/utils/defineAll'
import { DRAGGABLE_SAVED_TAB_MIME, DRAGGABLE_TAB_MIME } from '@app/constants'
import { useEvent } from '@app/hooks/useEvent'
import { isMiddleClick } from '@app/utils/isMiddleClick'
import { ConfirmPopup } from '../ConfirmPopup/ConfirmPopup'
import { usePush } from '../Popup/PopupContext'

import classes from './StoredTab.module.scss'
import { TabFavicon } from '../TabFavicon/TabFavicon'
import { ContainerLabel } from '../ContainerLabel/ContainerLabel'
import { joinNodesWithIds } from '@app/utils/joinNodes'
import { excludedURLS } from '../Tab/Tab'
import { useWithErrorHandling } from '@app/hooks/useShowError'
import classNames from 'classnames'
import { SessionsHelper } from '@app/SessionsHelper'
import { assertNeverSilent } from '@app/utils/assertNever'

export type StoredTabProps = {
  tab: SavedTabDescriptor
  window: SavedWindowDescriptor
}

export const StoredTab: FunctionComponent<StoredTabProps> = ({ tab }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const { tabs } = useSessions()
  const { updateStoredSessions } = useDataUpdate()
  const [dragover, setDragover] = useState<null | 'top' | 'bottom'>()
  const push = usePush()
  const withErrorHandling = useWithErrorHandling()

  const getTab = useEvent(() => tab)

  const getTabs = useEvent(() => tabs)

  const remove = useEvent(() => {
    push(controls => (
      <ConfirmPopup
        controls={controls}
        onConfirm={() => {
          updateStoredSessions(stored => {
            const helper = new SessionsHelper(stored)
            helper.removeTab(tab.id)
            return helper.data
          })
        }}
        title={
          <div>
            <div>
              Are you sure you want to delete tab <strong>"{tab.title ?? '...'}"</strong>?
            </div>
            <div className={classes.confirm_url}>{tab.url}</div>
          </div>
        }
      />
    ))
  })

  const removeHandler = useClickHandler(e => {
    e.preventDefault()
    remove()
  })

  const handleAuxClick = useEvent<MouseEventHandler>(e => {
    if (isMiddleClick(e.nativeEvent)) {
      e.preventDefault()
      e.stopPropagation()
      remove()
    }
  })

  useEffect(() => {
    const el = rootRef.current!

    const start = (e: DragEvent) => {
      if (!e.dataTransfer) return
      e.dataTransfer.setData(DRAGGABLE_SAVED_TAB_MIME, getTabData(getTab()))
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
          const wtab = getTabs().find(t => t.id === data.id)
          if (!wtab) throw new Error(`Tab ${data.id} not found`)
          const index = tab.index + (dr === 'bottom' ? 1 : 0)
          console.info('[Tabsaver] moving tab', data, 'to', tab.session_id, index)
          updateStoredSessions(stored => {
            const helper = new SessionsHelper(stored)
            helper.addTab(wtab, tab.session_id, index)
            return helper.data
          })
          if (e.dataTransfer?.dropEffect === 'move') {
            await browser.tabs.remove(data.id)
          }
          break
        }
        case DRAGGABLE_SAVED_TAB_MIME: {
          const tab = getTab()
          const isSameSession = data.session_id === tab.session_id
          const index = (() => {
            if (isSameSession) {
              if (data.index < tab.index) {
                return dr === 'top' ? tab.index - 1 : tab.index
              }
              return dr === 'top' ? tab.index : tab.index + 1
            }
            return tab.index + (dr === 'bottom' ? 1 : 0)
          })()
          console.info('[Tabsaver] moving stored tab', data, 'to', tab.session_id, index ?? 'undefined')
          const isMove = e.dataTransfer?.dropEffect === 'move'
          updateStoredSessions(stored => {
            const stab = stored.tabs.find(t => t.id === data.id)
            if (!stab) throw new Error(`Cannot find tab ${data.id}`)
            const helper = new SessionsHelper(stored)
            if (isSameSession || isMove) {
              helper.moveTab(data.id, tab.session_id, index)
            } else {
              helper.copyTab(data.id, tab.session_id, index)
            }

            return helper.data
          })
          break
        }
        default:
          return assertNeverSilent(data)
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
  }, [getTab, getTabs, updateStoredSessions, withErrorHandling])

  const label = (() => {
    const parts: { key: string; node: ReactNode }[] = []
    if (tab.title) {
      parts.push({ key: 'title', node: <span>{tab.title}</span> })
    }
    if (tab.url && !excludedURLS.includes(tab.url)) {
      parts.push({ key: 'url', node: <span className={tabClasses.tab_url}>{tab.url}</span> })
    }
    if (!parts.length) {
      parts.push({ key: 'empty', node: <span className={tabClasses.tab_url}>Empty Tab</span> })
    }
    return parts
  })()

  return (
    <div
      className={classNames(
        tabClasses.tab,
        { [tabClasses.is_active]: tab.active },
        dragover === 'top' ? tabClasses.is_dragover_top : dragover === 'bottom' ? tabClasses.is_dragover_bottom : null
      )}
      draggable={true}
      onAuxClick={handleAuxClick}
      ref={rootRef}
    >
      {tab.pinned && <div className={tabClasses.pin} />}
      <TabFavicon url={tab.favicon_url} />
      <div className={tabClasses.tab_label}>
        {joinNodesWithIds(label, index => (
          <span className={classes.tab_separator} key={`spacer-${index}`}>
            {' — '}
          </span>
        ))}
      </div>
      <Spacer />
      <ContainerLabel id={tab.cookie_store_id} />
      <Icon className={tabClasses.tab_icon} name="close" title="Remove tab from session" {...removeHandler} />
    </div>
  )
}

const getTabData = (tab: SavedTabDescriptor): string => {
  return JSON.stringify(
    defineAll<DragSavedTabData>({
      type: DRAGGABLE_SAVED_TAB_MIME,
      id: tab.id,
      index: tab.index,
      session_id: tab.session_id,
    })
  )
}
