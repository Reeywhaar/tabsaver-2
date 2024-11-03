import { KeyboardEvent, MouseEvent, useMemo } from 'react'

import { isKeyboardKeyEvent } from '@app/utils/isKeyboardKeyEvent'

import { useEvent } from './useEvent'

/**
 * @returns object with onClick and onKeyDown (which reacts to Enter) callbacks,
 *
 * Suggested to use as object desctructured parameter:
 * ```
 * const evHandles = useClickHandler(...)
 *
 * return <button {...evHandlers}></button>
 * ````
 *
 * Note that it calls both `preventDefault` and `stopPropagation` and adds tabIndex=0 property
 */
export const useClickHandler = <E extends HTMLElement = HTMLElement>(fn: (e: MouseEvent<E> | KeyboardEvent<E>) => unknown, preventDefault = true) => {
  const handleAction = useEvent(createHandler(fn, preventDefault))

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => ({ onClick: handleAction, onKeyDown: handleAction, tabIndex: 0 }), [])
}

export const createClickHandler = <E extends HTMLElement = HTMLElement>(fn: (e: MouseEvent<E> | KeyboardEvent<E>) => unknown, preventDefault = true) => {
  const handleAction = createHandler(fn, preventDefault)
  return { onClick: handleAction, onKeyDown: handleAction, tabIndex: 0 }
}

const createHandler =
  <E extends HTMLElement = HTMLElement>(fn: (e: MouseEvent<E> | KeyboardEvent<E>) => unknown, preventDefault = true) =>
  (e: MouseEvent<E> | KeyboardEvent<E>) => {
    if ('keyCode' in e && !isKeyboardKeyEvent('Enter', e)) return
    if (preventDefault) {
      e.preventDefault()
      e.stopPropagation()
    }
    fn(e)
  }
