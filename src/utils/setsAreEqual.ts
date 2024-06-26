/**
 * Checks if two arrays are contain same elements
 */
export function setsAreEqual<T>(setA: T[], setB: T[]) {
  setB = setB.slice(0)
  if (setA.length !== setB.length) return false

  for (const item of setA) {
    if (setB.length < 1) return false
    const index = setB.indexOf(item)
    if (index === -1) return false
    setB.splice(index, 1)
  }
  return true
}
