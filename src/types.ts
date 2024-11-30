import * as RT from '@badrap/valita'

export type TabDescriptor = {
  id: number
  url: string
  index: number
  window_id?: number
  favicon_url?: string
  title?: string
  active?: boolean
  pinned?: boolean
  cookie_store_id?: string
  discarded?: boolean
}

export type WindowDescriptor = {
  id: number
  associated_window_id?: string
  focused?: boolean
  incognito?: boolean
}

export type SessionsDescriptor = {
  windows: WindowDescriptor[]
  tabs: TabDescriptor[]
}

export const RT_SavedTabDescriptor = RT.object({
  id: RT.string(),
  url: RT.string(),
  title: RT.string().optional(),
  pinned: RT.boolean().optional(),
  session_id: RT.string(),
  index: RT.number(),
  active: RT.boolean().optional(),
  cookie_store_id: RT.string().optional(),
  favicon_url: RT.string().optional(),
})

export type SavedTabDescriptor = RT.Infer<typeof RT_SavedTabDescriptor>

export const RT_SavedWindowDescriptor = RT.object({
  session_id: RT.string(),
  // todo: move to some other storage so it won't get exported
  associated_window_id: RT.string().optional(),
  title: RT.string(),
  position: RT.object({ left: RT.number(), top: RT.number() }).optional(),
  size: RT.object({ width: RT.number(), height: RT.number() }).optional(),
})

export type SavedWindowDescriptor = RT.Infer<typeof RT_SavedWindowDescriptor>

export const RT_SavedSessionsDescriptor = RT.object({
  windows: RT.array(RT_SavedWindowDescriptor),
  tabs: RT.array(RT_SavedTabDescriptor),
})

export type SavedSessionsDescriptor = {
  windows: SavedWindowDescriptor[]
  tabs: SavedTabDescriptor[]
}

export type OutgoingMessageDescriptor =
  | {
      type: 'update'
      data: SessionsDescriptor
      storedData: SavedSessionsDescriptor
    }
  | {
      type: 'error'
      message: string
    }

export type IncomingMessageDescriptor =
  | {
      type: 'getData'
    }
  | {
      type: 'updateStoredData'
      storedData: SavedSessionsDescriptor
    }
  | {
      type: 'openSession'
      id: string
    }
  | {
      type: 'linkWindow'
      windowId: number
    }
  | {
      type: 'unlinkStored'
      associatedSessionId: string
    }
