export type MessageRole = 'assistant' | 'user'

export interface ChatMessage {
  id: number
  role: MessageRole
  content: string
  time: string
}
