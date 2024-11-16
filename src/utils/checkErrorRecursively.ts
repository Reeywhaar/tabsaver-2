export function checkErrorRecursively(e: unknown, check: (e: unknown) => boolean): boolean {
  if (check(e)) return true
  if (e instanceof Error && e.cause) return checkErrorRecursively(e.cause, check)
  return false
}
