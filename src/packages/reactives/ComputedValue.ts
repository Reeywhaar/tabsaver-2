import { TrackableValue } from './TrackableValue'

type Values<T extends { value: any }[]> = {
  [Index in keyof T]: T[Index]['value']
}

export class ComputedValue<const Arr extends TrackableValue<any>[], R> implements TrackableValue<R> {
  private rawvalue!: R
  private prevValues: Values<Arr> | null = null
  private reactives: Arr = [] as any
  private compute: (...reactives: Values<Arr>) => R
  private listeners: ((value: R) => void)[] = []
  private subscriptions: (() => void)[] = []

  checkEqual = (a: R, b: R) => a === b

  get value() {
    if (!this.prevValues) {
      const values = this.reactives.map(r => r.value) as Values<Arr>
      this.rawvalue = this.compute(...values)
      this.prevValues = values
    }
    return this.rawvalue
  }

  constructor(reactives: Arr, compute: (...reactives: Values<Arr>) => R) {
    this.compute = compute
    this.reactives = reactives

    for (const reactive of reactives) {
      this.subscriptions.push(
        reactive.listen(() => {
          if (!this.prevValues) return
          this.updateValue()
        })
      )
    }
  }

  listen(listener: (value: R) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  unbind() {
    this.subscriptions.forEach(s => s())
    this.subscriptions = []
  }

  private updateValue() {
    const values = this.reactives.map(r => r.value) as Values<Arr>
    if (this.prevValues && this.compareValues(values, this.prevValues)) return
    this.prevValues = values
    const newValue = this.compute(...values)
    if (this.checkEqual(newValue, this.rawvalue)) return
    this.rawvalue = newValue
    this.listeners.forEach(l => l(this.rawvalue))
  }

  private compareValues(a: Values<Arr>, b: Values<Arr>) {
    const maxLength = Math.max(a.length, b.length)
    for (let i = 0; i < maxLength; i++) {
      if (a[i] !== b[i]) return false
    }
    return true
  }
}
