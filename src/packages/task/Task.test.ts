import { sleep } from '@app/utils/sleep'

import { Task } from './Task'

describe('Task', () => {
  it('Works', async () => {
    const task = new Task(ctx => async (a: number, b: number) => {
      await sleep(100, ctx.abortController.signal)
      return a + b
    })

    const result = await task.call(1, 2)
    expect(result).toBe(3)
  })
  it('Aborts', async () => {
    const task = new Task(ctx => async (a: number, b: number) => {
      await sleep(100, ctx.abortController.signal)
      return a + b
    })

    sleep(50).then(() => task.abort())

    const result = await task.call(1, 2)
    expect(result).toBeUndefined()
  })
  it('Works with state', async () => {
    const task = new Task(ctx => async () => {
      await sleep(100, ctx.abortController.signal)
      const nstate = ctx.state.as<number>()
      if (typeof nstate.value === 'undefined') nstate.value = 0
      return ++nstate.value
    })

    expect(await task.call()).toStrictEqual(1)
    expect(await task.call()).toStrictEqual(2)
  })
})
