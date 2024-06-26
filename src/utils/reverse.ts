export function* reverse<T>(iterable: T[]) {
  const len = iterable.length
  for (let i = len - 1; i >= 0; i--) {
    yield iterable[i]
  }
}
