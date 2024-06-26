export function arrayFirst<T>(array: ArrayLike<T>, fn: (v: T) => boolean) {
  return Array.from(array).find(fn) || null
}
