export function parseQuery(query: string) {
  return query
    .substring(1) // remove "?"
    .split('&')
    .map(x => {
      return x.split('=').map(x => decodeURIComponent(x))
    })
    .reduce<Record<string, any>>((c, [key, value]) => {
      if (key) c[key] = value
      return c
    }, {})
}
