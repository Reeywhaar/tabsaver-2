import React, { FormEventHandler, FunctionComponent, KeyboardEventHandler, useEffect, useRef, useState } from 'react'
import { PopupControls } from '../Popup/types'
import { Popup } from '../Popup/Popup'

import classes from './RenamePopup.module.scss'
import { useEvent } from '@app/hooks/useEvent'
import { useWithErrorHandling } from '@app/hooks/useShowError'
import { isEnter, isEscape } from '@app/utils/isKeyboardKey'

export const RenamePopup: FunctionComponent<{ ctx: PopupControls; value: string; onUpdate: (value: string) => unknown }> = ({
  ctx,
  value: initialValue,
  onUpdate,
}) => {
  const [value, setValue] = useState(initialValue)
  const withErrorHandling = useWithErrorHandling()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useEvent<FormEventHandler<HTMLInputElement>>(e => {
    setValue(e.currentTarget.value)
  })

  const handleEnterKey = useEvent(
    withErrorHandling<KeyboardEventHandler<HTMLInputElement>>(async e => {
      if (isEnter(e)) {
        const val = value.trim()
        if (!val) throw new Error('Please provide a name')
        await onUpdate(val)
      }
      if (isEscape(e)) {
        e.preventDefault()
        e.stopPropagation()
        ctx.close()
      }
    })
  )

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <Popup controls={ctx}>
      <div className={classes.content}>
        <input className={classes.input} onInput={handleChange} onKeyUp={handleEnterKey} placeholder="Name" ref={inputRef} type="text" value={value} />
      </div>
    </Popup>
  )
}
