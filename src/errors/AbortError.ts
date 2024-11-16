import { checkErrorRecursively } from '@app/utils/checkErrorRecursively'

export class AbortError extends Error {
  constructor(message: string = 'Operation was aborted') {
    super(message)
  }
}

export const isAbortError = (e: unknown) =>
  checkErrorRecursively(e, e => {
    if (e instanceof Error && /operation was aborted/i.test(e.message)) return true
    if (e instanceof AbortError) return true
    return e instanceof Error && e.name === 'AbortError'
  })

export function skipAbortError(e: unknown) {
  if (isAbortError(e)) return undefined
  throw e
}

export function excludeAbortError(e: Error) {
  if (isAbortError(e)) return null
  return e
}
