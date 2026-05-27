<template>
  <div class="flex items-center">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <button
          class="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors"
        >
          <Avatar class="size-8">
            <AvatarImage :src="userAvatar" />
            <AvatarFallback>{{ userInitials }}</AvatarFallback>
          </Avatar>
          <span class="text-muted-foreground text-sm">{{
            currentUser?.displayName || '用户'
          }}</span>
          <ChevronDown class="text-muted-foreground size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-40">
        <DropdownMenuItem @click="showProfile">
          <User class="size-4" />
          <span>个人资料</span>
        </DropdownMenuItem>
        <DropdownMenuItem @click="openPasswordDialog">
          <Lock class="size-4" />
          <span>修改密码</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="showLogoutConfirm = true">
          <LogOut class="size-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog v-model:open="showProfileDialog">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>个人资料</DialogTitle>
          <DialogDescription>查看和编辑您的个人信息</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <Field>
            <FieldLabel for="profile-displayName">用户名</FieldLabel>
            <Input
              id="profile-displayName"
              v-model="profileForm.displayName"
              placeholder="请输入用户名"
            />
          </Field>
          <Field>
            <FieldLabel for="profile-email">邮箱</FieldLabel>
            <Input id="profile-email" :model-value="profileForm.email" disabled />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button :disabled="updating" @click="updateProfile">
            {{ updating ? '保存中...' : '保存' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showPasswordDialog">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>修改密码</DialogTitle>
          <DialogDescription>请输入当前密码和新密码</DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit="onPasswordSubmit">
          <VeeField v-slot="{ componentField, errorMessage }" name="currentPassword">
            <Field>
              <FieldLabel for="pwd-current">当前密码</FieldLabel>
              <Input
                id="pwd-current"
                v-bind="componentField"
                type="password"
                placeholder="请输入当前密码"
                autocomplete="current-password"
              />
              <FieldError v-if="errorMessage" :errors="[errorMessage]" />
            </Field>
          </VeeField>
          <VeeField v-slot="{ componentField, errorMessage }" name="newPassword">
            <Field>
              <FieldLabel for="pwd-new">新密码</FieldLabel>
              <Input
                id="pwd-new"
                v-bind="componentField"
                type="password"
                placeholder="请输入新密码"
                autocomplete="new-password"
              />
              <FieldError v-if="errorMessage" :errors="[errorMessage]" />
            </Field>
          </VeeField>
          <VeeField v-slot="{ componentField, errorMessage }" name="confirmPassword">
            <Field>
              <FieldLabel for="pwd-confirm">确认新密码</FieldLabel>
              <Input
                id="pwd-confirm"
                v-bind="componentField"
                type="password"
                placeholder="请再次输入新密码"
                autocomplete="new-password"
              />
              <FieldError v-if="errorMessage" :errors="[errorMessage]" />
            </Field>
          </VeeField>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button type="submit" :disabled="changingPassword">
              {{ changingPassword ? '修改中...' : '确认修改' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="showLogoutConfirm">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>退出登录</AlertDialogTitle>
          <AlertDialogDescription>确定要退出登录吗？</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction @click="handleLogout">确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth'
import { useForm, Field as VeeField } from 'vee-validate'
import { z } from 'zod'
import { ChevronDown, User, Lock, LogOut } from 'lucide-vue-next'
import { logoutUser, getCurrentUser, onAuthStateChange, changeUserPassword } from '@/firebase/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'

const emit = defineEmits(['logout'])

const currentUser = ref(getCurrentUser())

onMounted(() => {
  const unsubscribe = onAuthStateChange((user) => {
    currentUser.value = user
  })
  onUnmounted(() => unsubscribe())
})

const showProfileDialog = ref(false)
const showPasswordDialog = ref(false)
const showLogoutConfirm = ref(false)
const updating = ref(false)
const changingPassword = ref(false)

const profileForm = ref({
  displayName: currentUser.value?.displayName || '',
  email: currentUser.value?.email || '',
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, '密码长度不能少于6个字符'),
    newPassword: z.string().min(6, '密码长度不能少于6个字符'),
    confirmPassword: z.string().min(6, '密码长度不能少于6个字符'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

type PasswordValues = z.infer<typeof passwordSchema>

const { handleSubmit, handleReset } = useForm<PasswordValues>({
  validationSchema: passwordSchema,
  initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
})

const userAvatar = computed(() => currentUser.value?.photoURL || '')

const userInitials = computed(() => {
  if (currentUser.value?.displayName) {
    return currentUser.value.displayName.charAt(0).toUpperCase()
  }
  if (currentUser.value?.email) {
    return currentUser.value.email.charAt(0).toUpperCase()
  }
  return 'U'
})

function openPasswordDialog() {
  handleReset()
  showPasswordDialog.value = true
}

function showProfile() {
  profileForm.value.displayName = currentUser.value?.displayName || ''
  profileForm.value.email = currentUser.value?.email || ''
  showProfileDialog.value = true
}

async function updateProfile() {
  if (!profileForm.value.displayName.trim()) {
    toast.warning('用户名不能为空')
    return
  }
  updating.value = true
  try {
    if (!currentUser.value) throw new Error('用户未登录')
    await firebaseUpdateProfile(currentUser.value, {
      displayName: profileForm.value.displayName.trim(),
    })
    toast.success('个人资料更新成功')
    showProfileDialog.value = false
  } catch {
    toast.error('更新个人资料失败，请重试')
  } finally {
    updating.value = false
  }
}

const onPasswordSubmit = handleSubmit(async (values) => {
  changingPassword.value = true
  try {
    await changeUserPassword(values.currentPassword, values.newPassword)
    toast.success('密码修改成功，请重新登录')
    showPasswordDialog.value = false
    await logoutUser()
    emit('logout')
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string }
    if (err.code === 'auth/invalid-credential') {
      toast.error('当前密码不正确')
    } else {
      toast.error(`修改密码失败: ${err.message}`)
    }
  } finally {
    changingPassword.value = false
  }
})

async function handleLogout() {
  try {
    await logoutUser()
    toast.success('已退出登录')
    emit('logout')
  } catch {
    toast.error('退出登录失败，请重试')
  }
}
</script>
