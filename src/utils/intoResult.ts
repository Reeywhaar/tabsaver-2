import { asError } from './asError'
import { Result, resultErr, resultOk } from './Result'

export function intoResult<T>(cb: () => T): Result<T> {
  try {
    return resultOk(cb())
  } catch (e) {
    return resultErr(asError(e))
  }
}

export function promiseIntoResult<T>(promise: Promise<T>): Promise<Result<T>> {
  return promise.then(resultOk).catch(e => {
    return resultErr(asError(e))
  })
}
