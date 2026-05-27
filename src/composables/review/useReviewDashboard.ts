import { computed, type Ref } from 'vue'
import type { StockItem, Transaction } from '@/utils/stockStats'

// ==================== 类型定义 ====================

// 合并后的日历/持仓数据接口
export interface CalendarDay {
  date: string
  // 交易统计相关字段
  buyQty: number
  buyAmount: number
  buyCount: number
  sellQty: number
  sellAmount: number
  sellCount: number
  netAmount: number
  transactions: Transaction[]
  // 持仓状态相关字段
  buyPrice: number
  sellPrice: number
  avgPrice: number
  quantity: number // 当前持仓总量
  avgCost: number // 当前持仓均价
  avgCostPlus5: number
  avgCostMinus5: number
  action: '买入' | '卖出' | '混合'
}

// 逐笔阶梯数据接口
export interface StepPoint {
  date: string
  index: number
  price: number
  quantity: number
  action: '买入' | '卖出'
  totalQuantity: number
  averageCost: number
}

// ==================== Composable 主逻辑 ====================

export function useReviewDashboard(selectedStock: Ref<StockItem>) {
  const dailyAggregatedData = computed(() => {
    if (!selectedStock.value) return { calendar: [] as CalendarDay[], steps: [] as StepPoint[] }

    const transactions = selectedStock.value.transactions
    // 1. 提前排好序
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    const calendarMap = new Map<string, CalendarDay>()
    const steps: StepPoint[] = []

    let totalQty = 0
    let totalCost = 0

    for (const tx of sorted) {
      const amount = tx.totalAmount ?? tx.price * tx.quantity

      // --- 逻辑 A: 生成 stepData (逐笔明细) ---
      if (tx.type === '买入') {
        totalCost += amount
        totalQty += tx.quantity
      } else {
        const avgBeforeSell = totalQty > 0 ? totalCost / totalQty : 0
        totalCost -= avgBeforeSell * tx.quantity
        totalQty -= tx.quantity
        if (totalQty <= 0.00001) {
          totalQty = 0
          totalCost = 0
        }
      }
      steps.push({
        date: tx.date,
        index: steps.length,
        price: tx.price,
        quantity: tx.quantity,
        action: tx.type,
        totalQuantity: totalQty,
        averageCost: totalQty > 0 ? totalCost / totalQty : 0,
      })

      // --- 逻辑 B: 按天聚合 ---
      const day = calendarMap.get(tx.date) || {
        date: tx.date,
        buyQty: 0,
        buyAmount: 0,
        buyCount: 0,
        sellQty: 0,
        sellAmount: 0,
        sellCount: 0,
        netAmount: 0,
        transactions: [],
        buyPrice: 0,
        sellPrice: 0,
        avgPrice: 0,
        quantity: 0,
        avgCost: 0,
        avgCostPlus5: 0,
        avgCostMinus5: 0,
        action: '卖出' as const,
      }

      if (tx.type === '买入') {
        day.buyQty += tx.quantity
        day.buyAmount += amount // 👈 累加 buyAmount
        day.buyCount += 1
      } else {
        day.sellQty += tx.quantity
        day.sellAmount += amount // 👈 累加 sellAmount
        day.sellCount += 1
      }
      day.transactions.push(tx)
      calendarMap.set(tx.date, day)
    }

    // --- 逻辑 C: 为每一天计算最终的持仓状态 ---
    let positionQty = 0
    let positionCost = 0

    const sortedDays = [...calendarMap.values()].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    for (const day of sortedDays) {
      if (day.buyQty > 0) {
        positionCost += day.buyAmount // 👈 使用 buyAmount
        positionQty += day.buyQty
      }
      if (day.sellQty > 0) {
        const avgBeforeSell = positionQty > 0 ? positionCost / positionQty : 0
        positionCost -= avgBeforeSell * day.sellQty
        positionQty -= day.sellQty
        if (positionQty <= 0.00001) {
          positionQty = 0
          positionCost = 0
        }
      }

      // 填充持仓相关字段
      const avgCost = positionQty > 0 ? positionCost / positionQty : 0
      const totalQtySum = day.buyQty + day.sellQty

      // 👇 计算并填充 netAmount
      day.netAmount = day.buyAmount - day.sellAmount

      day.action = day.buyQty > 0 && day.sellQty > 0 ? '混合' : day.buyQty > 0 ? '买入' : '卖出'
      day.buyPrice = day.buyQty > 0 ? day.buyAmount / day.buyQty : 0
      day.sellPrice = day.sellQty > 0 ? day.sellAmount / day.sellQty : 0
      day.avgPrice = totalQtySum > 0 ? (day.buyAmount + day.sellAmount) / totalQtySum : 0
      day.quantity = positionQty
      day.avgCost = avgCost
      day.avgCostPlus5 = avgCost * 1.05
      day.avgCostMinus5 = avgCost * 0.95
    }

    return {
      calendar: sortedDays,
      steps,
    }
  })

  const calendarData = computed(() => dailyAggregatedData.value.calendar)
  const positionData = computed(() => dailyAggregatedData.value.calendar)
  const stepData = computed(() => dailyAggregatedData.value.steps)

  const allTransactions = computed(() => {
    if (!selectedStock.value) return []
    return stepData.value.map((step) => ({
      ...selectedStock.value!.transactions.find(
        (tx) => tx.date === step.date && tx.price === step.price && tx.quantity === step.quantity,
      )!,
      code: selectedStock.value!.code,
      name: selectedStock.value!.name,
      stockType: selectedStock.value!.type,
    }))
  })

  return {
    allTransactions,
    calendarData,
    positionData,
    stepData,
  }
}
