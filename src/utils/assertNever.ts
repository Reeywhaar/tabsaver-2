export const assertNever = (_v: never, error: Error = new Error('Unexpected case reached')): never => {
  throw error
}

export const assertNeverSilent = (_v: never): void => {
  return undefined
}
