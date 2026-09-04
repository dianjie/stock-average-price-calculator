<template>
  <div class="bg-card rounded-xl border p-4">
    <h3 class="mb-3 text-sm font-medium">持仓图</h3>
    <div class="w-full overflow-auto">
      <div v-if="data.length > 0" class="min-h-125 resize overflow-auto">
        <VChart ref="chartRef" class="min-h-125" :option="option" autoresize @click="onClick" />
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
import { watch, computed, ref } from 'vue'
import VChart from 'vue-echarts'
import type { ECElementEvent } from 'echarts/core'
import type { CalendarDay } from '@/composables/review/useReviewDashboard'
import type { Transaction } from '@/utils/stockStats'
import TransactionDayDialog from './TransactionDayDialog.vue'

const props = defineProps<{
  data: CalendarDay[]
  transactions: Transaction[]
}>()

const dialogOpen = ref(false)
const selectedDate = ref('')
const selectedTransactions = ref<Transaction[]>([])

// 1. 数据处理层：只遍历一次 props.data，生成 Map 和图表所需的基础数据
const chartData = computed(() => {
  const dataMap = new Map<string, CalendarDay>()
  const barData: [string, number, string][] = [] // [date, quantity, action]
  const lineData: [string, number][] = [] // [date, avgCost]
  const dates: string[] = []

  let maxQty = 1
  const prices: number[] = []

  props.data.forEach((d) => {
    dataMap.set(d.date, d)
    dates.push(d.date)

    maxQty = Math.max(maxQty, d.quantity)
    if (d.avgCost > 0) prices.push(d.avgCost)
    if (d.buyPrice > 0) prices.push(d.buyPrice)
    if (d.sellPrice > 0) prices.push(d.sellPrice)

    barData.push([d.date, d.quantity, d.action || ''])
    lineData.push([d.date, d.avgCost])
  })

  // ✅ ETF 优化：价格轴基于实际数据动态计算范围，而非从 0 开始
  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPriceVal = prices.length ? Math.max(...prices) : 1
  const pricePadding = (maxPriceVal - minPrice) * 0.15 || maxPriceVal * 0.01
  const adjustedMinPrice = Math.max(0, minPrice - pricePadding)
  const adjustedMaxPrice = maxPriceVal + pricePadding

  return {
    dataMap,
    barData,
    lineData,
    dates,
    maxQty: maxQty * 1.2,
    adjustedMinPrice,
    adjustedMaxPrice,
  }
})

// 2. 视图配置层：纯配置组装，通过 Map.get() 实现 O(1) 极速查找
const option = computed(() => {
  const { dataMap, barData, lineData, dates, maxQty, adjustedMinPrice, adjustedMaxPrice } =
    chartData.value

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { seriesName: string; data: [string, number] }[]) => {
        const date = params[0]?.data?.[0]
        const pt = dataMap.get(date)
        if (!pt) return date
        const lines = [`<strong>${date}</strong>`]
        lines.push(`持仓量: ${pt.quantity}`)
        if (pt.buyQty > 0) {
          // ✅ ETF 优化：统一保留 4 位小数
          lines.push(`买入均价: ${pt.buyPrice.toFixed(4)}`)
          lines.push(`买入数量: ${pt.buyQty}`)
          lines.push(`买入次数: ${pt.buyCount}`)
        }
        if (pt.sellQty > 0) {
          lines.push(`卖出均价: ${pt.sellPrice.toFixed(4)}`)
          lines.push(`卖出数量: ${pt.sellQty}`)
          lines.push(`卖出次数: ${pt.sellCount}`)
        }
        lines.push(`持仓均价: ${pt.avgCost.toFixed(4)}`)
        return lines.join('<br/>')
      },
    },
    legend: { data: ['持仓量', '持仓均价'], top: 0 },
    grid: { left: 70, right: 80, top: 40, bottom: 80 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { rotate: 45, fontSize: 10 },
      triggerEvent: true,
    },
    yAxis: [
      {
        type: 'value',
        name: '持仓量',
        min: 0,
        max: maxQty,
        axisLabel: { formatter: (value: number) => Number(value.toFixed(4)) },
      },
      {
        type: 'value',
        name: '价格',
        // ✅ ETF 优化：动态 min/max + 增加刻度密度
        min: adjustedMinPrice,
        max: adjustedMaxPrice,
        splitNumber: 8,
        axisLabel: {
          formatter: (value: number) => value.toFixed(4),
        },
      },
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        bottom: 10,
        height: 20,
        filterMode: 'none',
      },
    ],
    series: [
      {
        name: '持仓量',
        type: 'bar',
        data: barData,
        itemStyle: {
          color: (p: { data: [string, number, string] }) => {
            const action = p.data[2]
            if (action === '买入') return '#fecaca'
            if (action === '卖出') return '#bbf7d0'
            return '#fde68a'
          },
          borderRadius: [2, 2, 0, 0],
        },
        barMaxWidth: 60,
      },
      {
        name: '持仓均价',
        type: 'line',
        yAxisIndex: 1,
        step: 'end',
        data: lineData,
        lineStyle: { color: '#3b82f6', width: 2 },
        itemStyle: { color: '#3b82f6' },
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59,130,246,0.15)' },
              { offset: 1, color: 'rgba(59,130,246,0)' },
            ],
          },
        },
      },
    ],
  }
})

// 3. 交互层：逻辑大幅简化
function onClick(params: ECElementEvent) {
  let date: string | undefined

  if (params.componentType === 'series' && params.data) {
    date = (params.data as string[])[0]
  } else if (params.componentType === 'xAxis') {
    date = params.value as string
  }

  if (date) {
    selectedDate.value = date
    selectedTransactions.value = props.transactions.filter((tx) => tx.date === date)
    if (selectedTransactions.value.length > 0) {
      dialogOpen.value = true
    }
  }
}

const chartRef = ref<InstanceType<typeof VChart>>()

watch(
  () => props.data,
  () => {
    chartRef.value?.dispatchAction({
      type: 'dataZoom',
      batch: [{ xAxisIndex: 0, start: 0, end: 100 }],
    })
  },
)
</script>
