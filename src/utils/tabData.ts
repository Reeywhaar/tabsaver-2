import { DRAGGABLE_TAB_MIME } from '@app/constants'

export type DragTabData = {
  id: number
  window_id?: number
  index: number
}

export const extractTabData = (e: DragEvent): DragTabData | null => {
  const data = e.dataTransfer?.getData(DRAGGABLE_TAB_MIME)
  if (!data) return null
  return JSON.parse(data)
}
