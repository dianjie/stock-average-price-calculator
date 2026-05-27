<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ date }} 交易明细</DialogTitle>
        <DialogDescription>共 {{ transactions.length }} 笔交易</DialogDescription>
      </DialogHeader>
      <div class="max-h-64 space-y-2 overflow-y-auto">
        <div
          v-for="(tx, i) in transactions"
          :key="i"
          class="bg-muted flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm"
        >
          <div class="flex flex-col gap-1">
            <div>
              <span
                class="rounded px-1.5 py-0.5 text-xs font-medium"
                :class="
                  tx.type === '买入' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                "
              >
                {{ tx.type }}
              </span>
            </div>
            <div v-if="tx.tags?.length" class="flex flex-wrap gap-1">
              <span
                v-for="tag in tx.tags"
                :key="tag"
                :class="['shrink-0 rounded px-1.5 py-0.5 text-xs font-medium', getTagColor(tag)]"
                >{{ tag }}
              </span>
            </div>
          </div>
          <div class="shrink-0 space-y-1 text-right">
            <div>{{ (tx.price * tx.quantity).toFixed(2) }}</div>
            <div class="text-muted-foreground text-xs">
              {{ tx.price.toFixed(3) }} × {{ tx.quantity }}
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">关闭</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { Transaction } from '@/utils/stockStats'
import { getTagColor } from '@/config/tags'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

defineProps<{
  open: boolean
  date: string
  transactions: Transaction[]
}>()

defineEmits<{
  'update:open': [value: boolean]
}>()
</script>
