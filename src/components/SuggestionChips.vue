<template>
  <div class="suggestions" aria-label="推荐提问">
    <button
      v-for="prompt in prompts"
      :key="prompt"
      type="button"
      class="suggestion-chip"
      @click="emit('select', prompt)"
    >
      {{ prompt }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  prompts: string[]
}>()

const emit = defineEmits(['select'])
</script>
