import { isNil } from './isNil'

export function isNotNil<T>(v: T | null | undefined): v is T {
  return !isNil(v)
}
