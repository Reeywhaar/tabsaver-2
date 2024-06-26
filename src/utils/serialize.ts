export function serialize(object: any) {
  return JSON.parse(JSON.stringify(object))
}
