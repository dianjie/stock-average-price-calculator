<!-- FetchButton.vue -->
<template>
  <Button
    variant="ghost"
    size="sm"
    class="h-6 px-2 text-xs"
    :disabled="disabled"
    @click="handleClick"
  >
    <Loader2Icon v-if="loading" class="mr-1 size-3 animate-spin" />
    {{ buttonText }}
  </Button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loader2Icon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

interface Props {
  loading: boolean
  cooldown: number
  btnText?: string
}

interface Emits {
  (e: 'fetch'): void
}

const props = withDefaults(defineProps<Props>(), {
  btnText: '获取',
})

const emit = defineEmits<Emits>()

const buttonText = computed(() => {
  if (props.loading) return '获取中'
  if (props.cooldown > 0) return `${props.cooldown}秒后可获取`
  return props.btnText
})

const disabled = computed(() => props.cooldown > 0 || props.loading)

const handleClick = () => {
  if (!disabled.value) {
    emit('fetch')
  }
}
</script>
