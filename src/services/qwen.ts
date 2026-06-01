import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import type { ChatMessage } from '../types/chat'

const DASHSCOPE_BASE_URL = 'http://192.168.4.159:4000/v1'
const DEFAULT_MODEL = 'qwen3.6-plus'
const SYSTEM_PROMPT =
  '你是一名中文智能助手，回答要准确、简洁、友好。如果用户的问题信息不足，先指出缺失信息，再给出可执行建议。'

function getDashScopeApiKey(): string {
  const apiKey = process.env.VUE_APP_DASHSCOPE_API_KEY?.trim()

  if (!apiKey) {
    throw new Error(
      '未配置 VUE_APP_DASHSCOPE_API_KEY，请在项目根目录 .env.local 中设置千问 API Key。'
    )
  }

  return apiKey
}

function buildConversationMessages(messages: ChatMessage[], question: string) {
  const history = messages.slice(-6).map((message) => {
    if (message.role === 'assistant') {
      return new SystemMessage(`历史助手回复：${message.content}`)
    }

    return new HumanMessage(`历史用户问题：${message.content}`)
  })

  return [
    new SystemMessage(SYSTEM_PROMPT),
    ...history,
    new HumanMessage(question)
  ]
}

export async function askQwen(
  question: string,
  messages: ChatMessage[]
): Promise<string> {
  const model = new ChatOpenAI({
    model: DEFAULT_MODEL,
    temperature: 0.7,
    apiKey: getDashScopeApiKey(),
    configuration: {
      baseURL: DASHSCOPE_BASE_URL
    }
  })

  const response = await model.invoke(
    buildConversationMessages(messages, question)
  )

  const content = response.text?.trim()

  if (!content) {
    throw new Error('千问模型返回了空内容，请稍后重试。')
  }

  return content
}

function readChunkText(chunk: { text?: string; content?: unknown }): string {
  if (typeof chunk.text === 'string') {
    return chunk.text
  }

  if (typeof chunk.content === 'string') {
    return chunk.content
  }

  if (Array.isArray(chunk.content)) {
    return chunk.content
      .map((item) => {
        if (
          typeof item === 'object' &&
          item !== null &&
          'text' in item &&
          typeof (item as { text?: unknown }).text === 'string'
        ) {
          return (item as { text: string }).text
        }

        return ''
      })
      .join('')
  }

  return ''
}

export async function streamQwen(
  question: string,
  messages: ChatMessage[],
  onChunk: (text: string) => void
): Promise<string> {
  const model = new ChatOpenAI({
    model: DEFAULT_MODEL,
    temperature: 0.7,
    apiKey: getDashScopeApiKey(),
    configuration: {
      baseURL: DASHSCOPE_BASE_URL
    }
  })

  const stream = await model.stream(buildConversationMessages(messages, question))
  let content = ''

  for await (const chunk of stream) {
    const text = readChunkText(chunk)
    if (!text) {
      continue
    }

    content += text
    onChunk(content)
  }

  const finalContent = content.trim()

  if (!finalContent) {
    throw new Error('千问模型返回了空内容，请稍后重试。')
  }

  return finalContent
}
