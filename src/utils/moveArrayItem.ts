export function moveArrayItem<T>(arr: T[], index: number, offset: number) {
  if (offset < 0 && index + offset < 0) throw new Error('Out of bound move')
  if (offset >= 0 && index + offset > arr.length - 1) throw new Error('Out of bound move')
  const item = arr.splice(index, 1)[0]
  arr.splice(index + offset, 0, item)
  return arr
}
