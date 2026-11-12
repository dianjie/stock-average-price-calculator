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

const JUMP_RATIO = 1 // 相对上一有效均价跳变 >100% 视为飙升失真点；波动大的杠杆/商品ETF可调到 2~3

const chartData = computed(() => {
  const dataMap = new Map<string, CalendarDay>()
  const barData: [string, number, string][] = []
  const lineData: [string, number | null][] = []
  const dates: string[] = []
  const spikeDates = new Set<string>() // 记录被忽略的点，给 tooltip 用

  let maxQty = 1
  const prices: number[] = [] // 只收有效均价，飙升点不进，Y轴不会被撑爆
  let prevValidAvg: number | null = null

  props.data.forEach((d) => {
    dataMap.set(d.date, d)
    dates.push(d.date)
    maxQty = Math.max(maxQty, d.quantity)
    if (d.buyPrice > 0) prices.push(d.buyPrice)
    if (d.sellPrice > 0) prices.push(d.sellPrice)

    const avg = d.avgCost
    const jump = prevValidAvg && prevValidAvg > 0 ? Math.abs(avg - prevValidAvg) / prevValidAvg : 0
    // 病态：均价非正（成本被冲成 0/负）或相对上一正常点跳变过大
    const invalid = avg <= 0 || jump > JUMP_RATIO

    if (invalid) {
      spikeDates.add(d.date)
      lineData.push([d.date, null])
      // ⚠️ 不更新 prevValidAvg：后续点继续跟"飙升前"比，
      //    连成一片的高位失真段会被整体忽略，直到均价回落到合理区间
    } else {
      lineData.push([d.date, Number(avg.toFixed(4))])
      prices.push(avg)
      prevValidAvg = avg
    }

    barData.push([d.date, d.quantity, d.action || ''])
  })

  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPriceVal = prices.length ? Math.max(...prices) : 1
  const pricePadding = (maxPriceVal - minPrice) * 0.15 || maxPriceVal * 0.01

  return {
    dataMap,
    barData,
    lineData,
    dates,
    spikeDates,
    maxQty: maxQty * 1.2,
    adjustedMinPrice: Math.max(0, minPrice - pricePadding),
    adjustedMaxPrice: maxPriceVal + pricePadding,
  }
})

// 2. 视图配置层：纯配置组装，通过 Map.get() 实现 O(1) 极速查找
const option = computed(() => {
  const {
    dataMap,
    barData,
    lineData,
    dates,
    spikeDates,
    maxQty,
    adjustedMinPrice,
    adjustedMaxPrice,
  } = chartData.value

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
        if (spikeDates.has(date)) {
          lines.push(`持仓均价: —（持仓 ${pt.quantity} 时成本失真，已忽略）`)
        } else {
          lines.push(`持仓均价: ${pt.avgCost.toFixed(4)}`)
        }
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
        connectNulls: false,
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
