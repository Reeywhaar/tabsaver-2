export function readFile(accept: string = '.json') {
  function readContent(file: File) {
    return new Promise<string>(resolve => {
      const fr = new FileReader()
      fr.onload = function (e) {
        resolve(e.target!.result as string)
      }
      fr.readAsText(file)
    })
  }
  return new Promise<string>((resolve, reject) => {
    const input = document.createElement('input')
    const host = document.body
    input.type = 'file'
    input.accept = accept
    input.value = ''
    input.style.display = 'none'
    host.appendChild(input)
    input.addEventListener(
      'change',
      async e => {
        const trg = e.target as HTMLInputElement
        const file = trg.files?.[0]
        if (!file) {
          reject(new Error('no file was selected'))
          return
        }

        try {
          resolve(await readContent(file))
        } catch (e) {
          reject(new Error('error while reading import file'))
        } finally {
          host.removeChild(input)
        }
      },
      false
    )
    input.click()
  })
}
