import { v4 } from 'uuid'
import { ASSOCIATED_SESSION_KEY, DEFAULT_COOKIE_STORE_ID } from './constants'
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
import { asError } from './utils/asError'
import { URLMangler } from './URLMangler'

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
    const windows = await this.br.windows.getAll({ populate: true, windowTypes: ['normal'] })
    this.data.windows = []
    this.data.tabs = []

    this.storedData = (await this.getStoredData()) ?? this.storedData

    this.logger?.info('[tabsaver] [background] initial windows', windows)
    for (const window of windows) {
      if (!window.id) return

      const swindow = await this.serializeWindow(window)
      if (!swindow) continue

      this.data.windows.push(swindow)
      this.data.tabs.push(...(window.tabs?.map(serializeTab).filter(isNotNil) || []))
    }

    this.sortTabs()
  }

  async openStoredSession(id: string) {
    const session = this.storedData.windows.find(w => w.session_id === id)
    if (session?.associated_window_id && this.data.windows.find(w => w.associated_window_id === session?.associated_window_id)) {
      this.logger?.info(`[tabsaver] [background] Session ${id} is already opened`)
      return
    }
    if (!session) throw new Error(`Session ${id} not found`)
    const tabs = this.storedData.tabs.filter(t => t.session_id === id)
    const cwindow = await this.br.windows.create()
    if (!cwindow.id) throw new Error('Window id is not defined')
    const associated_id = v4()
    await this.setWindowAssociatedWindowId(cwindow.id, associated_id)
    this.setSessionAssociatedWindowId(session.session_id, associated_id)
    let wtab = cwindow.tabs?.at(0) ?? null
    for (const tab of tabs) {
      try {
        await this.openTab(tab, cwindow.id)
        if (wtab?.id) {
          await this.br.tabs.remove(wtab.id)
          wtab = null
        }
      } catch (e) {
        this.sendMessage({ type: 'error', message: asError(e).message })
      }
    }
    await this.triggerUpdate()
  }

  async openTab(tab: SavedTabDescriptor, windowId: number) {
    let props = convertStoredTabToTabCreateProperties(tab)
    try {
      await this.br.tabs.create({ ...props, windowId })
    } catch (e) {
      const mangler = new URLMangler(this.br)
      props = { ...props, url: mangler.getMangledURL(props.url!) }
      await this.br.tabs.create({ ...props, windowId })
    }
  }

  async linkWindow(windowId: number) {
    const window = await this.br.windows.get(windowId)
    if (!window.id) return
    const tabs = await this.br.tabs.query({ windowId: window.id })
    const date = new Date()
    const associated_id = v4()
    const swindow: SavedWindowDescriptor = {
      session_id: v4(),
      associated_window_id: associated_id,
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
    await this.setWindowAssociatedWindowId(window.id, associated_id)
    this.sortTabs()
    await this.triggerUpdate()
  }

  async unlinkStoredSession(assiciatedId: string) {
    const session = this.storedData.windows.find(w => w.associated_window_id === assiciatedId)
    if (!session) return
    if (!session.associated_window_id) return
    this.data.windows = this.data.windows.map(w => (w.associated_window_id === session.associated_window_id ? { ...w, associated_window_id: undefined } : w))
    this.storedData.tabs = this.storedData.tabs.filter(t => t.session_id !== session.session_id)
    this.storedData.windows = this.storedData.windows.filter(w => w.session_id !== session.session_id)
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
    if (window.type !== 'normal') return
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
    const associatedIdToSessionIdMap = this.getAssociationMap()
    const validAssociatedIds = [...associatedIdToSessionIdMap.keys()]
    const openedSessionWindows = this.data.windows.filter(w => w.associated_window_id && validAssociatedIds.includes(w.associated_window_id))
    const openedSessionWindowsSessionIds = openedSessionWindows.map(w => associatedIdToSessionIdMap.get(w.associated_window_id!)!)
    const openedSessionWindowsIds = openedSessionWindows.map(w => w.id)
    const inactiveSessionWindows = this.storedData.windows.filter(w => !w.associated_window_id || !openedSessionWindowsSessionIds.includes(w.session_id))
    const inactiveSessionWindowsIds = inactiveSessionWindows.map(w => w.session_id)
    const tabsToStore = this.data.tabs.filter(t => isNotNil(t.window_id) && openedSessionWindowsIds.includes(t.window_id))
    const newSessionTabs = (await Promise.all(tabsToStore.map(t => this.convertTabToStoredTab(t)))).filter(isNotNil)
    const sessionTabs = [...this.storedData.tabs.filter(t => inactiveSessionWindowsIds.includes(t.session_id))]

    this.storedData.tabs = sortStoredTabs([...sessionTabs, ...newSessionTabs])
    this.setStoredData(this.storedData)
  }

  getAssociationMap() {
    const map = new Map<string, string>()

    for (const session of this.storedData.windows) {
      if (session.associated_window_id) {
        map.set(session.associated_window_id, session.session_id)
      }
    }

    return map
  }

  sendMessage(message: OutgoingMessageDescriptor) {
    this.br.runtime.sendMessage(message)
  }

  private async serializeWindow(window: browser.windows.Window): Promise<WindowDescriptor | null> {
    if (!window.id) return null
    return defineAll<WindowDescriptor>({
      id: window.id,
      associated_window_id: (await this.getAssociatedWindowId(window.id)) ?? undefined,
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
    const session_id = await this.getWindowSessionId(tab.window_id)
    if (!session_id) return null
    return convertTabToStoredTab(session_id, tab)
  }

  async getAssociatedWindowId(windowId?: number): Promise<string | null> {
    if (isNil(windowId)) return null
    return asString(await this.br.sessions.getWindowValue(windowId, ASSOCIATED_SESSION_KEY)) ?? null
  }

  async getWindowSession(windowId?: number): Promise<SavedWindowDescriptor | null> {
    const associated_window_id = await this.getAssociatedWindowId(windowId)
    if (!associated_window_id) return null
    const session = this.storedData.windows.find(w => w.associated_window_id === associated_window_id)
    return session ?? null
  }

  async getWindowSessionId(windowId?: number): Promise<string | null> {
    return (await this.getWindowSession(windowId))?.session_id ?? null
  }

  async setWindowAssociatedWindowId(windowId: number, associated_id: string): Promise<void> {
    await this.br.sessions.setWindowValue(windowId, ASSOCIATED_SESSION_KEY, associated_id)
    this.data.windows = this.data.windows.map(w => (w.id === windowId ? { ...w, associated_window_id: associated_id } : w))
  }

  setSessionAssociatedWindowId(sessionId: string, associated_id: string) {
    this.storedData.windows = this.storedData.windows.map(w => (w.session_id === sessionId ? { ...w, associated_window_id: associated_id } : w))
  }

  async unsetWindowSession(windowId: number): Promise<void> {
    await this.br.sessions.removeWindowValue(windowId, ASSOCIATED_SESSION_KEY)
    this.data.windows = this.data.windows.map(w => (w.id === windowId ? { ...w, associated_window_id: undefined } : w))
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
  return tabs.toSorted((a, b) => {
    const cw = a.session_id.localeCompare(b.session_id)
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
