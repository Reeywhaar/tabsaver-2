export async function processListeners(listeners: ((key: string, value: any) => unknown)[], key: string, value: any, blocking = false) {
  let error: unknown | null = null
  for (const cb of listeners) {
    try {
      if (blocking) {
        await cb(key, value)
      } else {
        cb(key, value)
      }
    } catch (e) {
      if (isDeadObjectError(e)) {
        listeners.splice(listeners.indexOf(cb), 1)
      } else if (!error) error = e
    }
  }
  if (error) throw error
}

function isDeadObjectError(e: any) {
  return e instanceof TypeError && e.message === "can't access dead object"
}
