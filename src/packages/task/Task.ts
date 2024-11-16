import { isAbortError } from '@app/errors/AbortError'

import { asError } from '@app/utils/asError'

import { ReactiveValue } from '@app/packages/reactives/ReactiveValue'

export type TaskContext = {
  abortController: AbortController
  state: TaskState
}

export type TaskWorker = (...args: any[]) => Promise<any>
export type TaskCreator<L extends TaskWorker> = (ctx: TaskContext) => L

export class Task<L extends TaskWorker> {
  readonly value = new ReactiveValue<Awaited<ReturnType<L>> | undefined>(undefined)
  readonly error = new ReactiveValue<Error | null>(null)
  readonly loading = new ReactiveValue<boolean>(false)
  readonly loadedAt = new ReactiveValue<Date | null>(null)

  private abortController: AbortController | undefined = undefined
  private taskCreator: TaskCreator<L>
  private state: TaskState = new TaskState()

  constructor(taskCreator: TaskCreator<L>) {
    this.taskCreator = taskCreator
  }

  call(...args: Parameters<L>): Promise<Awaited<ReturnType<L> | undefined>> {
    this.abort()
    const abortController = new AbortController()
    this.abortController = abortController
    this.loading.update(() => true)
    this.error.update(() => null)
    const ctx: TaskContext = { abortController, state: this.state }
    return this.taskCreator(ctx)(...args)
      .then(value => {
        if (abortController.signal.aborted) return
        this.value.update(() => value)
        this.loadedAt.update(() => new Date())
        this.error.update(() => null)
        return value
      })
      .catch(e => {
        if (isAbortError(e)) return
        if (abortController.signal.aborted) return
        this.error.update(() => asError(e))
        throw e
      })
      .finally(() => {
        if (abortController.signal.aborted) return
        this.loading.update(() => false)
      })
  }

  abort(): void {
    this.abortController?.abort()
    this.abortController = undefined
    this.loading.update(() => false)
  }

  reset() {
    this.abort()
    this.state = new TaskState()
    this.value.update(() => undefined)
    this.error.update(() => null)
    this.loading.update(() => false)
    this.loadedAt.update(() => null)
  }
}

class TaskState<S = unknown> {
  value: S | undefined
  constructor() {
    this.value = undefined
  }

  as<B>() {
    return this as any as TaskState<B>
  }
}
