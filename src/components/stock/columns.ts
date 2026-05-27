import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { getTagColor } from '@/config/tags'
import type { Transaction } from '@/utils/stockStats'

interface ColumnMeta {
  unit: string
  onEdit: (index: number) => void
  onDelete: (index: number) => void
}

export function createColumns(meta: ColumnMeta): ColumnDef<Transaction>[] {
  return [
    {
      id: 'select',
      header: ({ table }) =>
        h(Checkbox, {
          modelValue:
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && ('indeterminate' as const)),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            table.toggleAllPageRowsSelected(!!value),
          ariaLabel: 'Select all',
        }),
      cell: ({ row }) =>
        h(Checkbox, {
          modelValue: row.getIsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
          ariaLabel: 'Select row',
        }),
      enableSorting: false,
    },
    {
      accessorKey: 'date',
      header: ({ column }) =>
        h(
          Button,
          {
            variant: 'ghost',
            class: 'mx-auto',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          },
          () => ['日期', h(ArrowUpDown, { class: 'ml-2 size-4' })],
        ),
      cell: ({ row }) => h('div', { class: 'tabular-nums' }, row.getValue('date')),
    },
    {
      accessorKey: 'type',
      header: '类型',
      cell: ({ row }) => {
        const type = row.getValue('type') as string
        return h(Badge, { variant: type === '买入' ? 'default' : 'destructive' }, () => type)
      },
    },
    {
      accessorKey: 'price',
      header: ({ column }) =>
        h(
          Button,
          {
            variant: 'ghost',
            class: 'mx-auto',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          },
          () => ['价格', h(ArrowUpDown, { class: 'ml-2 size-4' })],
        ),
      cell: ({ row }) =>
        h('div', { class: 'tabular-nums' }, Number(row.getValue('price')).toFixed(3)),
    },
    {
      accessorKey: 'quantity',
      header: () => `数量(${meta.unit})`,
      cell: ({ row }) => {
        const v = row.getValue('quantity') as number
        return h('div', { class: 'tabular-nums' }, meta.unit === '克' ? v.toFixed(4) : String(v))
      },
    },
    {
      accessorKey: 'amount',
      header: '金额',
      cell: ({ row }) =>
        h('div', { class: 'tabular-nums' }, ((row.getValue('amount') as number) ?? 0).toFixed(2)),
    },
    {
      accessorKey: 'fee',
      header: '费用',
      cell: ({ row }) =>
        h('div', { class: 'tabular-nums' }, ((row.getValue('fee') as number) ?? 0).toFixed(2)),
    },
    {
      accessorKey: 'totalAmount',
      header: '总金额',
      cell: ({ row }) =>
        h(
          'div',
          { class: 'tabular-nums' },
          ((row.getValue('totalAmount') as number) ?? 0).toFixed(2),
        ),
    },
    {
      accessorKey: 'tags',
      header: '标签',
      cell: ({ row }) => {
        const tags = row.getValue('tags') as string[] | undefined
        if (!tags || tags.length === 0) {
          return h('span', { class: 'text-muted-foreground text-xs' }, '-')
        }
        return h(
          'div',
          { class: 'flex flex-wrap gap-1 justify-center' },
          tags.map((tag) => h(Badge, { variant: 'outline', class: getTagColor(tag) }, () => tag)),
        )
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const idx = row.index
        return h('div', { class: 'flex gap-1 justify-center' }, [
          h(
            Button,
            {
              variant: 'ghost',
              size: 'icon-sm',
              onClick: () => meta.onEdit(idx),
            },
            () => '✎',
          ),
          h(
            Button,
            {
              variant: 'ghost',
              size: 'icon-sm',
              class: 'text-destructive',
              onClick: () => meta.onDelete(idx),
            },
            () => '✕',
          ),
        ])
      },
      enableSorting: false,
    },
  ]
}
