export function debounce<T extends (...args: any[]) => unknown>(fn: T, delay: number, immediate: boolean = false) {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    const cb = () => {
      timeout = null
      if (!immediate) fn(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout ?? undefined)
    timeout = setTimeout(cb, delay)
    if (callNow) fn(...args)
  }
}
