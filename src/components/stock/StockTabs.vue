<template>
  <div class="mb-4">
    <div class="mb-4 flex justify-center">
      <ToggleGroup
        class="bg-background flex rounded-lg border p-1 shadow-sm"
        type="single"
        :model-value="active"
        @update:model-value="(val: any) => val && emit('update:active', val)"
      >
        <ToggleGroupItem
          value="active"
          class="group data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-7"
        >
          在档
          <Badge
            variant="outline"
            class="group-data-[state=on]:text-primary-foreground h-5 px-1.5 text-xs"
          >
            {{ activeCount }}
          </Badge>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="archived"
          class="group data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-7"
        >
          封存
          <Badge
            variant="outline"
            class="group-data-[state=on]:text-primary-foreground h-5 px-1.5 text-xs"
          >
            {{ archivedCount }}
          </Badge>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <Tabs
      v-if="currentStocks.length > 0"
      :model-value="stockIndex"
      @update:model-value="(v: string | number) => emit('update:stockIndex', String(v))"
    >
      <TabsList class="h-auto flex-wrap">
        <TabsTrigger
          v-for="(stock, i) in currentStocks"
          :key="stock.code"
          :value="String(i)"
          class="group gap-1.5"
        >
          <span>{{ stock.name }} ({{ stock.code }})</span>
          <div
            v-if="stock.customFeeSettings"
            class="bg-primary size-1.5 shrink-0 rounded-full"
            title="已设置独立费率"
          />
          <TooltipProvider :delay-duration="300">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="ml-1 size-5 opacity-50 group-hover:opacity-100"
                  @click.stop="$emit('edit-fee', stock)"
                >
                  <SlidersHorizontal class="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{{
                stock.customFeeSettings ? '修改独立费率' : '设置独立费率'
              }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider :delay-duration="300">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="ml-1 size-5 opacity-50 group-hover:opacity-100"
                  @click.stop="stock.archived ? $emit('unarchive', stock) : $emit('archive', stock)"
                >
                  <Lock v-if="!stock.archived" class="size-3" />
                  <LockOpen v-else class="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{{ stock.archived ? '解冻' : '封存' }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider :delay-duration="300">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="text-destructive size-5 opacity-50 group-hover:opacity-100"
                  @click.stop="$emit('delete', stock)"
                >
                  <Trash2 class="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>删除</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <div v-else class="flex justify-center py-8">
      <p class="text-muted-foreground text-sm">
        {{ active === 'active' ? '暂无在档数据' : '暂无封存数据' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lock, LockOpen, Trash2, SlidersHorizontal } from 'lucide-vue-next'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { StockItem } from '@/utils/stockStats'

defineProps<{
  active: 'active' | 'archived'
  stockIndex: string
  currentStocks: StockItem[]
  activeCount: number
  archivedCount: number
}>()

const emit = defineEmits<{
  'update:active': [value: 'active' | 'archived']
  'update:stockIndex': [value: string]
  archive: [stock: StockItem]
  unarchive: [stock: StockItem]
  delete: [stock: StockItem]
  'edit-fee': [stock: StockItem]
}>()
</script>
