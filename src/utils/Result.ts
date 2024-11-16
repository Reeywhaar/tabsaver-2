export type ResultOk<T> = { error: false; value: T }
export type ResultErr = { error: true; value: Error }
export type Result<T> = ResultOk<T> | ResultErr

export const resultOk = <T>(value: T): Result<T> => ({ error: false, value })
export const resultErr = (value: Error): Result<never> => ({ error: true, value })

export const isResultOk = <T>(result: Result<T>): result is ResultOk<T> => !result.error
export const isResultErr = <T>(result: Result<T>): result is ResultErr => result.error

export const asResultOk = <T>(value: Result<T>) => (value.error ? undefined : value.value)
export const asResultErr = <T>(value: Result<T>) => (value.error ? value.value : undefined)
