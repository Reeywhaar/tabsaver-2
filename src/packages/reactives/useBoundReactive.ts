import { useEffect } from 'react'

import { ReactiveValue } from './ReactiveValue'

export function useBoundReactive<T>(val: T, rc: ReactiveValue<T>) {
  useEffect(() => {
    rc.update(() => val)
  }, [rc, val])
}
