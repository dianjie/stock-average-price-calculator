import { ref } from 'vue'
import { saveUserStocks, getUserStocks } from '../firebase/db'
import type { StockItem } from '@/utils/stockStats'
import { computeStockStats, applyStatsToStock } from '@/utils/stockStats'

const stocks = ref<StockItem[]>([])
const currentUser = ref<{ uid: string } | null>(null)
const dataLoaded = ref(false)

export function useStockData() {
  function recalculateAllStocks() {
    for (const stock of stocks.value) {
      const stats = computeStockStats(stock)
      applyStatsToStock(stock, stats)
    }
  }

  // 优化：去掉无意义的 return true/false，让调用方通过 try-catch 感知成功或失败
  async function saveData() {
    if (currentUser.value) {
      await saveUserStocks(currentUser.value.uid, stocks.value)
    } else {
      localStorage.setItem('stockData', JSON.stringify(stocks.value))
    }
  }

  async function loadData() {
    try {
      if (currentUser.value) {
        const data = await getUserStocks(currentUser.value.uid)
        if (data && Array.isArray(data)) {
          stocks.value = (data as StockItem[]).map(normalizeStock)
          recalculateAllStocks()
        }
      } else {
        const raw = localStorage.getItem('stockData')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            stocks.value = parsed.map(normalizeStock)
            recalculateAllStocks()
          }
        }
      }
    } catch {
      stocks.value = []
    } finally {
      dataLoaded.value = true
    }
  }

  function setUser(user: { uid: string } | null) {
    currentUser.value = user
  }

  return { stocks, dataLoaded, currentUser, setUser, loadData, saveData, recalculateAllStocks }
}

// 优化：使用 ??= 赋值运算符简化默认值填充，代码更优雅
function normalizeStock(stock: StockItem): StockItem {
  const normalized = { ...stock }

  normalized.transactions = (stock.transactions ?? []).map((tx) => ({
    ...tx,
    tags: tx.tags ?? [],
  }))

  // 批量设置默认值
  normalized.currentPrice ??= 0
  normalized.averageCost ??= 0
  normalized.totalInvestment ??= 0
  normalized.profitAndLoss ??= 0
  normalized.profitAndLossPercentage ??= 0
  normalized.currentQuantity ??= 0
  normalized.archived ??= false

  return normalized
}
