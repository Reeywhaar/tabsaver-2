import { IncomingMessageDescriptor } from './types'
import { SessionsManager } from './SessionsManager'

async function main() {
  const manager = new SessionsManager({
    browserApi: browser,
    storedData: {
      tabs: [
        {
          id: '0',
          index: 0,
          url: 'https://example.com',
          window_session_id: '0',
          title: 'Example website',
        },
      ],
      windows: [
        {
          session_id: '0',
          title: 'Saved tab set',
        },
      ],
    },
  })
  manager.logger = console

  await manager.getInitialData()

  browser.tabs.onCreated.addListener(manager.tabCreatedHandler)
  browser.tabs.onActivated.addListener(manager.tabActivatedHandler)
  browser.tabs.onMoved.addListener(manager.tabMovedHandler)
  browser.tabs.onDetached.addListener(manager.tabDetachedHandler)
  browser.tabs.onAttached.addListener(manager.tabAttachedHandler)
  browser.tabs.onUpdated.addListener(manager.tabUpdatedHandler)
  browser.tabs.onReplaced.addListener(manager.tabReplacedHandler)
  browser.tabs.onRemoved.addListener(manager.tabRemovedHandler)

  browser.windows.onCreated.addListener(manager.windowCreatedHandler)
  browser.windows.onFocusChanged.addListener(manager.windowFocusChangedHandler)
  browser.windows.onRemoved.addListener(manager.windowRemovedHandler)

  browser.runtime.onMessage.addListener(async (message: IncomingMessageDescriptor) => {
    console.info('[tabsaver] [background] Incoming message', message)
    switch (message.type) {
      case 'getData': {
        return manager.sendDataUpdate()
      }
    }
  })
}

main().catch(e => {
  console.error(e)
})
