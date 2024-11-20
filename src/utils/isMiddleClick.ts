export function isMiddleClick(event: unknown): event is MouseEvent {
  return event instanceof MouseEvent && event.button === 1
}
