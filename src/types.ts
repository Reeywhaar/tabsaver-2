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
}

export type WindowDescriptor = {
  id: number
  session_id?: string
  focused?: boolean
  incognito?: boolean
}

export type SessionsDescriptor = {
  windows: WindowDescriptor[]
  tabs: TabDescriptor[]
}

export type SavedTabDescriptor = {
  id: string
  url: string
  title?: string
  window_session_id: string
  index: number
  cookie_store_id?: string
  favicon_url?: string
}

export type SavedWindowDescriptor = {
  session_id: string
  title: string
}

export type SavedSessionsDescriptor = {
  windows: SavedWindowDescriptor[]
  tabs: SavedTabDescriptor[]
}

export type OutgoingMessageDescriptor = {
  type: 'update'
  data: SessionsDescriptor
  storedData: SavedSessionsDescriptor
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
      type: 'unlinkStored'
      sessionId: string
    }
