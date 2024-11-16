export interface TrackableValue<R> {
  get value(): R
  listen: (listener: (val: R) => unknown) => () => void
}
