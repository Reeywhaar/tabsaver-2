import { useEffect, useMemo } from 'react'

import { ReactiveValue } from './ReactiveValue'

export function useTrackedValue<T>(val: T) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reactive = useMemo(() => new ReactiveValue(val), [])

  useEffect(() => {
    reactive.update(() => val)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [val])

  return reactive
}
