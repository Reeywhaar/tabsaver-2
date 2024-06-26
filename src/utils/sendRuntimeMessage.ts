import { IncomingMessageDescriptor } from '@app/types'

export const sendRuntimeMessage = (br: typeof browser, message: IncomingMessageDescriptor) => {
  br.runtime.sendMessage(message)
}
