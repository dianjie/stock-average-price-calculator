<template>
  <Button variant="ghost" size="icon-sm" @click="toggleDark()">
    <Sun v-if="isDark" class="size-4" />
    <Moon v-else class="size-4" />
    <span class="sr-only">切换主题</span>
  </Button>
</template>

<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { Sun, Moon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>
