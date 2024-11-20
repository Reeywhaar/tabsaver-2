import { DRAGGABLE_SAVED_TAB_MIME, DRAGGABLE_TAB_MIME } from '@app/constants'

export type DragTabData = {
  type: typeof DRAGGABLE_TAB_MIME
  id: number
  window_id?: number
  index: number
}

export type DragSavedTabData = {
  type: typeof DRAGGABLE_SAVED_TAB_MIME
  id: string
  session_id: string
  index: number
}

export const extractTabData = (e: DragEvent): DragTabData | DragSavedTabData | null => {
  {
    const data = e.dataTransfer?.getData(DRAGGABLE_TAB_MIME)
    if (data) return JSON.parse(data) as DragTabData
  }
  {
    const data = e.dataTransfer?.getData(DRAGGABLE_SAVED_TAB_MIME)
    if (data) return JSON.parse(data) as DragSavedTabData
  }
  return null
}

export const hasTabData = (e: DragEvent): boolean => {
  const types = [DRAGGABLE_TAB_MIME, DRAGGABLE_SAVED_TAB_MIME]
  return !!e.dataTransfer?.types.find(t => types.includes(t))
}
