import { SessionsManager } from './SessionsManager'
import { SessionsDescriptor, TabDescriptor } from './types'
import { serialize } from './utils/serialize'

describe('SessionsManager', () => {
  let br: typeof browser

  beforeEach(() => {
    br = createBrowser()
  })

  it('tabCreatedHandler', async () => {
    const manager = new SessionsManager({
      browserApi: br,
      data: { tabs: [], windows: [] },
    })
    await manager.tabCreatedHandler(createTab({ url: 'https://example.com', id: 1 }))
    expect(serialize(manager.data.tabs)).toStrictEqual([createTabDescriptor({ url: 'https://example.com', id: 1 })])
  })
  it('tabActivatedHandler', async () => {
    br = {
      ...br,
      tabs: {
        ...br.tabs,
        get: async (tabId: number) => createTab({ id: tabId, windowId: 0 }),
      },
    }

    const manager = new SessionsManager({
      browserApi: br,
      data: createTestSessions(),
    })
    await manager.tabActivatedHandler({ tabId: 1, windowId: 0, previousTabId: 0 })
    expect(manager.data.tabs[0].active).toStrictEqual(undefined)
    expect(manager.data.tabs[1].active).toStrictEqual(true)
  })
  it('tabMovedHandler', async () => {
    const manager = new SessionsManager({
      browserApi: br,
      data: createTestSessions(),
    })
    await manager.tabMovedHandler(1, { windowId: 0, fromIndex: 1, toIndex: 3 })
    expect(manager.data.tabs.filter(t => t.window_id === 0).map(t => t.index)).toStrictEqual([0, 1, 2, 3, 4])
    expect(manager.data.tabs.filter(t => t.window_id === 0).map(t => t.id)).toStrictEqual([0, 2, 3, 1, 4])

    await manager.tabMovedHandler(1, { windowId: 0, fromIndex: 3, toIndex: 1 })
    expect(manager.data.tabs.filter(t => t.window_id === 0).map(t => t.index)).toStrictEqual([0, 1, 2, 3, 4])
    expect(manager.data.tabs.filter(t => t.window_id === 0).map(t => t.id)).toStrictEqual([0, 1, 2, 3, 4])
  })
  it('tabDetachedHandler', async () => {
    br = {
      ...br,
      tabs: {
        ...br.tabs,
        get: async (tabId: number) => createTab({ id: tabId, windowId: undefined }),
      },
    }

    const manager = new SessionsManager({
      browserApi: br,
      data: createTestSessions(),
    })
    await manager.tabDetachedHandler(1, { oldPosition: 1, oldWindowId: 0 })
    expect(manager.data.tabs.filter(t => t.window_id === 0).map(t => t.index)).toStrictEqual([0, 1, 2, 3])
    expect(manager.data.tabs.filter(t => t.window_id === 0).map(t => t.id)).toStrictEqual([0, 2, 3, 4])
  })
  it('tabAttachedHandler', async () => {
    br = {
      ...br,
      tabs: {
        ...br.tabs,
        get: async (tabId: number) => createTab({ id: tabId, windowId: tabId === 100 ? 0 : undefined, index: 1 }),
      },
    }

    const manager = new SessionsManager({
      browserApi: br,
      data: createTestSessions(),
    })
    manager.data.tabs.push(createTabDescriptor({ id: 100, index: 1, window_id: undefined }))
    await manager.tabAttachedHandler(100, { newPosition: 1, newWindowId: 0 })
    expect(manager.data.tabs.filter(t => t.window_id === 0).map(t => t.index)).toStrictEqual([0, 1, 2, 3, 4, 5])
    expect(manager.data.tabs.filter(t => t.window_id === 0).map(t => t.id)).toStrictEqual([0, 100, 1, 2, 3, 4])
  })
  it('tabReplacedHandler', async () => {
    br = {
      ...br,
      tabs: {
        ...br.tabs,
        get: async (tabId: number) => createTab({ id: tabId, windowId: 0, index: 1 }),
      },
    }

    const manager = new SessionsManager({
      browserApi: br,
      data: createTestSessions(),
    })
    await manager.tabReplacedHandler(100, 1)
    expect(manager.data.tabs.filter(t => t.window_id === 0).map(t => t.index)).toStrictEqual([0, 1, 2, 3, 4])
    expect(manager.data.tabs.filter(t => t.window_id === 0).map(t => t.id)).toStrictEqual([0, 100, 2, 3, 4])
  })
  it('tabRemovedHandler', async () => {
    const manager = new SessionsManager({
      browserApi: br,
      data: createTestSessions(),
    })
    await manager.tabRemovedHandler(1, { isWindowClosing: false, windowId: 0 })
    expect(manager.data.tabs.filter(t => t.window_id === 0).map(t => t.index)).toStrictEqual([0, 1, 2, 3])
    expect(manager.data.tabs.filter(t => t.window_id === 0).map(t => t.id)).toStrictEqual([0, 2, 3, 4])
  })

  it('windowCreatedHandler', async () => {
    br = {
      ...br,
      sessions: {
        ...br.sessions,
        getWindowValue: async () => undefined,
      },
    }
    const manager = new SessionsManager({
      browserApi: br,
      data: createTestSessions(),
    })
    await manager.windowCreatedHandler(createWindow({ id: 2 }))
    expect(manager.data.windows.map(w => w.id)).toStrictEqual([0, 1, 2])
  })
  it('windowFocusChangedHandler', async () => {
    const manager = new SessionsManager({
      browserApi: br,
      data: createTestSessions(),
    })
    await manager.windowFocusChangedHandler(1)
    expect(manager.data.windows.map(w => w.focused)).toStrictEqual([undefined, true])
  })
  it('windowRemovedHandler', async () => {
    const manager = new SessionsManager({
      browserApi: br,
      data: createTestSessions(),
    })
    await manager.windowRemovedHandler(1)
    expect(manager.data.windows.map(w => w.id)).toStrictEqual([0])
  })

  it('updateStoredData', async () => {
    br = {
      ...br,
      sessions: {
        ...br.sessions,
        getWindowValue: async id => (id === 0 ? '0' : undefined),
      },
    }
    const manager = new SessionsManager({
      browserApi: br,
      data: { ...createTestSessions(), windows: [{ id: 0, focused: true, associated_window_id: '0' }, { id: 1 }] },
      storedData: {
        windows: [
          {
            session_id: '0',
            title: 'title',
            associated_window_id: '0',
          },
        ],
        tabs: [],
      },
    })
    await manager.updateStoredData()
    expect(manager.storedData).toStrictEqual({
      tabs: [
        { active: true, session_id: '0', id: '0.0', index: 0, url: 'https://example.com' },
        { active: false, session_id: '0', id: '0.1', index: 1, url: 'https://example.com' },
        { active: false, session_id: '0', id: '0.2', index: 2, url: 'https://example.com' },
        { active: false, session_id: '0', id: '0.3', index: 3, url: 'https://example.com' },
        { active: false, session_id: '0', id: '0.4', index: 4, url: 'https://example.com' },
      ],
      windows: [{ session_id: '0', title: 'title', associated_window_id: '0' }],
    })
  })
})

const windowIndexes: Record<number, number> = {}

const createTestSessions = (length = 5): SessionsDescriptor => {
  return {
    tabs: [
      ...new Array(length).fill(null).map((_, i) => createTabDescriptor({ id: i, index: i, window_id: 0, active: i === 0 })),
      ...new Array(length).fill(5).map((x, i) => createTabDescriptor({ id: x + i, index: i, window_id: 1, active: i === 0 })),
    ],
    windows: [{ id: 0, focused: true, associated_window_id: '0' }, { id: 1 }],
  }
}

const createTabDescriptor = (tab: Partial<TabDescriptor>): TabDescriptor => {
  const index = (() => {
    if (typeof tab.index === 'number') return tab.index
    const index = windowIndexes[tab.window_id ?? 0] || 0
    ++windowIndexes[tab.window_id ?? 0]
    return index
  })()
  return serialize({
    id: 0,
    window_id: 0,
    active: undefined,
    index,
    pinned: undefined,
    favicon_url: undefined,
    url: 'https://example.com',
    cookie_store_id: undefined,
    title: undefined,
    ...tab,
  })
}

const createTab = (tab: Partial<browser.tabs.Tab>): browser.tabs.Tab => {
  return {
    id: 0,
    windowId: 0,
    active: false,
    index: 0,
    pinned: false,
    url: 'https://example.com',
    incognito: false,
    highlighted: false,
    ...tab,
  }
}

const createWindow = (win: Partial<browser.windows.Window>): browser.windows.Window => {
  return {
    type: 'normal',
    alwaysOnTop: false,
    focused: false,
    height: 0,
    incognito: false,
    ...win,
  }
}

const createBrowser = (): typeof browser =>
  ({
    runtime: {
      sendMessage: () => {},
    },
    sessions: {
      getWindowValue: async () => undefined,
    },
  }) as any
