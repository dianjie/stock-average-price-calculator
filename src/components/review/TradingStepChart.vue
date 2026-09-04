<template>
  <div class="bg-card rounded-xl border p-4">
    <h3 class="mb-3 text-sm font-medium">买卖阶梯图</h3>
    <div class="w-full overflow-auto">
      <div v-if="data.length > 0" class="min-h-125 resize overflow-auto">
        <VChart class="min-h-125" :option="option" autoresize />
      </div>
      <div v-else class="text-muted-foreground flex items-center justify-center text-sm">
        暂无交易数据
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { StepPoint } from '@/composables/review/useReviewDashboard'

const props = defineProps<{
  data: StepPoint[]
}>()

type TradeRow = [
  date: string,
  price: number,
  date2: string,
  action: string,
  price2: number,
  quantity: number,
]

const dataObj = computed(() => {
  const buy: TradeRow[] = []
  const sell: TradeRow[] = []
  const line: [string, number][] = []
  const dateSet = new Set<string>()

  let minPrice = Infinity
  let maxPrice = -Infinity

  props.data.forEach((d) => {
    const row: TradeRow = [d.date, d.price, d.date, d.action, d.price, d.quantity]
    if (d.action === '买入') {
      buy.push(row)
    } else if (d.action === '卖出') {
      sell.push(row)
    }
    line.push([d.date, d.price])
    dateSet.add(d.date)

    // ✅ 用循环代替 Math.min/max(...spread)，避免大数据量栈溢出
    if (d.price < minPrice) minPrice = d.price
    if (d.price > maxPrice) maxPrice = d.price
  })

  // ✅ ETF 核心：基于实际价格范围动态计算 Y 轴边界
  // 仅留 5% 缓冲，让几厘的价差占据尽可能多的纵向像素
  const range = maxPrice - minPrice
  const padding = range > 0 ? range * 0.05 : maxPrice * 0.005 || 0.001

  return {
    buy,
    sell,
    line,
    dates: Array.from(dateSet),
    yMin: Math.max(0, minPrice - padding),
    yMax: maxPrice + padding,
  }
})

const option = computed(() => {
  const { buy, sell, line, dates, yMin, yMax } = dataObj.value

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: { data: TradeRow }) => {
        const [, , date, action, price, qty] = params.data
        const color = action === '买入' ? '#ef4444' : '#22c55e'
        return [
          `<strong>${date}</strong>`,
          `<span style="color:${color}">${action} ${price.toFixed(4)} × ${qty}</span>`,
        ].join('<br/>')
      },
    },
    legend: { data: ['买入', '卖出'], top: 0 },
    grid: { left: 70, right: 30, top: 40, bottom: 60 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: '价格',
      // ✅ 紧贴数据范围，不浪费任何纵向空间
      min: yMin,
      max: yMax,
      // ✅ 增加刻度数量，让微小价差有足够参考线
      splitNumber: 10,
      axisLabel: {
        // ✅ ETF 必须 4 位小数，否则不同价位显示相同值
        formatter: (value: number) => value.toFixed(4),
      },
    },
    dataZoom: [
      {
        type: 'inside', // 支持鼠标滚轮在图表区域内缩放
        yAxisIndex: 0, // 作用于 Y 轴
        zoomLock: false,
        start: 0, // 默认显示 0% 到 100% 的数据
        end: 100,
        zoomOnMouseWheel: true, // 👈 核心修改：显式开启鼠标滚轮缩放
        moveOnMouseMove: true, // 👈 建议添加：允许按住鼠标拖动平移视图
      },
    ],
    series: [
      {
        name: '买入',
        type: 'scatter',
        data: buy,
        symbolSize: 10,
        itemStyle: { color: '#ef4444', borderColor: '#fff', borderWidth: 1.5 },
      },
      {
        name: '卖出',
        type: 'scatter',
        data: sell,
        symbolSize: 10,
        itemStyle: { color: '#22c55e', borderColor: '#fff', borderWidth: 1.5 },
      },
      {
        name: '连线',
        type: 'line',
        step: 'end',
        data: line,
        symbol: 'none',
        lineStyle: { color: '#94a3b8', width: 1 },
        silent: true,
      },
    ],
  }
})
</script>
