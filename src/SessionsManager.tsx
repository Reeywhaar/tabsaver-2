import { DEFAULT_COOKIE_STORE_ID, SESSION_KEY } from './constants'
import { createSortHandler } from './createSortHandler'
import { OutgoingMessageDescriptor, SavedSessionsDescriptor, SessionsDescriptor, TabDescriptor, WindowDescriptor } from './types'
import { isNotNil } from './utils/isNotNil'

export class SessionsManager {
  data: SessionsDescriptor
  storedData: SavedSessionsDescriptor
  logger?: typeof console
  private br: typeof browser
  private queue = Promise.resolve()

  constructor({
    browserApi,
    data = { tabs: [], windows: [] },
    storedData = { tabs: [], windows: [] },
  }: {
    browserApi: typeof browser
    data?: SessionsDescriptor
    storedData?: SavedSessionsDescriptor
  }) {
    this.br = browserApi
    this.data = data
    this.storedData = storedData

    this.tabCreatedHandler = this.wrapWithQueue(this.tabCreatedHandler)
    this.tabActivatedHandler = this.wrapWithQueue(this.tabActivatedHandler)
    this.tabMovedHandler = this.wrapWithQueue(this.tabMovedHandler)
    this.tabDetachedHandler = this.wrapWithQueue(this.tabDetachedHandler)
    this.tabAttachedHandler = this.wrapWithQueue(this.tabAttachedHandler)
    this.tabUpdatedHandler = this.wrapWithQueue(this.tabUpdatedHandler)
    this.tabReplacedHandler = this.wrapWithQueue(this.tabReplacedHandler)
    this.tabRemovedHandler = this.wrapWithQueue(this.tabRemovedHandler)
    this.windowCreatedHandler = this.wrapWithQueue(this.windowCreatedHandler)
    this.windowFocusChangedHandler = this.wrapWithQueue(this.windowFocusChangedHandler)
    this.windowRemovedHandler = this.wrapWithQueue(this.windowRemovedHandler)
  }

  async getInitialData() {
    const windows = await this.br.windows.getAll({ populate: true })
    this.data.windows.length = 0
    this.data.tabs.length = 0

    this.logger?.info('[tabsaver] [background] initial windows', windows)
    for (const window of windows) {
      if (!window.id) return
      if (window.incognito) return

      const swindow = await this.serializeWindow(window)
      if (!swindow) continue

      this.data.windows.push(swindow)
      this.data.tabs.push(...(window.tabs?.map(serializeTab).filter(isNotNil) || []))
    }

    this.sortTabs()
  }

  tabCreatedHandler = async (tab: browser.tabs.Tab) => {
    this.logger?.info('[tabsaver] [background] Tab created', tab)
    if (!tab.url || !tab.id) return

    const stab = serializeTab(tab)
    if (!stab) return

    this.data.tabs = sortTabs([...this.data.tabs, stab])
    this.sendDataUpdate()
  }

  tabActivatedHandler = async ({ tabId, windowId }: browser.tabs._OnActivatedActiveInfo) => {
    this.logger?.info('[tabsaver] [background] Tab activated', tabId)
    this.data.tabs = this.data.tabs.map(t => {
      if (t.window_id !== windowId) return t
      return { ...t, active: t.id === tabId ? true : undefined }
    })

    this.sortTabs()
    this.sendDataUpdate()
  }

  tabMovedHandler = async (tabId: number, info: browser.tabs._OnMovedMoveInfo) => {
    this.logger?.info('[tabsaver] [background] Tab moved', tabId)
    const minIndex = Math.min(info.fromIndex, info.toIndex)
    const maxIndex = Math.max(info.fromIndex, info.toIndex)

    this.data.tabs = this.data.tabs.map(t => {
      if (t.window_id !== info.windowId) return t
      return {
        ...t,
        index: t.id === tabId ? info.toIndex : t.index >= minIndex && t.index <= maxIndex ? t.index + (info.fromIndex < info.toIndex ? -1 : 1) : t.index,
      }
    })
    this.sortTabs()
    this.sendDataUpdate()
  }

  tabDetachedHandler = async (tabId: number, info: browser.tabs._OnDetachedDetachInfo) => {
    this.logger?.info('[tabsaver] [background] Tab detached', tabId)
    const tab = serializeTab(await this.br.tabs.get(tabId))
    if (!tab) throw new Error('Cannot serialize tab')
    this.data.tabs = this.data.tabs.map(t => {
      if (t.window_id !== info.oldWindowId) return t
      if (t.id === tabId) return tab
      return { ...t, index: t.index >= info.oldPosition ? t.index - 1 : t.index }
    })

    this.sortTabs()
    this.sendDataUpdate()
  }

  tabAttachedHandler = async (tabId: number, info: browser.tabs._OnAttachedAttachInfo) => {
    this.logger?.info('[tabsaver] [background] Tab detached', tabId)
    const tab = serializeTab(await this.br.tabs.get(tabId))
    if (!tab) throw new Error('Cannot serialize tab')
    this.data.tabs = this.data.tabs.map(t => {
      if (t.id === tabId) return tab
      if (t.window_id !== info.newWindowId) return t
      return { ...t, index: t.index >= info.newPosition ? t.index + 1 : t.index }
    })
    this.sortTabs()
    this.sendDataUpdate()
  }

  tabUpdatedHandler = async (tabId: number, _info: browser.tabs._OnUpdatedChangeInfo, otab: browser.tabs.Tab) => {
    this.logger?.info('[tabsaver] [background] Tab updated', tabId, otab.url)
    const tab = serializeTab(otab)
    const tabIndex = this.data.tabs.findIndex(t => t.id === tabId)
    if (!tab) {
      this.data.tabs.splice(tabIndex, 1)
    } else {
      this.data.tabs = this.data.tabs.map(t => {
        if (t.window_id !== tab.window_id) return t
        return { ...(t.id === tab.id ? tab : t) }
      })
      this.sortTabs()
    }
    this.sendDataUpdate()
  }

  tabReplacedHandler = async (addedTabId: number, removedTabId: number) => {
    this.logger?.info('[tabsaver] [background] Tab replaced', addedTabId, removedTabId)
    const tab = serializeTab(await this.br.tabs.get(addedTabId))
    if (!tab) throw new Error('Cannot serialize tab')
    this.data.tabs = this.data.tabs.map(t => {
      if (t.id === removedTabId) return tab
      return t
    })
    this.sortTabs()
    this.sendDataUpdate()
  }

  tabRemovedHandler = async (tabId: number, info: browser.tabs._OnRemovedRemoveInfo) => {
    this.logger?.info('[tabsaver] [background] Tab removed', tabId)
    const tabIndex = this.data.tabs.findIndex(t => t.id === tabId)
    if (tabIndex === -1) return
    let index = 0
    this.data.tabs.splice(tabIndex, 1)
    this.data.tabs = this.data.tabs.map(t => {
      if (t.window_id !== info.windowId) return t
      return { ...t, index: index++ }
    })
    this.sortTabs()
    this.sendDataUpdate()
  }

  windowCreatedHandler = async (window: browser.windows.Window) => {
    this.logger?.info('[tabsaver] [background] Window created', window)

    const swindow = await this.serializeWindow(window)
    if (!swindow) return
    this.data.windows.push(swindow)
    this.sendDataUpdate()
  }

  windowFocusChangedHandler = async (windowId: number) => {
    this.logger?.info('[tabsaver] [background] Window focus changed', windowId)

    this.data.windows = this.data.windows.map(w => {
      return { ...w, focused: w.id === windowId ? true : undefined }
    })
    this.sendDataUpdate()
  }

  windowRemovedHandler = async (windowId: number) => {
    this.logger?.info('[tabsaver] [background] Window removed', windowId)
    const windowIndex = this.data.windows.findIndex(w => w.id === windowId)
    if (windowIndex === -1) return
    this.data.windows.splice(windowIndex, 1)
    this.sendDataUpdate()
  }

  private sortTabs() {
    this.data.tabs = sortTabs(this.data.tabs)
  }

  sendDataUpdate() {
    this.sendMessage({ type: 'update', data: this.data, storedData: this.storedData })
  }

  sendMessage(message: OutgoingMessageDescriptor) {
    this.br.runtime.sendMessage(message)
  }

  private async serializeWindow(window: browser.windows.Window): Promise<WindowDescriptor | null> {
    if (!window.id) return null
    const session_id = asString(await this.br.sessions.getWindowValue(window.id, SESSION_KEY))
    return {
      id: window.id,
      session_id,
      focused: window.focused || undefined,
      incognito: window.incognito || undefined,
    }
  }

  private wrapWithQueue<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      const r = this.queue.catch(() => {}).then(() => fn(...args))
      this.queue = r
      return r
    }) as T
  }
}

function asString(value: any): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function sortTabs(tabs: TabDescriptor[]): TabDescriptor[] {
  return tabs.sort(createSortHandler(t => [t.window_id ? -t.window_id : 0, -t.index]))
}

function serializeTab(tab: browser.tabs.Tab): TabDescriptor | null {
  if (!tab.url || !tab.id) return null

  return {
    id: tab.id,
    url: tab.url,
    index: tab.index,
    window_id: tab.windowId,
    favicon_url: tab.favIconUrl,
    title: tab.title,
    active: tab.active || undefined,
    pinned: tab.pinned || undefined,
    cookie_store_id: tab.cookieStoreId === DEFAULT_COOKIE_STORE_ID ? undefined : tab.cookieStoreId,
  }
}
