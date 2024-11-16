import { useLayoutEffect, useMemo, useState } from 'react'

import { ComputedValue } from './ComputedValue'
import { TrackableValue } from './TrackableValue'

type Values<T extends { value: any }[]> = {
  [Index in keyof T]: T[Index]['value']
}

export function useComputedMemo<const Arr extends TrackableValue<any>[], R>(arr: Arr, compute: (...reactives: Values<Arr>) => R) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const computed = useMemo(() => new ComputedValue(arr, compute), [])
  const [state, setState] = useState(computed.value)

  useLayoutEffect(() => {
    const unlisten = computed.listen(val => setState(val))
    return () => {
      unlisten()
      computed.unbind()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return state
}
