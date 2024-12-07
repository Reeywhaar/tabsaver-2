import React, { FunctionComponent, useRef } from 'react'

import { IS_PRODUCTION } from '@app/constants'
import { useBrowser, useDataUpdate, useStoredSessions } from '../DataProvider'
import { Diagnostics } from '@app/components/Diagnostics/Diagnostics'
import { useNotification } from '@app/components/Notifications/NotificationsContext'
import { useEvent } from '@app/hooks/useEvent'

import button from '@app/styles/button.module.scss'
import { RT_SavedSessionsDescriptor } from '@app/types'
import { useTask } from '@app/packages/task/useTask'
import { useShowError } from '@app/hooks/useShowError'
import { wrapError } from '@app/utils/wrapError'

import classes from './Options.module.scss'

export const Options: FunctionComponent = () => {
  const browser = useBrowser()
  const data = useStoredSessions()
  const { updateStoredSessions } = useDataUpdate()

  const importFileInputRef = useRef<HTMLInputElement>(null)

  const showError = useShowError()
  const notify = useNotification()

  const exportTask = useTask(_ctx => async () => {
    const serialized = JSON.stringify(data, null, 2)
    await browser.downloads.download({
      url: URL.createObjectURL(new Blob([serialized], { type: 'application/json' })),
      filename: 'data.tabsaver.json',
    })
  })

  const importTask = useTask(_ctx => async (file: File) => {
    const rawdata = JSON.parse(await file.text())
    const data = RT_SavedSessionsDescriptor.parse(rawdata, { mode: 'strip' })
    updateStoredSessions(() => data)
  })

  const handleImport = useEvent(() => {
    importFileInputRef.current?.click()
    try {
      ;(document.activeElement as any)?.blur()
    } catch {}
  })

  const handleExport = useEvent(async () => {
    try {
      await exportTask.task.call()
    } catch (e) {
      showError(wrapError(new Error('Cannot export data'), e))
    }
  })

  const handleImportChange = useEvent(async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.currentTarget.files?.item(0)
      if (!file) return
      await importTask.task.call(file)
      const ctx = notify(_ctx => ({
        level: 'info',
        description: 'Data imported successfully!',
      }))

      setTimeout(() => {
        ctx.close()
      }, 5000)
    } catch (e) {
      showError(wrapError(new Error('Cannot import data'), e))
    }
  })

  return (
    <div className={classes.content}>
      <h1>Import and Export</h1>
      <div className={classes.import}>
        <button className={button.button} onClick={handleImport}>
          Import data
        </button>
        <button className={button.button} onClick={handleExport}>
          Export data
        </button>
      </div>
      <input accept=".json" hidden={true} onChange={handleImportChange} ref={importFileInputRef} type="file" />
      {!IS_PRODUCTION && (
        <div className={classes.content}>
          <div>Diagnostics: </div>
          <Diagnostics />
        </div>
      )}
    </div>
  )
}
