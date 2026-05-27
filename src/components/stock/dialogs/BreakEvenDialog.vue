<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>建议卖出价计算</DialogTitle>
        <DialogDescription>已选择 {{ selectedCount }} 条交易记录</DialogDescription>
      </DialogHeader>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between border-b pb-1">
          <span class="text-muted-foreground">净持仓数量({{ unit }})</span>
          <span class="font-medium tabular-nums">{{ formatQty(data.totalQuantity) }}</span>
        </div>
        <div class="flex justify-between border-b pb-1">
          <span class="text-muted-foreground">净投入金额</span>
          <span class="font-medium tabular-nums">{{ formatCurrency(data.totalCost) }}</span>
        </div>
        <div class="flex justify-between border-b pb-1">
          <span class="text-muted-foreground">平均持仓成本</span>
          <span class="font-medium tabular-nums">{{
            formatCurrency(data.averageBuyPrice, 3)
          }}</span>
        </div>
        <div class="flex justify-between border-b pb-1">
          <span class="text-muted-foreground">不亏钱卖出价</span>
          <span class="text-base font-bold text-red-500 tabular-nums">{{
            formatCurrency(data.breakEvenPrice, 3)
          }}</span>
        </div>
        <div class="flex justify-between border-b pb-1">
          <span class="text-muted-foreground">卖出费用估算</span>
          <span class="font-medium tabular-nums">{{
            formatCurrency(data.estimatedSellingFee)
          }}</span>
        </div>
        <div class="flex justify-between border-b pb-1">
          <span class="text-muted-foreground">原持仓均价</span>
          <span class="font-medium tabular-nums">{{
            formatCurrency(data.originalAveragePrice, 3)
          }}</span>
        </div>
        <div v-if="data.newAveragePrice > 0" class="flex justify-between border-b pb-1">
          <span class="text-muted-foreground">卖出后新均价</span>
          <span
            :class="[
              'font-medium tabular-nums',
              data.priceChangePercentage >= 0 ? 'text-red-500' : 'text-green-500',
            ]"
          >
            {{ formatCurrency(data.newAveragePrice, 3) }}
            <span class="ml-2"
              >({{ data.priceChangePercentage >= 0 ? '+' : ''
              }}{{ formatCurrency(data.priceChangePercentage, 2) }}%)</span
            >
          </span>
        </div>
        <div v-else class="flex justify-between border-b pb-1">
          <span class="text-muted-foreground">卖出后新均价</span
          ><span class="text-muted-foreground">卖出后无剩余持仓</span>
        </div>
      </div>
      <div class="text-muted-foreground mt-3 space-y-0.5 text-xs">
        <p>1. 不亏钱卖出价 = (买入总金额 + 卖出费用) ÷ 买入总数量</p>
        <p>2. 卖出费用包括：佣金、印花税、过户费等</p>
        <p>3. 卖出后新均价 = 剩余总成本 ÷ 剩余持仓数量</p>
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
  selectedCount: number
  unit: string
  data: {
    totalQuantity: number
    totalCost: number
    averageBuyPrice: number
    breakEvenPrice: number
    estimatedSellingFee: number
    originalAveragePrice: number
    newAveragePrice: number
    priceChangePercentage: number
  }
}>()

defineEmits<{
  'update:open': [value: boolean]
}>()

function formatCurrency(v: number, fix = 2): string {
  return v.toFixed(fix)
}
function formatQty(v: number): string {
  return String(v)
}
</script>
