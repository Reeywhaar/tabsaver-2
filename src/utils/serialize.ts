export function serialize<T = any>(object: T): T {
  return JSON.parse(JSON.stringify(object))
}
