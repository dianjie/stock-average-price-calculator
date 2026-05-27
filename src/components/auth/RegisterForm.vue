<template>
  <Card class="mx-auto w-full max-w-md">
    <CardHeader>
      <CardTitle class="text-center text-lg">注册</CardTitle>
      <CardDescription class="text-center">创建新账号以永久保存您的数据</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" @submit="onSubmit">
        <VeeField v-slot="{ componentField, errorMessage }" name="displayName">
          <Field>
            <FieldLabel for="register-displayName">用户名</FieldLabel>
            <Input
              id="register-displayName"
              v-bind="componentField"
              placeholder="请输入用户名"
              autocomplete="username"
            />
            <FieldError v-if="errorMessage" :errors="[errorMessage]" />
          </Field>
        </VeeField>

        <VeeField v-slot="{ componentField, errorMessage }" name="email">
          <Field>
            <FieldLabel for="register-email">邮箱</FieldLabel>
            <Input
              id="register-email"
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
            <FieldLabel for="register-password">密码</FieldLabel>
            <Input
              id="register-password"
              v-bind="componentField"
              type="password"
              placeholder="请输入密码"
              autocomplete="new-password"
            />
            <FieldError v-if="errorMessage" :errors="[errorMessage]" />
          </Field>
        </VeeField>

        <VeeField v-slot="{ componentField, errorMessage }" name="confirmPassword">
          <Field>
            <FieldLabel for="register-confirmPassword">确认密码</FieldLabel>
            <Input
              id="register-confirmPassword"
              v-bind="componentField"
              type="password"
              placeholder="请再次输入密码"
              autocomplete="new-password"
            />
            <FieldError v-if="errorMessage" :errors="[errorMessage]" />
          </Field>
        </VeeField>

        <Button type="submit" class="w-full" :disabled="isLoading">
          <Loader2Icon v-if="isLoading" class="size-4 animate-spin" />
          {{ isLoading ? '注册中...' : '注册' }}
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
import { registerUser } from '@/firebase/auth'
import { mapAuthError } from '@/config/authErrors'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'

const emit = defineEmits<{
  (e: 'login-success', user: unknown): void
}>()

const isLoading = ref(false)

const registerSchema = z
  .object({
    displayName: z.string().min(2, '用户名长度应为2-20个字符').max(20, '用户名长度应为2-20个字符'),
    email: z.email('请输入正确的邮箱格式'),
    password: z.string().min(6, '密码长度不能少于6个字符'),
    confirmPassword: z.string().min(1, '请再次输入密码'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

const { handleSubmit } = useForm<z.infer<typeof registerSchema>>({
  validationSchema: registerSchema,
  initialValues: { displayName: '', email: '', password: '', confirmPassword: '' },
})

const onSubmit = handleSubmit(async (values) => {
  try {
    isLoading.value = true
    const user = await registerUser(values.email, values.password, values.displayName)
    emit('login-success', user)
  } catch (error: unknown) {
    toast.error(mapAuthError(error as { code?: string }))
  } finally {
    isLoading.value = false
  }
})
</script>
