export class URLMangler {
  private br: typeof browser

  constructor(br: typeof browser) {
    this.br = br
  }

  getMangledURL(url: string) {
    return this.br.runtime.getURL(`/dist/handler.html?url=${encodeURIComponent(url)}`)
  }
}
