export function unimplemented<T>(label: string = 'Unimplemented'): T {
  if (label) throw new Error(`Unimplemented: ${label}`)
  throw new Error('Unimplemented')
}
