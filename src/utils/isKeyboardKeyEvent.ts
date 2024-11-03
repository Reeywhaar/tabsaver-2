const KEYS_MAP = {
  Escape: 27,
  Tab: 9,
  Enter: 13,
  Backspace: 8,
}

type Key = keyof typeof KEYS_MAP

export function isKeyboardKeyEvent(key: Key, event: object | undefined | null) {
  if (!event || typeof event !== 'object') return false
  return (event as any)['key'] === key || (event as any)['keyCode'] === KEYS_MAP[key]
}
