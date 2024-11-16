import { useEffect, useMemo } from 'react'

import { useTrackableValue } from '@app/packages/reactives/useTrackableValue'

import { useEvent } from '@app/hooks/useEvent'

import { Task, TaskContext, TaskWorker } from './Task'

export function useRawTask<T extends TaskWorker>(task: Task<T>) {
  const value = useTrackableValue(task.value)
  const error = useTrackableValue(task.error)
  const loading = useTrackableValue(task.loading)
  const loadedAt = useTrackableValue(task.loadedAt)

  return { value, error, loading, loadedAt, task }
}

export function useTask<T extends TaskWorker>(loader: (ctx: TaskContext) => T) {
  const eloader = useEvent(loader)
  const task = useMemo(() => new Task(eloader), [eloader])

  useEffect(() => {
    return () => {
      task.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useRawTask(task)
}
