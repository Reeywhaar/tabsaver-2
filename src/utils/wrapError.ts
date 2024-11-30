export function wrapError(e: Error, cause?: unknown): Error {
  e.cause = cause
  return e
}
