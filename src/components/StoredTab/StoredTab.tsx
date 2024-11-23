import React, { FunctionComponent, MouseEventHandler, useEffect, useRef } from 'react'
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

  return (
    <div className={tabClasses.tab} draggable={true} onAuxClick={handleAuxClick} ref={rootRef}>
      {tab.pinned && <div className={tabClasses.pin} />}
      <TabFavicon url={tab.favicon_url} />
      <div className={tabClasses.tab_label}>
        {tab.title ?? tab.id} <span className={tabClasses.tab_url}>{tab.url}</span>
      </div>
      <Spacer />
      <Icon className={tabClasses.tab_icon} name="close" {...removeHandler} />
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
