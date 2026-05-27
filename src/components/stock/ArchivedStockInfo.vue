<template>
  <div class="space-y-3 rounded-lg border p-4 sm:p-5">
    <h3 class="text-base font-semibold">封存信息</h3>

    <div class="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground shrink-0 text-xs">类型</span>
        <Badge :variant="stock.type === '积存金' ? 'secondary' : 'default'">{{ stock.type }}</Badge>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground shrink-0 text-xs">交易次数</span>
        <span class="text-right font-semibold tabular-nums">{{ stock.transactions.length }}</span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground shrink-0 text-xs">当前持仓({{ unit }})</span>
        <span
          :class="[
            'text-right font-semibold tabular-nums',
            (stock.currentQuantity || 0) > 0 ? 'text-green-500' : 'text-muted-foreground',
          ]"
        >
          {{ formatQty(stock.currentQuantity) }}
        </span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground shrink-0 text-xs">已实现盈亏</span>
        <span
          :class="[
            'text-right font-semibold tabular-nums',
            (stock.realizedProfit || 0) >= 0 ? 'text-red-500' : 'text-green-500',
          ]"
        >
          {{ formatCurrency(stock.realizedProfit) }}
        </span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground shrink-0 text-xs">总投入</span>
        <span class="text-right font-semibold tabular-nums">{{
          formatCurrency(stock.totalInvestment)
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import type { StockItem } from '@/utils/stockStats'

const props = defineProps<{ stock: StockItem }>()

const unit = computed(() => (props.stock.type === '积存金' ? '克' : '股'))

function formatCurrency(v: number | undefined, fix = 2): string {
  if (v === undefined || v === null) return '0.00'
  return Number(v).toFixed(fix)
}

function formatQty(v: number | undefined): string {
  if (v === undefined || v === null) return '0'
  return String(v)
}
</script>
