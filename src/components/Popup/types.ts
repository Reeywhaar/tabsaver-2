import { ReactNode } from 'react'

export type PopupControls = {
  close: () => void
}

export type PopupDescriptor = {
  id: string
  node: ReactNode
}
