<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-base font-semibold">交易记录</h3>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" @click="$emit('share')">分享长图</Button>
        <Button variant="default" size="sm" @click="$emit('addTransaction')">添加交易</Button>
        <Button
          variant="default"
          size="sm"
          :disabled="selectedIds.length === 0"
          @click="$emit('calcBreakEven')"
        >
          计算卖出价
        </Button>
        <Button
          variant="destructive"
          size="sm"
          :disabled="selectedIds.length === 0"
          @click="$emit('batchDelete')"
        >
          批量删除
        </Button>
      </div>
    </div>

    <div class="share-container">
      <Table
        :style="{
          borderRadius: 'calc(var(--radius) - 2px)',
          borderWidth: '1px',
          maxHeight: '450px',
        }"
      >
        <TableHeader class="bg-background sticky top-0 z-50">
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id" class="text-center">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="text-center">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell :colspan="columns.length" class="text-muted-foreground py-6 text-center">
              暂无交易记录
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <div
        v-if="table.getFilteredRowModel().rows.length > 0"
        data-slot="table-selects"
        class="text-muted-foreground py-2 text-sm"
      >
        {{ table.getFilteredSelectedRowModel().rows.length }} /
        {{ table.getFilteredRowModel().rows.length }} 条已选
      </div>

      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { FlexRender, getCoreRowModel, getSortedRowModel, useVueTable } from '@tanstack/vue-table'
import type { SortingState, RowSelectionState } from '@tanstack/vue-table'
import { valueUpdater } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { createColumns } from './columns'
import type { Transaction } from '@/utils/stockStats'

const props = defineProps<{
  transactions: Transaction[]
  selectedTransactions: Transaction[]
  unit: string
}>()

const emit = defineEmits<{
  'update:selectedTransactions': [value: Transaction[]]
  share: []
  addTransaction: []
  calcBreakEven: []
  batchDelete: []
  editTransaction: [index: number]
  deleteTransaction: [index: number]
}>()

const sorting = ref<SortingState>([])

function txIndex(tx: Transaction): number {
  return props.transactions.indexOf(tx)
}

const rowSelection = computed<RowSelectionState>({
  get: () => {
    const map: RowSelectionState = {}
    for (const tx of props.selectedTransactions) {
      const i = txIndex(tx)
      if (i >= 0) map[i] = true
    }
    return map
  },
  set: (val) => {
    const keys = Object.keys(val).map(Number)
    const selected = keys.map((i) => props.transactions[i]).filter(Boolean)
    emit('update:selectedTransactions', selected)
  },
})

const columns = createColumns({
  unit: props.unit,
  onEdit: (index: number) => emit('editTransaction', index),
  onDelete: (index: number) => emit('deleteTransaction', index),
})

const table = useVueTable({
  get data() {
    return props.transactions
  },
  columns,
  getRowId: (_row, index) => String(index),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelection),
  state: {
    get sorting() {
      return sorting.value
    },
    get rowSelection() {
      return rowSelection.value
    },
  },
})

const selectedIds = computed(() => props.selectedTransactions)
</script>
