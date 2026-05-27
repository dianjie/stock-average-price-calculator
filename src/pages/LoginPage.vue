<template>
  <div class="flex min-h-screen flex-col items-center justify-center px-4 py-8">
    <div class="w-full max-w-sm space-y-4">
      <h1 class="text-center text-xl font-bold">均价计算器</h1>

      <LoginForm @login-success="handleLoginSuccess" />

      <div class="space-y-3 text-center">
        <p class="text-muted-foreground text-sm">
          还没有账号？
          <router-link to="/register" class="text-primary font-medium hover:underline">
            立即注册
          </router-link>
        </p>

        <GuestLoginButton @confirm="handleGuestLogin" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import LoginForm from '../components/auth/LoginForm.vue'
import GuestLoginButton from '../components/auth/GuestLoginButton.vue'

const router = useRouter()

function handleGuestLogin() {
  localStorage.setItem('isGuest', 'true')
  router.push('/')
}

function handleLoginSuccess() {
  localStorage.removeItem('isGuest')
  router.push('/')
}
</script>
