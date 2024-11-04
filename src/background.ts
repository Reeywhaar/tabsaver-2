import { IncomingMessageDescriptor } from './types'
import { SessionsManager } from './SessionsManager'
import { assertNever } from './utils/assertNever'

async function main() {
  const manager = new SessionsManager({
    browserApi: browser,
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
        await manager.triggerUpdate()
        return
      }
      case 'updateStoredData': {
        manager.storedData = message.storedData
        return
      }
      default:
        assertNever(message)
    }
  })
}

main().catch(e => {
  console.error(e)
})
