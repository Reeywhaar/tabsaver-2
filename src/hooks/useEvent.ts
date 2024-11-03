import { useCallback, useRef } from 'react'

export const useEvent = <T extends (...args: any[]) => any>(fn: T): T => {
  const fnRef = useRef(fn)
  fnRef.current = fn

  return useCallback((...args: any[]) => {
    return fnRef.current(...args)
  }, []) as T
}
