import { ComputedValue } from './ComputedValue'
import { ReactiveValue } from './ReactiveValue'

describe('ComputedValue', () => {
  it('Works', () => {
    const r1 = new ReactiveValue(1)
    const r2 = new ReactiveValue('b')
    const c = new ComputedValue([r1, r2], (r1, r2) => [r1, r2].join(':'))
    expect(c.value).toBe('1:b')

    r1.update(v => v + 1)
    expect(c.value).toStrictEqual('2:b')
  })
  it('Call listener on value changed', () => {
    const r1 = new ReactiveValue({ first: 1, second: 'a' })
    const c = new ComputedValue([r1], r1 => r1.second)
    const listener = jest.fn()
    c.listen(listener)
    expect(c.value).toBe('a')

    r1.update(v => ({ ...v, second: 'b' }))
    expect(listener).toHaveBeenCalledTimes(1)
    expect(c.value).toStrictEqual('b')
  })
  it('Skips update if value unchanged', () => {
    const r1 = new ReactiveValue({ first: 1, second: 'a' })
    const c = new ComputedValue([r1], r1 => r1.second)
    const listener = jest.fn()
    c.listen(listener)
    expect(c.value).toBe('a')

    r1.update(v => ({ first: v.first + 1, second: v.second }))
    expect(listener).not.toHaveBeenCalled()
    expect(c.value).toStrictEqual('a')
  })
  it('Takes computed', () => {
    const r1 = new ReactiveValue(1)
    const r2 = new ReactiveValue(2)
    const c1 = new ComputedValue([r1, r2], (r1, r2) => r1 + r2)
    const c2 = new ComputedValue([c1], c1 => c1 + 1)
    expect(c2.value).toBe(4)

    r1.update(v => v + 1)
    expect(c2.value).toStrictEqual(5)
  })
})
