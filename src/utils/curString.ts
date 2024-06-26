export function cutString(str: string, len: number, ellipsis = '') {
  if (str.length <= len) return str
  return str.substring(0, len - ellipsis.length) + ellipsis
}
