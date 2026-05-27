<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>每日费用统计</DialogTitle>
      </DialogHeader>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-4 border-b pb-3">
          <div>
            <span class="text-muted-foreground text-sm">总费用</span>
            <p class="font-semibold tabular-nums">{{ formatCurrency(totalFees) }}</p>
          </div>
          <div>
            <span class="text-muted-foreground text-sm">总卖出均价(扣手续费)</span>
            <p class="font-semibold text-green-500 tabular-nums">{{
              formatCurrency(avgSellPrice, 3)
            }}</p>
          </div>
        </div>
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-32">日期</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>费用</TableHead>
                <TableHead>卖出均价(扣手续费)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in dailyFees" :key="row.date">
                <TableCell class="tabular-nums">{{ row.date }}</TableCell>
                <TableCell class="tabular-nums">{{ formatCurrency(row.sellQty, 4) }}</TableCell>
                <TableCell class="tabular-nums">{{ formatCurrency(row.fee) }}</TableCell>
                <TableCell class="tabular-nums">
                  {{ row.sellAveragePrice > 0 ? formatCurrency(row.sellAveragePrice, 3) : '-' }}
                </TableCell>
              </TableRow>
              <TableRow v-if="dailyFees.length === 0">
                <TableCell colspan="3" class="text-muted-foreground py-4 text-center">
                  无数据
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
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
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

defineProps<{
  open: boolean
  totalFees: number
  avgSellPrice: number
  dailyFees: { date: string; fee: number; sellQty: number; sellAveragePrice: number }[]
}>()

defineEmits<{
  'update:open': [value: boolean]
}>()

function formatCurrency(v: number, fix = 2): string {
  return v.toFixed(fix)
}
</script>
