<template>
  <div class="flex min-h-screen flex-col">
    <router-view />
    <ThemeToggle class="fixed top-4 right-4 z-50" />
    <Toaster position="top-center" :expand="true" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChange } from './firebase/auth'
import { Toaster } from '@/components/ui/sonner'
import ThemeToggle from '@/components/theme/ThemeToggle.vue'

const router = useRouter()

let unsubscribe: ReturnType<typeof onAuthStateChange> | null = null

onMounted(() => {
  unsubscribe = onAuthStateChange((user) => {
    const isGuest = localStorage.getItem('isGuest') === 'true'

    if (!user && !isGuest) {
      router.push('/login')
    } else if (user && router.currentRoute.value.path === '/login') {
      router.push('/')
    }
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>
