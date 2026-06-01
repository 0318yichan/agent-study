<template>
  <div ref="messageListRef" class="message-list" aria-live="polite">
    <article
      v-for="message in messages"
      :key="message.id"
      class="message-row"
      :class="message.role"
    >
      <div v-if="message.role === 'assistant'" class="message-side-label">AI</div>
      <div class="message-bubble">
        <div class="message-role">
          {{ message.role === 'assistant' ? '智能助手' : '你' }}
        </div>
        <p>{{ message.content }}</p>
        <time class="message-time">{{ message.time }}</time>
      </div>
    </article>

    <article v-if="isTyping" class="message-row assistant">
      <div class="message-side-label">AI</div>
      <div class="message-bubble typing-bubble">
        <div class="message-role">智能助手</div>
        <div class="typing-dots" aria-label="正在输入">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import type { ChatMessage } from '@/types/chat'

const props = defineProps<{
  messages: ChatMessage[]
  isTyping: boolean
}>()

const messageListRef = ref<HTMLDivElement | null>(null)

function scrollToBottom(behavior: 'auto' | 'smooth' = 'smooth'): void {
  const container = messageListRef.value
  if (!container) {
    return
  }

  container.scrollTo({
    top: container.scrollHeight,
    behavior,
  })
}

watch(
  () => [
    props.messages.length,
    props.isTyping,
    props.messages.at(-1)?.content.length ?? 0
  ],
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

onMounted(() => {
  scrollToBottom('auto')
})
</script>
