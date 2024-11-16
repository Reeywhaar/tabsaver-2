import React, { FunctionComponent, useRef } from 'react'

import { IS_PRODUCTION } from '@app/constants'
import { useBrowser, useDataUpdate, useStoredSessions } from '../DataProvider'
import { Diagnostics } from '../Diagnostics/Diagnostics'
import { useEvent } from '@app/hooks/useEvent'

import button from '@app/styles/button.module.scss'
import classes from './Options.module.scss'
import { RT_SavedSessionsDescriptor } from '@app/types'
import { useTask } from '@app/packages/task/useTask'

export const Options: FunctionComponent = () => {
  const browser = useBrowser()
  const data = useStoredSessions()
  const { updateStoredSessions } = useDataUpdate()

  const importFileInputRef = useRef<HTMLInputElement>(null)

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
  })

  const handleExport = useEvent(async () => {
    exportTask.task.call()
  })

  const handleImportChange = useEvent(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.item(0)
    if (!file) return
    importTask.task.call(file)
  })

  return (
    <div className={classes.content}>
      <div>
        <button className={button.button} onClick={handleImport}>
          Import data
        </button>
        <input accept=".json" hidden={true} onChange={handleImportChange} ref={importFileInputRef} type="file" />
      </div>
      <div>
        <button className={button.button} onClick={handleExport}>
          Export data
        </button>
      </div>
      {!IS_PRODUCTION && (
        <div className={classes.content}>
          <div>Diagnostics: </div>
          <Diagnostics />
        </div>
      )}
    </div>
  )
}
