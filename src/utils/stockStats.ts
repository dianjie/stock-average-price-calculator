import type { FeeSettings } from '@/config/feeSettings'
import { calculateSellingFee } from '@/utils/feeCalculator'

export interface Transaction {
  date: string
  type: '买入' | '卖出'
  price: number
  quantity: number
  amount?: number
  fee?: number
  totalAmount?: number
  tags?: string[]
}

export interface StockItem {
  code: string
  name: string
  type: 'A股' | 'ETF' | '积存金'
  transactions: Transaction[]
  currentPrice?: number
  averageCost?: number
  totalInvestment?: number
  profitAndLoss?: number
  profitAndLossPercentage?: number
  currentQuantity?: number
  realizedProfit?: number
  breakEvenPrice?: number
  archived?: boolean
  customFeeSettings?: FeeSettings
}

export interface StockStats {
  currentQuantity: number
  averageCost: number
  totalInvestment: number
  realizedProfit: number
  breakEvenPrice: number
  profitAndLoss: number
  profitAndLossPercentage: number
}

export function computeStockStats(stock: StockItem, currentPrice?: number, feeSettings?: FeeSettings): StockStats {
  if (!stock || !stock.transactions || stock.transactions.length === 0) {
    return {
      currentQuantity: 0,
      averageCost: 0,
      totalInvestment: 0,
      realizedProfit: 0,
      breakEvenPrice: 0,
      profitAndLoss: 0,
      profitAndLossPercentage: 0,
    }
  }

  let totalShares = 0
  let averageCost = 0
  let realizedProfit = 0
  let netInvestment = 0

  const sortedTransactions = [...stock.transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  for (const transaction of sortedTransactions) {
    if (transaction.type === '买入') {
      const buyAmount = transaction.totalAmount || 0
      const buyQty = transaction.quantity || 0
      averageCost = (averageCost * totalShares + buyAmount) / (totalShares + buyQty)
      totalShares += buyQty
      netInvestment += buyAmount
    } else {
      const sellAmount = transaction.totalAmount || 0
      const sellQty = transaction.quantity || 0
      realizedProfit += sellAmount - sellQty * averageCost
      totalShares -= sellQty
      netInvestment -= sellAmount
      if (Math.abs(totalShares) < 0.00001) {
        totalShares = 0
        averageCost = 0
      }
    }
  }

  totalShares = Number(totalShares.toFixed(4))
  const totalInvestment = averageCost * totalShares
  const price = currentPrice ?? stock.currentPrice ?? 0
  const profitAndLoss = (price - averageCost) * totalShares

  const noFeeBreakEven = totalShares > 0.00001 ? netInvestment / totalShares : 0
  let breakEvenPrice = noFeeBreakEven
  if (feeSettings && totalShares > 0.00001) {
    const estimatedFee = calculateSellingFee(totalShares, noFeeBreakEven, stock.type, stock.code, feeSettings)
    breakEvenPrice = (netInvestment + estimatedFee) / totalShares
  }

  let profitAndLossPercentage = 0
  if (totalInvestment > 0) {
    profitAndLossPercentage = (profitAndLoss / totalInvestment) * 100
  }

  return {
    currentQuantity: totalShares,
    averageCost,
    totalInvestment,
    realizedProfit,
    breakEvenPrice,
    profitAndLoss,
    profitAndLossPercentage,
  }
}

export function applyStatsToStock(
  stock: StockItem,
  stats: StockStats,
  currentPrice?: number,
): void {
  stock.averageCost = stats.averageCost
  stock.totalInvestment = stats.totalInvestment
  stock.profitAndLoss = stats.profitAndLoss
  stock.profitAndLossPercentage = stats.profitAndLossPercentage
  stock.currentQuantity = stats.currentQuantity
  stock.realizedProfit = stats.realizedProfit
  stock.breakEvenPrice = stats.breakEvenPrice
  if (currentPrice !== undefined) {
    stock.currentPrice = currentPrice
  }
}
