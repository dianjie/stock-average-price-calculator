<template>
  <div class="mt-4 space-y-3 rounded-lg border p-4 sm:p-5">
    <h3 class="text-base font-semibold">持仓统计</h3>

    <div class="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground shrink-0 text-xs">当前持仓({{ unit }})</span>
        <span class="text-right font-semibold tabular-nums">{{
          formatQty(stats.currentQuantity)
        }}</span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground shrink-0 text-xs">平均成本</span>
        <span class="text-right font-semibold tabular-nums">{{
          formatCurrency(stats.averageCost, 3)
        }}</span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground shrink-0 text-xs">总投入</span>
        <span class="text-right font-semibold tabular-nums">{{
          formatCurrency(stats.totalInvestment)
        }}</span>
      </div>

      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground shrink-0 text-xs">当前价格</span>
        <Input
          type="number"
          :model-value="modelValue"
          :step="stockType === '积存金' ? 0.001 : 0.01"
          :min="0"
          class="h-8 w-24 sm:w-28"
          @update:model-value="(v: string | number) => emit('update:modelValue', Number(v))"
        />
      </div>
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground inline-flex shrink-0 items-center gap-0.5 text-xs">
          回本价格
          <TooltipProvider :delay-duration="200">
            <Tooltip>
              <TooltipTrigger class="inline-flex cursor-help">
                <Info class="text-muted-foreground size-3" />
              </TooltipTrigger>
              <TooltipContent class="max-w-56"> 考虑历史已实现盈亏后的实际回本价 </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </span>
        <span class="text-right font-bold text-red-500 tabular-nums">{{
          formatCurrency(stats.breakEvenPrice, 3)
        }}</span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground shrink-0 text-xs">费用统计</span>
        <div class="flex items-center gap-0.5">
          <span class="font-semibold tabular-nums">{{ formatCurrency(totalFees) }}</span>
          <TooltipProvider :delay-duration="200">
            <Tooltip>
              <TooltipTrigger class="inline-flex cursor-help">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="size-5"
                  @click="$emit('showDailyFees')"
                >
                  <Info class="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent class="max-w-56"> 每日费用统计 </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground shrink-0 text-xs">持仓盈亏</span>
        <span
          :class="[
            'text-right font-semibold tabular-nums',
            stats.profitAndLoss >= 0 ? 'text-red-500' : 'text-green-500',
          ]"
        >
          {{ formatCurrency(stats.profitAndLoss) }}
        </span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground shrink-0 text-xs">已实现盈亏</span>
        <span
          :class="[
            'text-right font-semibold tabular-nums',
            stats.realizedProfit >= 0 ? 'text-red-500' : 'text-green-500',
          ]"
        >
          {{ formatCurrency(stats.realizedProfit) }}
        </span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground shrink-0 text-xs">盈亏百分比</span>
        <span
          :class="[
            'text-right font-semibold tabular-nums',
            stats.profitAndLossPercentage >= 0 ? 'text-red-500' : 'text-green-500',
          ]"
        >
          {{ formatCurrency(stats.profitAndLossPercentage, 3) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { StockStats, StockItem } from '@/utils/stockStats'

defineProps<{
  stats: StockStats
  totalFees: number
  unit: string
  stockType: StockItem['type']
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  showDailyFees: []
}>()

function formatCurrency(v: number | undefined, fix = 2): string {
  if (v === undefined || v === null) return '0.00'
  return Number(v).toFixed(fix)
}

function formatQty(v: number | undefined): string {
  if (v === undefined || v === null) return '0'
  return String(v)
}
</script>
