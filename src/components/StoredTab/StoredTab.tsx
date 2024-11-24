import React, { FunctionComponent, MouseEventHandler, ReactNode, useEffect, useRef } from 'react'
import { SavedTabDescriptor, SavedWindowDescriptor } from '@app/types'

import { Spacer } from '../Spacer/Spacer'
import { Icon } from '../Icon/Icon'
import { useDataUpdate } from '../DataProvider'
import { useClickHandler } from '@app/hooks/useClickHandler'

import tabClasses from '../Tab/Tab.module.scss'
import { DragSavedTabData } from '@app/utils/tabData'
import { defineAll } from '@app/utils/defineAll'
import { DRAGGABLE_SAVED_TAB_MIME } from '@app/constants'
import { useEvent } from '@app/hooks/useEvent'
import { isMiddleClick } from '@app/utils/isMiddleClick'
import { ConfirmPopup } from '../ConfirmPopup/ConfirmPopup'
import { usePush } from '../Popup/PopupContext'

import classes from './StoredTab.module.scss'
import { TabFavicon } from '../TabFavicon/TabFavicon'
import { ContainerLabel } from '../ContainerLabel/ContainerLabel'
import { joinNodesWithIds } from '@app/utils/joinNodes'
import { excludedURLS } from '../Tab/Tab'

export type StoredTabProps = {
  tab: SavedTabDescriptor
  window: SavedWindowDescriptor
}

export const StoredTab: FunctionComponent<StoredTabProps> = ({ tab }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const { updateStoredSessions } = useDataUpdate()
  const push = usePush()

  const getTab = useEvent(() => tab)

  const remove = useEvent(() => {
    push(controls => (
      <ConfirmPopup
        controls={controls}
        onConfirm={() => {
          updateStoredSessions(stored => ({ ...stored, tabs: stored.tabs.filter(t => t.id !== tab.id) }))
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
    <div className={tabClasses.tab} draggable={true} onAuxClick={handleAuxClick} ref={rootRef}>
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
