<template>
  <div class="app-shell">
    <main class="chat-layout">
      <ChatHero />
      <section class="chat-panel" aria-label="智能聊天窗口">
        <header class="chat-header">
          <div class="assistant-meta">
            <div class="assistant-avatar" aria-hidden="true">AI</div>
            <div>
              <h2>Agent Copilot</h2>
              <p>在线 · 响应迅速 · 支持代码与知识问答</p>
            </div>
          </div>
          <div class="chat-status">Secure Session</div>
        </header>

        <SuggestionChips
          :prompts="prompts"
          @select="applyPrompt"
        />

        <MessageList
          :messages="messages"
          :is-typing="isTyping"
        />

        <ChatComposer
          :draft="draft"
          :can-send="canSend"
          @update:draft="draft = $event"
          @send="sendMessage"
        />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ChatComposer from './components/ChatComposer.vue'
import ChatHero from './components/ChatHero.vue'
import MessageList from './components/MessageList.vue'
import SuggestionChips from './components/SuggestionChips.vue'
import { streamQwen } from './services/qwen'
import type { ChatMessage } from './types/chat'

const draft = ref<string>('')
const isTyping = ref<boolean>(false)
const isStreaming = ref<boolean>(false)
const nextId = ref<number>(4)

const prompts: string[] = [
  '总结这段代码的职责',
  '生成一个会议纪要模板',
  '帮我规划一个前端项目结构'
]

const messages = ref<ChatMessage[]>([
  {
    id: 1,
    role: 'assistant',
    content: '你好，我可以帮助你处理代码解释、方案设计、文案整理和知识问答。你希望先聊哪个主题？',
    time: '09:41'
  },
  {
    id: 2,
    role: 'user',
    content: '我想做一个简洁但有质感的 AI 聊天界面，适合网页端展示。',
    time: '09:42'
  },
  {
    id: 3,
    role: 'assistant',
    content: '可以采用深色背景、玻璃拟态容器、分层消息气泡和明确的输入反馈，同时保留快捷问题入口来提升首屏可用性。',
    time: '09:42'
  }
])

const canSend = computed<boolean>(() => {
  return draft.value.trim().length > 0 && !isTyping.value && !isStreaming.value
})

function applyPrompt(prompt: string): void {
  draft.value = prompt
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function sendMessage(): Promise<void> {
  const content = draft.value.trim()
  if (!content || isTyping.value) {
    return
  }

  const history = [...messages.value]

  messages.value.push({
    id: nextId.value++,
    role: 'user',
    content,
    time: getCurrentTime()
  })

  draft.value = ''
  isTyping.value = true
  isStreaming.value = true

  try {
    let assistantMessage: ChatMessage | null = null

    await streamQwen(content, history, (partialText) => {
      if (!assistantMessage) {
        assistantMessage = {
          id: nextId.value++,
          role: 'assistant',
          content: '',
          time: getCurrentTime()
        }
        messages.value.push(assistantMessage)
      }

      assistantMessage.content = partialText
      isTyping.value = false
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : '调用千问模型失败，请检查网络或稍后重试。'

    messages.value.push({
      id: nextId.value++,
      role: 'assistant',
      content: `抱歉，当前无法完成回答。${errorMessage}`,
      time: getCurrentTime()
    })
  } finally {
    isTyping.value = false
    isStreaming.value = false
  }
}
</script>

<style>
:root {
  color-scheme: dark;
  --accent-primary: #7c3aed;
  --accent-secondary: #06b6d4;
  --accent-highlight: #38bdf8;
  --chat-surface: rgba(12, 18, 34, 0.88);
  --chat-surface-strong: rgba(18, 27, 52, 0.96);
  --chat-border: rgba(96, 165, 250, 0.28);
  --scrollbar-track: rgba(15, 23, 42, 0.72);
  --scrollbar-thumb: linear-gradient(180deg, rgba(56, 189, 248, 0.9), rgba(124, 58, 237, 0.92));
  --scrollbar-thumb-hover: linear-gradient(180deg, rgba(96, 165, 250, 0.98), rgba(139, 92, 246, 1));
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(76, 110, 245, 0.28), transparent 34%),
    radial-gradient(circle at bottom right, rgba(34, 211, 238, 0.18), transparent 30%),
    linear-gradient(180deg, #0b1020 0%, #11182a 100%);
  color: #f5f7ff;
}

#app {
  min-height: 100vh;
}

.app-shell {
  min-height: 100vh;
  padding: 32px;
}

.chat-layout {
  display: grid;
  grid-template-columns: minmax(280px, 420px) minmax(320px, 1fr);
  gap: 24px;
  align-items: stretch;
  max-width: 1400px;
  margin: 0 auto;
}

.hero-panel,
.chat-panel {
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.72);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(16px);
}

.hero-panel {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 32px;
  border-radius: 28px;
  border: 1px solid rgba(129, 140, 248, 0.2);
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
    radial-gradient(circle at 85% 18%, rgba(129, 140, 248, 0.18), transparent 24%),
    linear-gradient(180deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 23, 42, 0.86) 100%);
  box-shadow:
    0 24px 70px rgba(2, 8, 23, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.hero-badge,
.chat-status,
.message-side-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.hero-badge {
  position: relative;
  z-index: 1;
  width: fit-content;
  color: #eef6ff;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(124, 58, 237, 0.28));
  border: 1px solid rgba(125, 211, 252, 0.24);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.hero-glow {
  position: absolute;
  top: -72px;
  right: -42px;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  background:
    radial-gradient(circle, rgba(34, 211, 238, 0.24) 0%, rgba(59, 130, 246, 0.12) 42%, transparent 72%);
  filter: blur(10px);
  pointer-events: none;
}

.hero-eyebrow {
  position: relative;
  z-index: 1;
  margin: 18px 0 0;
  color: #8fb4ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-panel h1 {
  position: relative;
  z-index: 1;
  margin: 18px 0 12px;
  font-size: clamp(34px, 5vw, 52px);
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.hero-panel h1 span {
  display: block;
  margin-top: 8px;
  background: linear-gradient(135deg, #f8fbff 0%, #93c5fd 35%, #c4b5fd 68%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-copy {
  position: relative;
  z-index: 1;
  margin: 0;
  max-width: 34ch;
  color: #d2dcf5;
  font-size: 16px;
  line-height: 1.7;
}

.hero-highlights {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.46);
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.hero-stats {
  display: grid;
  gap: 14px;
  margin-top: 28px;
}

.stat-card {
  position: relative;
  padding: 18px;
  border-radius: 20px;
  background:
    linear-gradient(135deg, rgba(30, 41, 59, 0.88), rgba(15, 23, 42, 0.72));
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 10px 28px rgba(2, 8, 23, 0.16);
}

.stat-index {
  margin-bottom: 10px;
  color: #67e8f9;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.stat-card strong {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
  color: #f8fafc;
}

.stat-card span {
  color: #cbd5f5;
  font-size: 14px;
  line-height: 1.6;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  min-height: 0;
  padding: 22px;
  border-radius: 30px;
  overflow: hidden;
  border: 1px solid var(--chat-border);
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.16), transparent 32%),
    radial-gradient(circle at bottom left, rgba(124, 58, 237, 0.22), transparent 34%),
    linear-gradient(180deg, rgba(10, 15, 30, 0.98) 0%, rgba(17, 25, 48, 0.96) 100%);
  box-shadow:
    0 28px 80px rgba(4, 10, 28, 0.58),
    inset 0 1px 0 rgba(191, 219, 254, 0.08),
    0 0 0 1px rgba(56, 189, 248, 0.06);
}

.chat-header,
.assistant-meta,
.composer-footer {
  display: flex;
  align-items: center;
}

.chat-header {
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(96, 165, 250, 0.18);
}

.assistant-meta {
  gap: 14px;
}

.assistant-avatar {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 800;
  color: #f8fafc;
  background: linear-gradient(135deg, #7c3aed 0%, #0ea5e9 52%, #22d3ee 100%);
  box-shadow: 0 12px 28px rgba(56, 189, 248, 0.28);
}

.assistant-meta h2 {
  margin: 0 0 6px;
  font-size: 18px;
}

.assistant-meta p {
  margin: 0;
  color: #b9c7e7;
  font-size: 13px;
}

.chat-status {
  color: #d9f99d;
  background: linear-gradient(135deg, rgba(8, 47, 73, 0.9), rgba(15, 118, 110, 0.72));
  border: 1px solid rgba(103, 232, 249, 0.22);
  box-shadow: inset 0 1px 0 rgba(240, 253, 250, 0.08);
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0 20px;
}

.suggestion-chip {
  min-height: 42px;
  padding: 10px 14px;
  border: 1px solid rgba(96, 165, 250, 0.18);
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(22, 32, 62, 0.96), rgba(31, 46, 87, 0.84));
  color: #eff6ff;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  box-shadow: inset 0 1px 0 rgba(191, 219, 254, 0.05);
}

.suggestion-chip:hover,
.suggestion-chip:focus-visible {
  background: linear-gradient(135deg, rgba(44, 63, 118, 0.98), rgba(34, 211, 238, 0.24));
  border-color: rgba(125, 211, 252, 0.58);
  transform: translateY(-1px);
  outline: none;
  box-shadow: 0 10px 24px rgba(14, 165, 233, 0.16);
}

.message-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding-right: 8px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #38bdf8 var(--scrollbar-track);
}

.message-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.message-row.user {
  justify-content: flex-end;
}

.message-side-label {
  flex: 0 0 auto;
  color: #f0f9ff;
  background: linear-gradient(135deg, rgba(8, 47, 73, 0.92), rgba(14, 116, 144, 0.88));
  border: 1px solid rgba(125, 211, 252, 0.26);
}

.message-bubble {
  max-width: min(78%, 620px);
  padding: 16px 18px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(21, 31, 61, 0.98), rgba(18, 27, 52, 0.96));
  border: 1px solid rgba(96, 165, 250, 0.16);
  box-shadow: 0 18px 34px rgba(2, 8, 23, 0.24);
}

.message-row.user .message-bubble {
  background: linear-gradient(135deg, #6d28d9 0%, #2563eb 48%, #06b6d4 100%);
  border-color: rgba(147, 197, 253, 0.34);
  box-shadow: 0 18px 34px rgba(37, 99, 235, 0.26);
}

.message-role,
.message-time,
.input-hint {
  font-size: 12px;
}

.message-role {
  margin-bottom: 8px;
  color: #c4b5fd;
  font-weight: 700;
}

.message-bubble p {
  margin: 0;
  color: #f8fafc;
  font-size: 15px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.message-time {
  display: block;
  margin-top: 10px;
  color: rgba(226, 232, 240, 0.7);
}

.typing-bubble {
  min-width: 120px;
}

.typing-dots {
  display: inline-flex;
  gap: 8px;
  margin-top: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #93c5fd;
  animation: pulse 1s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

.composer {
  flex-shrink: 0;
  margin-top: 20px;
  padding: 16px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(9, 14, 28, 0.92), rgba(19, 27, 48, 0.92));
  border: 1px solid rgba(96, 165, 250, 0.18);
  box-shadow:
    inset 0 1px 0 rgba(191, 219, 254, 0.08),
    0 12px 28px rgba(2, 8, 23, 0.24);
}

.composer-input {
  width: 100%;
  min-height: 84px;
  max-height: 180px;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
  color: #f8fafc;
  font: inherit;
  font-size: 15px;
  line-height: 1.7;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #60a5fa var(--scrollbar-track);
}

.composer-input::placeholder {
  color: #64748b;
}

.composer-footer {
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
}

.input-hint {
  color: #94a3b8;
}

.send-button {
  min-width: 124px;
  min-height: 46px;
  padding: 0 18px;
  border: 0;
  border-radius: 14px;
  color: #eff6ff;
  font-size: 14px;
  font-weight: 700;
  background: linear-gradient(135deg, #7c3aed 0%, #2563eb 48%, #22d3ee 100%);
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.34);
}

.send-button:hover,
.send-button:focus-visible {
  transform: translateY(-1px);
  outline: none;
  box-shadow: 0 20px 40px rgba(56, 189, 248, 0.34);
}

.send-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  box-shadow: none;
  transform: none;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.message-list::-webkit-scrollbar,
.composer-input::-webkit-scrollbar {
  width: 10px;
}

.message-list::-webkit-scrollbar-track,
.composer-input::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
  border-radius: 999px;
}

.message-list::-webkit-scrollbar-thumb,
.composer-input::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 999px;
  border: 2px solid rgba(15, 23, 42, 0.66);
}

.message-list::-webkit-scrollbar-thumb:hover,
.composer-input::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

@keyframes pulse {
  0%,
  80%,
  100% {
    transform: scale(0.75);
    opacity: 0.45;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 1080px) {
  .app-shell {
    padding: 20px;
  }

  .chat-layout {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .app-shell {
    padding: 12px;
  }

  .hero-panel,
  .chat-panel {
    border-radius: 24px;
  }

  .hero-panel {
    padding: 24px;
  }

  .hero-highlights {
    gap: 8px;
  }

  .hero-pill {
    width: 100%;
    justify-content: center;
  }

  .chat-panel {
    height: calc(100vh - 24px);
    min-height: 0;
    padding: 16px;
  }

  .chat-header,
  .composer-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .message-bubble {
    max-width: 100%;
  }

  .send-button {
    width: 100%;
  }
}
</style>
