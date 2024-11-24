import { v4 } from 'uuid'
import { SavedSessionsDescriptor, SavedTabDescriptor, SavedWindowDescriptor, TabDescriptor } from './types'
import { convertTabToStoredTab } from './utils/convertTabToStoredTab'

export class SessionsHelper {
  data: SavedSessionsDescriptor

  constructor(data: SavedSessionsDescriptor) {
    this.data = data
  }

  moveTab(id: string, session_id: string, index: number = Number.MAX_SAFE_INTEGER) {
    const tab = this.data.tabs.find(t => t.id === id)
    if (!tab) throw new Error(`Tab with id ${id} not found`)
    const newTab = { ...tab, session_id, index }
    if (tab.session_id === session_id) {
      const otherTabs = this.data.tabs.filter(t => t.session_id !== session_id)
      const targetSession = this.data.tabs.filter(t => t.session_id === session_id).filter(t => t.id !== id)
      const tabs = [...targetSession.slice(0, index), newTab, ...targetSession.slice(index)].map((t, i) => ({ ...t, index: i }))
      this.data = { ...this.data, tabs: this.sortStoredTabs([...otherTabs, ...tabs]) }
      return
    }

    const otherTabs = this.data.tabs.filter(t => t.session_id !== session_id && t.session_id !== tab.session_id)
    const donorSession = this.data.tabs.filter(t => t.session_id === tab.session_id).filter(t => t.id !== tab.id)
    const targetSession = this.data.tabs.filter(t => t.session_id === session_id)
    const tabs = [...targetSession.slice(0, index), newTab, ...targetSession.slice(index)].map((t, i) => ({ ...t, index: i }))
    this.data = {
      ...this.data,
      windows: donorSession.length ? this.data.windows : this.data.windows.filter(s => s.session_id !== tab.session_id),
      tabs: this.sortStoredTabs([...otherTabs, ...donorSession, ...tabs]),
    }
    return
  }

  copyTab(id: string, session_id: string, index: number = Number.MAX_SAFE_INTEGER) {
    const tab = this.data.tabs.find(t => t.id === id)
    if (!tab) throw new Error(`Tab with id ${id} not found`)
    const newTab = { ...tab, id: v4(), session_id, index }

    const otherTabs = this.data.tabs.filter(t => t.session_id !== session_id)
    const targetSession = this.data.tabs.filter(t => t.session_id === session_id)
    const tabs = [...targetSession.slice(0, index), newTab, ...targetSession.slice(index)].map((t, i) => ({ ...t, index: i }))

    this.data = {
      ...this.data,
      tabs: this.sortStoredTabs([...otherTabs, ...tabs]),
    }
  }

  addTab(tab: TabDescriptor, session_id: string, index: number = Number.MAX_SAFE_INTEGER) {
    const ctab = convertTabToStoredTab(session_id, tab)
    if (!ctab) throw new Error('Cannot convert tab')
    const newTab = { ...ctab, index }
    const otherTabs = this.data.tabs.filter(t => t.session_id !== session_id)
    const targetSession = this.data.tabs.filter(t => t.session_id === session_id)
    const tabs = [...targetSession.slice(0, index), newTab, ...targetSession.slice(index)].map((t, i) => ({ ...t, index: i }))
    this.data = {
      ...this.data,
      tabs: this.sortStoredTabs([...otherTabs, ...tabs]),
    }
  }

  removeTab(id: string) {
    const tab = this.data.tabs.find(t => t.id === id)
    if (!tab) throw new Error(`Tab with id ${id} not found`)
    const otherTabs = this.data.tabs.filter(t => t.session_id !== tab.session_id)
    const tabs = this.data.tabs.filter(t => t.session_id === tab.session_id).filter(t => t.id !== tab.id)
    this.data = {
      ...this.data,
      tabs: this.sortStoredTabs([...otherTabs, ...tabs]),
    }
  }

  removeSession(id: string) {
    this.data = {
      ...this.data,
      windows: this.data.windows.filter(w => w.session_id !== id),
      tabs: this.sortStoredTabs(this.data.tabs.filter(t => t.session_id !== id)),
    }
  }

  renameSession(id: string, title: string) {
    this.data = {
      ...this.data,
      windows: this.data.windows.map(w => (w.session_id === id ? { ...w, title } : w)),
    }
  }

  addSession(window: SavedWindowDescriptor, tabs: SavedTabDescriptor[], index: number = Number.MAX_SAFE_INTEGER) {
    this.data = {
      ...this.data,
      windows: [...this.data.windows.slice(0, index), window, ...this.data.windows.slice(index)],
      tabs: this.sortStoredTabs([...this.data.tabs, ...tabs]),
    }
  }

  private sortStoredTabs(tabs: SavedTabDescriptor[]): SavedTabDescriptor[] {
    return tabs.toSorted((a, b) => {
      const cw = a.session_id.localeCompare(b.session_id)
      if (cw !== 0) return cw
      return a.index - b.index
    })
  }
}
