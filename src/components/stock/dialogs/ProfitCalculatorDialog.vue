<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { Transaction } from '@/utils/stockStats'

const props = defineProps<{
  open: boolean
  selectedTransactions: Transaction[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function handleClose() {
  emit('update:open', false)
}

const summary = computed(() => {
  let totalBuyCost = 0
  let totalSellReceived = 0
  let totalBuyShares = 0
  let totalSellShares = 0

  for (const t of props.selectedTransactions) {
    if (t.type === '买入') {
      totalBuyCost += t.totalAmount ?? t.price * t.quantity + (t.fee ?? 0)
      totalBuyShares += t.quantity
    } else if (t.type === '卖出') {
      totalSellReceived += t.totalAmount ?? t.price * t.quantity - (t.fee ?? 0)
      totalSellShares += t.quantity
    }
  }

  const remainingShares = totalBuyShares - totalSellShares

  // 买入均价（含手续费成本）
  const avgBuyPrice = totalBuyShares > 0 ? totalBuyCost / totalBuyShares : 0
  // 卖出均价（扣除手续费后到手）
  const avgSellPrice = totalSellShares > 0 ? totalSellReceived / totalSellShares : 0

  // 平均买入成本（用于算已实现盈亏）
  const avgCost = totalBuyShares > 0 ? totalBuyCost / totalBuyShares : 0

  // 已实现盈亏 = 卖出收回 - 卖出部分对应的成本
  const soldCost = avgCost * totalSellShares
  const realizedPnL = totalSellReceived - soldCost

  // 回本价计算
  let breakEvenPrice: number | null = null
  if (remainingShares > 0) {
    const stillNeed = totalBuyCost - totalSellReceived
    if (stillNeed > 0) {
      breakEvenPrice = stillNeed / remainingShares
    } else {
      breakEvenPrice = 0 // 已经回本盈利了，剩余怎么卖都是赚
    }
  }

  return {
    totalBuyCost,
    totalSellReceived,
    remainingShares,
    realizedPnL,
    breakEvenPrice,
    totalBuyShares,
    totalSellShares,
    avgBuyPrice,
    avgSellPrice,
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>选中交易盈亏分析</DialogTitle>
        <DialogDescription>
          汇总选中 {{ selectedTransactions.length }} 笔交易的买卖总账
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- 总买入 / 总卖出 -->
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="bg-muted rounded-lg p-3 text-center">
            <p class="text-muted-foreground mb-1">总买入</p>
            <p class="text-lg font-semibold tabular-nums">
              {{ summary.totalBuyCost.toFixed(2) }} 元
            </p>
            <p class="text-muted-foreground mt-1 text-xs"> {{ summary.totalBuyShares }} 股 </p>
            <!-- 新增：买入均价 -->
            <p class="text-muted-foreground border-border mt-1 border-t pt-1 text-xs">
              买入均价:
              <span class="text-foreground font-medium tabular-nums">{{
                summary.avgBuyPrice.toFixed(4)
              }}</span>
              元/股
            </p>
          </div>
          <div class="bg-muted rounded-lg p-3 text-center">
            <p class="text-muted-foreground mb-1">总卖出</p>
            <p class="text-lg font-semibold tabular-nums">
              {{ summary.totalSellReceived.toFixed(2) }} 元
            </p>
            <p class="text-muted-foreground mt-1 text-xs"> {{ summary.totalSellShares }} 股 </p>
            <!-- 新增：卖出均价 -->
            <p class="text-muted-foreground border-border mt-1 border-t pt-1 text-xs">
              卖出均价:
              <span class="text-foreground font-medium tabular-nums">{{
                summary.avgSellPrice.toFixed(4)
              }}</span>
              元/股
            </p>
          </div>
        </div>

        <!-- 盈亏结果 -->
        <div class="flex items-center justify-center gap-3 py-2">
          <span
            class="text-3xl font-bold tabular-nums"
            :class="{
              'text-green-600': summary.realizedPnL > 0,
              'text-red-600': summary.realizedPnL < 0,
              'text-gray-500': summary.realizedPnL === 0,
            }"
          >
            {{ summary.realizedPnL > 0 ? '+' : '' }}{{ summary.realizedPnL.toFixed(2) }} 元
          </span>
          <Badge
            :variant="
              summary.realizedPnL > 0
                ? 'default'
                : summary.realizedPnL < 0
                  ? 'destructive'
                  : 'secondary'
            "
            :class="summary.realizedPnL > 0 ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''"
          >
            {{ summary.realizedPnL > 0 ? '赚了 📈' : summary.realizedPnL < 0 ? '亏了 📉' : '持平' }}
          </Badge>
        </div>

        <!-- 剩余持仓 & 回本价 -->
        <div class="space-y-2 border-t pt-4 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">剩余持仓</span>
            <span class="font-medium">
              {{
                summary.remainingShares > 0
                  ? `${summary.remainingShares} 股`
                  : `已全部卖出（超卖 ${Math.abs(summary.remainingShares)} 股）`
              }}
            </span>
          </div>

          <div v-if="summary.remainingShares > 0" class="flex items-center justify-between">
            <span class="text-muted-foreground">回本需卖价</span>
            <span
              class="font-bold tabular-nums"
              :class="summary.breakEvenPrice === 0 ? 'text-green-600' : 'text-orange-600'"
            >
              {{
                summary.breakEvenPrice === 0
                  ? '已回本，随便卖都赚 ✅'
                  : `${summary.breakEvenPrice!.toFixed(4)} 元/股`
              }}
            </span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" class="w-full" @click="handleClose">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
