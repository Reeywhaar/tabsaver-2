export async function tryOR<T>(fn: () => T, def: T): Promise<T>
export async function tryOR<T>(fn: () => T, def?: T): Promise<T | null>
export async function tryOR<T>(fn: () => T, def: T | null = null) {
  try {
    return await fn()
  } catch (e) {
    return def
  }
}
