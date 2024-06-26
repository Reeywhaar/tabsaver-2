/**
 * Bind event and removes once event occured
 */
export function once(node: HTMLElement, type: string, fn: (this: HTMLElement, event: Event) => unknown, capture = false) {
  return node.addEventListener(
    type,
    function handler(e) {
      node.removeEventListener(type, handler)
      return fn.call(node, e)
    },
    capture
  )
}
