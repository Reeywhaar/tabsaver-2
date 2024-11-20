import { SavedTabDescriptor } from '@app/types'
import { remapObject } from './remapObject'

export function convertStoredTabToTabCreateProperties(tab: SavedTabDescriptor): browser.tabs._CreateCreateProperties {
  return remapObject<SavedTabDescriptor, browser.tabs._CreateCreateProperties>(tab, {
    id: () => ({}),
    url: url => ({ url }),
    title: () => ({}),
    window_session_id: () => ({}),
    index: index => ({ index }),
    cookie_store_id: cookieStoreId => ({ cookieStoreId }),
    favicon_url: () => ({}),
  })
}
