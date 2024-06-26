export const createSortHandler = <T extends any>(weightsExtractor: (a: T) => number[]) => {
  const cache = new Map<T, number[]>()
  return (a: T, b: T) => {
    if (!cache.has(a)) cache.set(a, weightsExtractor(a))
    if (!cache.has(b)) cache.set(b, weightsExtractor(b))

    const ak = cache.get(a)!
    const bk = cache.get(b)!

    for (let i = 0; i < ak.length; i++) {
      const p1 = ak[i]
      const p2 = bk[i]
      const r = p2 - p1
      if (r !== 0) return r
    }

    return 0
  }
}
