import { act, renderHook } from '@app/tests/utils/testing'

import { ReactiveValue } from './ReactiveValue'
import { useComputedMemo } from './useComputedMemo'

describe('useComputedMemo', () => {
  it('Works', () => {
    const r1 = new ReactiveValue(1)
    const r2 = new ReactiveValue('c')
    const result = renderHook(() => useComputedMemo([r1, r2], (r1, r2) => [r1, r2].join(':')))

    expect(result.result.current).toStrictEqual('1:c')

    act(() => {
      r1.update(v => v + 1)
    })

    expect(result.result.current).toStrictEqual('2:c')
  })
})
