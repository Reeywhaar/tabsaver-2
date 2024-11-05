/**
 * Function to declare ans track optional parameters in object
 *
 * @example
 * type Text = {
 *   optional?: string
 *   required: number
 * }
 *
 * // error
 * defineAll<Text>({
 *   required: 1
 * })
 *
 * // pass
 * defineAll<Text>({
 *   optional: undefined,
 *   required: 1
 * })
 */
export function defineAll<T extends {}>(obj: DefineAll<T>): T {
  const newObj = {} as T
  for (const key in obj) {
    if (Reflect.has(obj, key)) {
      if (typeof obj[key] !== 'undefined') {
        newObj[key] = obj[key]
      }
    }
  }
  return newObj
}

type DefineAll<T extends {}> = {
  [K in keyof Required<T>]: T[K] extends undefined ? T[K] | undefined : T[K]
}
