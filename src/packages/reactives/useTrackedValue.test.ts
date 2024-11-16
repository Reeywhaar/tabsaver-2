import { useState } from 'react'

import { act, renderHook } from '@app/tests/utils/testing'

import { useTrackedValue } from './useTrackedValue'

describe('useTrackedValue', () => {
  it('Works', () => {
    const render = renderHook(() => useHook())
    expect(render.result.current.reactive.value).toStrictEqual(0)

    act(() => {
      render.result.current.setVal(1)
    })

    expect(render.result.current.reactive.value).toStrictEqual(1)
  })
})

const useHook = () => {
  const [val, setVal] = useState(0)

  const reactive = useTrackedValue(val)
  return { reactive, setVal }
}
