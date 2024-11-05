type Remapper<A extends {}, B extends {}> = { [K in keyof Required<A>]: (val: A[K]) => Partial<B> }

export function remapObject<A extends {}, B extends {}>(a: A, mapper: Remapper<A, B>) {
  let result = {} as B
  for (const key in mapper) {
    if (Reflect.has(mapper, key)) {
      result = { ...result, ...mapper[key](a[key]) }
    }
  }
  return result
}
