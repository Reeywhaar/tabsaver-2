import { useLayoutEffect, useState } from 'react'

import { TrackableValue } from './TrackableValue'

export const useTrackableValue = <T>(rvalue: TrackableValue<T>) => {
  const [value, setValue] = useState(rvalue.value)

  useLayoutEffect(() => {
    const unlisten = rvalue.listen(setValue)
    return () => {
      unlisten()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return value
}
