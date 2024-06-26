export function strAfter(str: string, search: string) {
  if (str.indexOf(search) === -1) return str
  return str.substring(str.indexOf(search) + search.length)
}
