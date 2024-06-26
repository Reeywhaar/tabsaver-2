export function findParent(el: HTMLElement, selector: string) {
  while (el !== document.body.parentElement) {
    if (el.matches(selector)) return el
    if (!el.parentElement) return null
    el = el.parentElement
  }
  return null
}
