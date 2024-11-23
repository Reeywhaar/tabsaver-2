import { SavedTabDescriptor, TabDescriptor } from '@app/types'
import { isNil } from './isNil'
import { serialize } from './serialize'
import { defineAll } from './defineAll'

export const convertTabToStoredTab = (sessionId: string, tab: TabDescriptor): SavedTabDescriptor | null => {
  if (isNil(tab.id) || isNil(tab.window_id) || !tab.url) return null
  return serialize<SavedTabDescriptor>(
    defineAll<SavedTabDescriptor>({
      // TODO: better approach to generate stable id
      id: `${sessionId}.${tab.id}`,
      index: tab.index,
      url: tab.url,
      pinned: tab.pinned,
      session_id: sessionId,
      cookie_store_id: tab.cookie_store_id,
      favicon_url: tab.favicon_url,
      title: tab.title,
    })
  )
}
