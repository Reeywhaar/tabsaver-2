import { AbortError } from '@app/errors/AbortError'

/** puts eventloop task to sleep */
export function sleep(ms: number = 1000, abortSignal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    let resolved = false
    const timeout = setTimeout(() => {
      if (resolved) return
      resolved = true

      resolve()
    }, ms)
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        if (resolved) return
        resolved = true

        clearTimeout(timeout)
        reject(new AbortError('Sleep was aborted'))
      })
    }
  })
}
