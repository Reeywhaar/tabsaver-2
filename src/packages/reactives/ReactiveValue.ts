import { TrackableValue } from './TrackableValue'

export class ReactiveValue<T> implements TrackableValue<T> {
  private rawvalue: T
  private listeners: ((value: T) => void)[] = []

  constructor(value: T) {
    this.rawvalue = value
  }

  get value() {
    return this.rawvalue
  }

  checkEqual = (a: T, b: T) => a === b

  update(updater: (value: T) => T) {
    const newValue = updater(this.rawvalue)
    if (this.checkEqual(newValue, this.rawvalue)) return
    this.rawvalue = newValue
    this.listeners.forEach(l => l(this.rawvalue))
  }

  listen(listener: (value: T) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }
}
