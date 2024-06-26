declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.module.scss' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.css' {
  export default undefined
}

declare module '*.scss' {
  export default undefined
}

declare module '*.sass' {
  export default undefined
}

declare module '*.less' {
  export default undefined
}
