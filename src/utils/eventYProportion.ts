/**
 * Calculates wheter event occured in bottom or top half
 * of element
 */
export function eventYProportion(event: Event & { clientY: number }, target = event.currentTarget) {
  const rect = (target as HTMLElement).getBoundingClientRect()
  const y = event.clientY - rect.y
  const proportion = y / rect.height
  return proportion >= 0.5
}
