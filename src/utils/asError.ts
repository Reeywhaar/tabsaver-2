export function asError(e: unknown) {
  if (e instanceof Error) {
    return e
  }

  if (typeof e === 'string') {
    return new Error(e)
  }

  return new Error('Unknown error', { cause: e })
}
