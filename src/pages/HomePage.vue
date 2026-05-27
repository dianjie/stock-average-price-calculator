<template>
  <div class="container mx-auto px-4 py-4 sm:px-6 sm:py-6">
    <header class="mx-auto mb-6 max-w-5xl">
      <div
        class="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-4 shadow-sm"
      >
        <div>
          <h1 class="text-primary text-xl font-bold"> 均价计算器 </h1>
          <p v-if="isGuest" class="text-muted-foreground mt-0.5 text-xs">游客模式</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <UserProfile v-if="currentUser" @logout="handleLogout" />
          <Button v-if="isGuest" variant="ghost" size="sm" @click="exitGuestMode">
            退出游客模式
          </Button>
        </div>
      </div>
    </header>
    <StockCalculator />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import StockCalculator from '../components/stock/StockCalculator.vue'
import UserProfile from '../components/user/UserProfile.vue'
import { Button } from '@/components/ui/button'
import { onAuthStateChange } from '../firebase/auth'
import type { User } from 'firebase/auth'

const router = useRouter()
const currentUser = ref<User | null>(null)
const isGuest = ref(localStorage.getItem('isGuest') === 'true')

let unsubscribe: ReturnType<typeof onAuthStateChange> | null = null

function handleLogout() {
  localStorage.removeItem('isGuest')
  isGuest.value = false
  router.push('/login')
}

function exitGuestMode() {
  localStorage.removeItem('isGuest')
  isGuest.value = false
  router.push('/login')
}

onMounted(() => {
  unsubscribe = onAuthStateChange((user) => {
    currentUser.value = user
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>
