export const isEnter = (e?: { keyCode?: number }) => {
  return e?.keyCode === 13
}

export const isEscape = (e?: { keyCode?: number }) => {
  return e?.keyCode === 27
}
