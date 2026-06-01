<template>
  <form class="composer" @submit.prevent="emit('send')">
    <label class="sr-only" for="chat-input">输入你的问题</label>
    <textarea
      ref="textareaRef"
      id="chat-input"
      :value="draft"
      class="composer-input"
      rows="3"
      maxlength="280"
      placeholder="输入你的问题，例如：帮我设计一个带消息分组和快捷指令的 AI 聊天界面"
      @input="handleInput"
      @keydown.enter.exact.prevent="emit('send')"
    />
    <div class="composer-footer">
      <span class="input-hint">Enter 发送，Shift + Enter 换行</span>
      <button
        type="submit"
        class="send-button"
        :disabled="!canSend"
      >
        发送消息
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  draft: string
  canSend: boolean
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const emit = defineEmits(['update:draft', 'send'])

function syncTextareaHeight(): void {
  const textarea = textareaRef.value
  if (!textarea) {
    return
  }

  textarea.style.height = 'auto'
  const nextHeight = Math.min(textarea.scrollHeight, 180)
  textarea.style.height = `${nextHeight}px`
}

function handleInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  emit('update:draft', target.value)
  syncTextareaHeight()
}

watch(
  () => props.draft,
  async () => {
    await nextTick()
    syncTextareaHeight()
  }
)

onMounted(() => {
  syncTextareaHeight()
})
</script>
