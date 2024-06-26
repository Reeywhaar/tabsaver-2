/**
 * Binds event handler to host
 */
export function live(host: HTMLElement, selector: string, event: string, fn: (this: HTMLElement, event: Event) => unknown, capture = false) {
  host.addEventListener(
    event,
    e => {
      if (!e.target || !(e.target instanceof HTMLElement)) return
      if (e.target.matches(selector)) fn.call(e.target, e)
    },
    capture
  )
}
