import { act, renderHook } from '@app/tests/utils/testing'

import { ComputedValue } from './ComputedValue'
import { ReactiveValue } from './ReactiveValue'
import { useTrackableValue } from './useTrackableValue'

describe('useTrackableValue', () => {
  it('Updates', () => {
    const rvalue = new ReactiveValue(0)
    const result = renderHook(() => useTrackableValue(rvalue))
    act(() => {
      rvalue.update(v => v + 1)
    })
    expect(result.result.current).toStrictEqual(1)
  })
  it('Works wit Object', () => {
    const cl = new TestClass()
    const result = renderHook(() => useTrackableValue(cl.value))
    act(() => {
      cl.update('c')
    })
    expect(result.result.current).toStrictEqual({ a: 1, b: 'c' })
  })
  it('Works with computed', () => {
    const r1 = new ReactiveValue(1)
    const r2 = new ReactiveValue('c')
    const c = new ComputedValue([r1, r2], (r1, r2) => [r1, r2].join(':'))

    const result = renderHook(() => useTrackableValue(c))

    expect(result.result.current).toStrictEqual('1:c')

    act(() => {
      r1.update(v => v + 1)
    })

    expect(result.result.current).toStrictEqual('2:c')
  })
})

class TestClass {
  value = new ReactiveValue({ a: 1, b: 'b' })

  update(val: string) {
    this.value.update(v => ({ a: v.a, b: val }))
  }
}
