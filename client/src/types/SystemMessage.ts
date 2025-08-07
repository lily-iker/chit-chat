import type { SystemMessageAction } from './enum/SystemMessageAction'

export interface SystemMessage {
  actorId: string
  action: SystemMessageAction
  metadata: Record<string, any>
}
