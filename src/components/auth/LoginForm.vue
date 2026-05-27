<template>
  <Card class="mx-auto w-full max-w-md">
    <CardHeader>
      <CardTitle class="text-center text-lg">登录</CardTitle>
      <CardDescription class="text-center">使用邮箱和密码登录您的账号</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" @submit="onSubmit">
        <VeeField v-slot="{ componentField, errorMessage }" name="email">
          <Field>
            <FieldLabel for="login-email">邮箱</FieldLabel>
            <Input
              id="login-email"
              v-bind="componentField"
              type="email"
              placeholder="请输入邮箱"
              autocomplete="email"
            />
            <FieldError v-if="errorMessage" :errors="[errorMessage]" />
          </Field>
        </VeeField>

        <VeeField v-slot="{ componentField, errorMessage }" name="password">
          <Field>
            <FieldLabel for="login-password">密码</FieldLabel>
            <Input
              id="login-password"
              v-bind="componentField"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
            <FieldError v-if="errorMessage" :errors="[errorMessage]" />
          </Field>
        </VeeField>

        <Button type="submit" class="w-full" :disabled="isLoading">
          <Loader2Icon v-if="isLoading" class="size-4 animate-spin" />
          {{ isLoading ? '登录中...' : '登录' }}
        </Button>
      </form>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { useForm, Field as VeeField } from 'vee-validate'
import { z } from 'zod'
import { Loader2Icon } from 'lucide-vue-next'
import { loginUser } from '@/firebase/auth'
import { mapAuthError } from '@/config/authErrors'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'

const emit = defineEmits<{
  (e: 'login-success', user: unknown): void
}>()

const isLoading = ref(false)

const loginSchema = z.object({
  email: z.email('请输入正确的邮箱地址'),
  password: z.string().min(6, '密码长度不能少于6个字符'),
})

const { handleSubmit } = useForm<z.infer<typeof loginSchema>>({
  validationSchema: loginSchema,
  initialValues: { email: '', password: '' },
})

const onSubmit = handleSubmit(async (values) => {
  try {
    isLoading.value = true
    const user = await loginUser(values.email, values.password)
    emit('login-success', user)
  } catch (error: unknown) {
    toast.error(mapAuthError(error as { code?: string }))
  } finally {
    isLoading.value = false
  }
})
</script>
