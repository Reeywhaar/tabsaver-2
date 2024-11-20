import { v4 } from 'uuid'
import { DEFAULT_COOKIE_STORE_ID, SESSION_KEY } from './constants'
import { createSortHandler } from './createSortHandler'
import {
  OutgoingMessageDescriptor,
  SavedSessionsDescriptor,
  SavedTabDescriptor,
  SavedWindowDescriptor,
  SessionsDescriptor,
  TabDescriptor,
  WindowDescriptor,
} from './types'
import { defineAll } from './utils/defineAll'
import { isNil } from './utils/isNil'
import { isNotNil } from './utils/isNotNil'
import { promiseIntoResult } from './utils/intoResult'
import { asResultOk } from './utils/Result'
import { convertStoredTabToTabCreateProperties } from './utils/convertStoredTabToTabCreateProperties'
import { convertTabToStoredTab } from './utils/convertTabToStoredTab'

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
    this.data.windows = []
    this.data.tabs = []

    this.storedData = (await this.getStoredData()) ?? this.storedData

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

  async openStoredSession(id: string) {
    if (this.data.windows.find(w => w.session_id === id)) {
      this.logger?.info(`[tabsaver] [background] Session ${id} is already opened`)
      return
    }
    const window = this.storedData.windows.find(w => w.session_id === id)
    if (!window) throw new Error(`Session ${id} not found`)
    const tabs = this.storedData.tabs.filter(t => t.window_session_id === id)
    const cwindow = await this.br.windows.create()
    if (!cwindow.id) throw new Error('Window id is not defined')
    await this.setWindowSession(cwindow.id, id)
    let wtab = cwindow.tabs?.at(0) ?? null
    for (const tab of tabs) {
      await this.br.tabs.create({
        ...convertStoredTabToTabCreateProperties(tab),
        windowId: cwindow.id,
      })
      if (wtab?.id) {
        await this.br.tabs.remove(wtab.id)
        wtab = null
      }
    }
    this.storedData.windows = this.storedData.windows.map(w => (w.session_id === id ? { ...w, associated_window_id: cwindow.id } : w))
    await this.triggerUpdate()
  }

  async linkWindow(windowId: number) {
    const window = await this.br.windows.get(windowId)
    if (!window.id) return
    const tabs = await this.br.tabs.query({ windowId: window.id })
    const date = new Date()
    const swindow: SavedWindowDescriptor = {
      session_id: v4(),
      associated_window_id: window.id,
      title: `New session at ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
      position: window.left && window.top ? { left: window.left, top: window.top } : undefined,
      size: window.width && window.height ? { width: window.width, height: window.height } : undefined,
    }
    const stabs = (
      await Promise.all(
        tabs.map(t => {
          const stab = serializeTab(t)
          if (!stab) return null
          return this.convertTabToStoredTab(stab)
        })
      )
    ).filter(isNotNil)
    this.storedData.windows.push(swindow)
    this.storedData.tabs.push(...stabs)
    await this.setWindowSession(window.id, swindow.session_id)
    this.sortTabs()
    await this.triggerUpdate()
  }

  async unlinkStoredSession(sessionId: string) {
    this.data.windows = this.data.windows.map(w => (w.session_id === sessionId ? { ...w, session_id: undefined } : w))
    this.storedData.tabs = this.storedData.tabs.filter(t => t.window_session_id !== sessionId)
    this.storedData.windows = this.storedData.windows.filter(w => w.session_id !== sessionId)
    await this.triggerUpdate()
  }

  tabCreatedHandler = async (tab: browser.tabs.Tab) => {
    this.logger?.info('[tabsaver] [background] Tab created', tab)
    if (!tab.url || !tab.id) return

    const stab = serializeTab(tab)
    if (!stab) return

    this.data.tabs = sortTabs([...this.data.tabs, stab])
    await this.triggerUpdate()
  }

  tabActivatedHandler = async ({ tabId, windowId }: browser.tabs._OnActivatedActiveInfo) => {
    this.logger?.info('[tabsaver] [background] Tab activated', tabId)
    this.data.tabs = this.data.tabs.map(t => {
      if (t.window_id !== windowId) return t
      return { ...t, active: t.id === tabId ? true : undefined }
    })

    this.sortTabs()
    await this.triggerUpdate()
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
    await this.triggerUpdate()
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
    await this.triggerUpdate()
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
    await this.triggerUpdate()
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
    await this.triggerUpdate()
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
    await this.triggerUpdate()
  }

  tabRemovedHandler = async (tabId: number, info: browser.tabs._OnRemovedRemoveInfo) => {
    if (info.isWindowClosing) {
      this.data.tabs = this.data.tabs.filter(t => t.window_id !== info.windowId)
      this.data.windows = this.data.windows.filter(w => w.id !== info.windowId)
    } else {
      this.logger?.info('[tabsaver] [background] Tab removed', tabId)
      const tabIndex = this.data.tabs.findIndex(t => t.id === tabId)
      if (tabIndex === -1) return
      let index = 0
      this.data.tabs.splice(tabIndex, 1)
      this.data.tabs = this.data.tabs.map(t => {
        if (t.window_id !== info.windowId) return t
        return { ...t, index: index++ }
      })
    }
    this.sortTabs()
    await this.triggerUpdate()
  }

  windowCreatedHandler = async (window: browser.windows.Window) => {
    this.logger?.info('[tabsaver] [background] Window created', window)

    const swindow = await this.serializeWindow(window)
    if (!swindow) return
    this.data.windows.push(swindow)
    await this.triggerUpdate()
  }

  windowFocusChangedHandler = async (windowId: number) => {
    this.logger?.info('[tabsaver] [background] Window focus changed', windowId)

    this.data.windows = this.data.windows.map(w => {
      return { ...w, focused: w.id === windowId ? true : undefined }
    })
    await this.triggerUpdate()
  }

  windowRemovedHandler = async (windowId: number) => {
    this.logger?.info('[tabsaver] [background] Window removed', windowId)
    const windowIndex = this.data.windows.findIndex(w => w.id === windowId)
    if (windowIndex === -1) return
    this.data.windows.splice(windowIndex, 1)
    await this.triggerUpdate()
  }

  private sortTabs() {
    this.data.tabs = sortTabs(this.data.tabs)
  }

  async triggerUpdate() {
    await this.updateStoredData()
    this.sendMessage({ type: 'update', data: this.data, storedData: this.storedData })
  }

  async updateStoredData() {
    const openedStoredWindows = this.data.windows.filter(w => !!w.session_id)
    const openedStoredWindowsSessionIds = openedStoredWindows.map(w => w.session_id)
    const storedWindowsIds = openedStoredWindows.map(w => w.id)
    const inactiveStoredWindows = this.storedData.windows.filter(w => !openedStoredWindowsSessionIds.includes(w.session_id))
    const inactiveStoredWindowsIds = inactiveStoredWindows.map(w => w.session_id)
    const tabsToStore = this.data.tabs.filter(t => isNotNil(t.window_id) && storedWindowsIds.includes(t.window_id))
    const newStoredTabs = (await Promise.all(tabsToStore.map(t => this.convertTabToStoredTab(t)))).filter(isNotNil)
    const storedTabs = [...this.storedData.tabs.filter(t => inactiveStoredWindowsIds.includes(t.window_session_id))]

    this.storedData.tabs = sortStoredTabs([...storedTabs, ...newStoredTabs])
    this.setStoredData(this.storedData)
  }

  sendMessage(message: OutgoingMessageDescriptor) {
    this.br.runtime.sendMessage(message)
  }

  private async serializeWindow(window: browser.windows.Window): Promise<WindowDescriptor | null> {
    if (!window.id) return null
    const session_id = (await this.getWindowSession(window.id)) ?? undefined
    return defineAll<WindowDescriptor>({
      id: window.id,
      session_id,
      focused: window.focused || undefined,
      incognito: window.incognito || undefined,
    })
  }

  private wrapWithQueue<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      const r = this.queue.catch(() => {}).then(() => fn(...args))
      this.queue = r
      return r
    }) as T
  }

  async convertTabToStoredTab(tab: TabDescriptor): Promise<SavedTabDescriptor | null> {
    if (isNil(tab.id) || isNil(tab.window_id) || !tab.url) return null
    const sessionId = await this.getWindowSession(tab.window_id)
    if (!sessionId) return null
    return convertTabToStoredTab(sessionId, tab)
  }

  async getWindowSession(windowId?: number): Promise<string | null> {
    if (isNil(windowId)) return null
    return asString(await this.br.sessions.getWindowValue(windowId, SESSION_KEY)) ?? null
  }

  async setWindowSession(windowId: number, id: string): Promise<void> {
    await this.br.sessions.setWindowValue(windowId, SESSION_KEY, id)
    this.data.windows = this.data.windows.map(w => (w.id === windowId ? { ...w, session_id: id } : w))
  }
  async unsetWindowSession(windowId: number): Promise<void> {
    await this.br.sessions.removeWindowValue(windowId, SESSION_KEY)
    this.data.windows = this.data.windows.map(w => (w.id === windowId ? { ...w, session_id: undefined } : w))
  }

  async getStoredData() {
    return asResultOk(await promiseIntoResult(this.br.storage.local.get('storedData')))?.storedData
  }

  async setStoredData(data: SavedSessionsDescriptor) {
    try {
      await this.br.storage.local.set({ storedData: data })
    } catch (e) {
      // todo: handle error
    }
  }
}

function asString(value: any): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function sortTabs(tabs: TabDescriptor[]): TabDescriptor[] {
  return tabs.sort(createSortHandler(t => [t.window_id ? -t.window_id : 0, -t.index]))
}

function sortStoredTabs(tabs: SavedTabDescriptor[]): SavedTabDescriptor[] {
  return tabs.sort((a, b) => {
    const cw = a.window_session_id.localeCompare(b.window_session_id)
    if (cw !== 0) return cw
    return a.index - b.index
  })
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
