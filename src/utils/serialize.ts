export function serialize<T = any>(object: T) {
  return JSON.parse(JSON.stringify(object))
}
