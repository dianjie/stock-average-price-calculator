<template>
  <div class="bg-card rounded-xl border p-4">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-sm font-medium">买卖日历热力图</h3>
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" @click="selectedYear--">
          <ChevronLeft class="size-4" />
        </Button>
        <span class="w-12 text-center text-sm font-medium">{{ selectedYear }}</span>
        <Button variant="ghost" size="icon-sm" @click="selectedYear++">
          <ChevronRight class="size-4" />
        </Button>
      </div>
    </div>
    <div class="w-full overflow-auto">
      <div v-if="hasData" class="min-h-70 resize overflow-auto">
        <VChart class="min-h-70" :option="option" autoresize @click="onClick" />
      </div>
      <div v-else class="text-muted-foreground flex items-center justify-center text-sm">
        暂无交易数据
      </div>
    </div>
    <TransactionDayDialog
      :open="dialogOpen"
      :date="selectedDate"
      :transactions="selectedTransactions"
      @update:open="dialogOpen = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { ECElementEvent } from 'echarts/core'
import type { CalendarDay } from '@/composables/review/useReviewDashboard'
import { Button } from '@/components/ui/button'
import TransactionDayDialog from './TransactionDayDialog.vue'

const props = defineProps<{
  data: CalendarDay[]
}>()

const selectedYear = ref(new Date().getFullYear())
const dialogOpen = ref(false)
const selectedDate = ref('')
const selectedTransactions = ref<CalendarDay['transactions']>([])

const hasData = computed(() => props.data.length > 0)

// 1. 数据处理层：生成 Map 和图表所需的格式化数据
const chartData = computed(() => {
  const dataMap = new Map<string, CalendarDay>()
  const heatmapData: [string, number][] = []
  let maxAbs = 1

  props.data.forEach((d) => {
    dataMap.set(d.date, d)
    heatmapData.push([d.date, d.netAmount])
    maxAbs = Math.max(maxAbs, Math.abs(d.netAmount))
  })

  return {
    dataMap,
    heatmapData,
    maxAbs,
  }
})

// 2. 视图配置层：纯配置组装，通过 Map.get() 实现 O(1) 极速查找
const option = computed(() => {
  const { heatmapData, maxAbs, dataMap } = chartData.value

  return {
    tooltip: {
      formatter: (params: { data: [string, number] }) => {
        const date = params.data[0]
        const day = dataMap.get(date) // 替代 props.data.find()
        if (!day) return ''
        const sign = day.netAmount >= 0 ? '+' : ''
        return [
          `<strong>${date}</strong>`,
          `净买入: ${sign}${day.netAmount.toFixed(2)}`,
          `买入 ${day.buyCount} 笔 / 卖出 ${day.sellCount} 笔`,
          day.buyAmount > 0 && day.sellAmount > 0
            ? '<span style="color:#f59e0b">⚠ 纠结操作日</span>'
            : '',
        ]
          .filter(Boolean)
          .join('<br/>')
      },
    },
    visualMap: {
      min: -maxAbs,
      max: maxAbs,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#16a34a', '#86efac', '#90caf9', '#fca5a5', '#dc2626'],
      },
    },
    calendar: {
      range: [`${selectedYear.value}-01-01`, `${selectedYear.value}-12-31`],
      cellSize: ['auto', '85%'],
      right: 22,
      left: 40,
      top: 40,
      bottom: 60,
      yearLabel: { show: false },
      dayLabel: { firstDay: 1 },
      monthLabel: { show: true },
      splitLine: { show: true, lineStyle: { color: 'var(--border)', width: 1 } },
      itemStyle: { borderWidth: 2, borderColor: 'var(--background)' },
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: heatmapData,
        label: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' },
        },
      },
    ],
  }
})

// 3. 交互层：逻辑简化且更加健壮
function onClick(params: ECElementEvent) {
  // 只要 params.data 存在，就能通过解构直接拿到日期
  if (params.data) {
    const date = (params.data as [string, number])[0]
    const day = chartData.value.dataMap.get(date) // 同样使用 Map.get() 极速获取
    if (day) {
      selectedDate.value = date
      selectedTransactions.value = day.transactions
      dialogOpen.value = true
    }
  }
}
</script>
