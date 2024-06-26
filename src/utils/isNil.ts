export function isNil<T>(v: T | null | undefined): v is null | undefined {
  return v === null || v === undefined
}
