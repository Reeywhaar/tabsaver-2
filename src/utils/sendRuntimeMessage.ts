import { IncomingMessageDescriptor } from '@app/types'

export const sendRuntimeMessage = (br: typeof browser, message: IncomingMessageDescriptor) => {
  return br.runtime.sendMessage(message)
}
