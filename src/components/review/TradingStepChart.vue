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
  const allPrices: number[] = []

  props.data.forEach((d) => {
    const row: TradeRow = [d.date, d.price, d.date, d.action, d.price, d.quantity]
    if (d.action === '买入') {
      buy.push(row)
    } else if (d.action === '卖出') {
      sell.push(row)
    }
    line.push([d.date, d.price])
    dateSet.add(d.date)
    allPrices.push(d.price)
  })
  return {
    buy,
    sell,
    line,
    dates: Array.from(dateSet),
    minPrice: Math.min(...allPrices),
  }
})

const option = computed(() => {
  const { buy, sell, line, dates, minPrice } = dataObj.value

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: { data: TradeRow }) => {
        const [, , date, action, price, qty] = params.data
        const color = action === '买入' ? '#ef4444' : '#22c55e'
        return [
          `<strong>${date}</strong>`,
          `<span style="color:${color}">${action} ${price.toFixed(3)} × ${qty}</span>`,
        ].join('<br/>')
      },
    },
    grid: { left: 70, right: 30, top: 40, bottom: 70 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: '价格',
      min: Math.floor(minPrice * 0.985 * 1000) / 1000,
      // 开启 Y 轴的数据缩放，允许用户放大查看细节
      minInterval: 0.1, // 保证刻度足够精细
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
