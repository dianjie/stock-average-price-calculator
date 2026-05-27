<template>
  <AlertDialog>
    <AlertDialogTrigger as-child>
      <Button variant="ghost" size="sm"> 游客访问 (本地存储) </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>提示</AlertDialogTitle>
        <AlertDialogDescription>
          游客模式下数据仅保存在本地浏览器中，清除缓存或更换浏览器会导致数据丢失。建议注册账号以永久保存数据。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction @click="emit('confirm')">继续访问</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const emit = defineEmits<{
  (e: 'confirm'): void
}>()
</script>
