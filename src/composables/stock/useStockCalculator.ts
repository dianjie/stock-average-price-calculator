import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { computeStockStats, applyStatsToStock } from '@/utils/stockStats'
import { calculateSellingFee, resolveFeeSettings } from '@/utils/feeCalculator'
import { shareElementAsImage } from '@/utils/shareImage'
import { exportToFormat, mergeImportStocks, downloadTemplate } from '@/utils/dataIO'
import type { StockItem, Transaction, StockStats } from '@/utils/stockStats'
import type { FeeSettings } from '@/config/feeSettings'
import type { Ref } from 'vue'

interface UseStockCalculatorOptions {
  stocks: Ref<StockItem[]>
  feeSettings: Ref<FeeSettings>
  saveData: () => Promise<void>
  recalculateAllStocks: () => void
}

export function useStockCalculator({
  stocks,
  feeSettings,
  saveData,
  recalculateAllStocks,
}: UseStockCalculatorOptions) {
  // ==================== 基础状态 ====================
  const activeStockIndex = ref('0')
  const activeTabType = ref<'active' | 'archived'>('active')
  const editingIndex = ref(-1)

  // ==================== 对话框可见性 ====================
  const transactionDialogVisible = ref(false)
  const processingTransaction = ref(false)
  const breakEvenDialogVisible = ref(false)
  const dailyFeesDialogVisible = ref(false)
  const batchDeleteDialogVisible = ref(false)
  const deleteStockDialogVisible = ref(false)
  const feeSettingDialogVisible = ref(false)
  const stockFeeDialogVisible = ref(false)
  const stockFeeTarget = ref<StockItem | null>(null)
  const archiveConfirmVisible = ref(false)
  const unarchiveConfirmVisible = ref(false)
  const deleteTxConfirmVisible = ref(false)

  // ==================== 对话框目标引用 ====================
  const archiveTarget = ref<StockItem | null>(null)
  const deleteTxTarget = ref<Transaction | null>(null)
  const deleteTxIndex = ref(-1)
  const stockToDelete = ref<StockItem | null>(null)
  const selectedTransactions = ref<Transaction[]>([])

  // ==================== 导入导出 ====================
  const isExporting = ref(false)
  const isImporting = ref(false)

  // ==================== 保本价计算 ====================
  const breakEvenCalculation = ref({
    selectedCount: 0,
    data: {
      totalQuantity: 0,
      totalCost: 0,
      averageBuyPrice: 0,
      breakEvenPrice: 0,
      estimatedSellingFee: 0,
      originalAveragePrice: 0,
      newAveragePrice: 0,
      priceChangePercentage: 0,
    },
  })

  // ==================== Computed 派生状态 ====================
  const activeStocks = computed(() => stocks.value.filter((s) => !s.archived))
  const archivedStocks = computed(() => stocks.value.filter((s) => s.archived))
  const displayedStocks = computed(() =>
    activeTabType.value === 'active' ? activeStocks.value : archivedStocks.value,
  )

  const currentStock = computed(() => {
    const list = displayedStocks.value
    const idx = parseInt(activeStockIndex.value)
    return list[idx] ?? null
  })

  const stockUnit = computed(() => (currentStock.value?.type === '积存金' ? '克' : '股'))

  const currentStats = computed((): StockStats => {
    if (!currentStock.value)
      return {
        currentQuantity: 0,
        averageCost: 0,
        totalInvestment: 0,
        realizedProfit: 0,
        breakEvenPrice: 0,
        profitAndLoss: 0,
        profitAndLossPercentage: 0,
      }
    const resolved = resolveFeeSettings(feeSettings.value, currentStock.value.customFeeSettings)
    return computeStockStats(currentStock.value, undefined, resolved)
  })

  const totalFees = computed(() => {
    if (!currentStock.value?.transactions) return 0
    return currentStock.value.transactions.reduce((t, tx) => t + (tx.fee || 0), 0)
  })

  const avgSellPriceAfterFee = computed(() => {
    if (!currentStock.value?.transactions) return 0
    let qty = 0,
      amt = 0
    for (const tx of currentStock.value.transactions) {
      if (tx.type === '卖出') {
        qty += tx.quantity
        amt += tx.totalAmount || 0
      }
    }
    return qty > 0 ? amt / qty : 0
  })

  const dailyFees = computed(() => {
    if (!currentStock.value?.transactions) return []
    const map = new Map<string, { fee: number; sellQty: number; sellAmt: number }>()
    for (const tx of currentStock.value.transactions) {
      const d = map.get(tx.date) || { fee: 0, sellQty: 0, sellAmt: 0 }
      d.fee += tx.fee || 0
      if (tx.type === '卖出') {
        d.sellQty += tx.quantity
        d.sellAmt += tx.totalAmount || 0
      }
      map.set(tx.date, d)
    }
    return [...map.entries()]
      .map(([date, d]) => ({
        date,
        fee: d.fee,
        sellQty: d.sellQty || 0,
        sellAveragePrice: d.sellQty > 0 ? d.sellAmt / d.sellQty : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  const editTransactionData = computed(() => {
    if (!currentStock.value || editingIndex.value < 0) return null
    return currentStock.value.transactions[editingIndex.value] ?? null
  })

  // ==================== 核心操作 ====================
  async function recalc() {
    if (currentStock.value) {
      const stats = computeStockStats(currentStock.value)
      applyStatsToStock(currentStock.value, stats)
      await saveData()
    }
  }

  // ==================== 股票操作 ====================
  async function addStock(code: string, name: string, type: 'A股' | 'ETF' | '积存金') {
    if (stocks.value.some((s) => s.code === code)) {
      toast.warning(`该代码[${code}]已存在`)
      return
    }
    stocks.value.push({
      code,
      name,
      type: type as StockItem['type'],
      transactions: [],
      currentPrice: 0,
    })
    await saveData()
    activeTabType.value = 'active'
    activeStockIndex.value = String(activeStocks.value.length - 1)
    toast.success('添加成功')
  }

  function confirmArchive(stock: StockItem) {
    archiveTarget.value = stock
    archiveConfirmVisible.value = true
  }

  async function doArchive() {
    if (archiveTarget.value) {
      archiveTarget.value.archived = true
      await saveData()
      if (activeStocks.value.length === 0) {
        activeTabType.value = 'archived'
        activeStockIndex.value = '0'
      } else activeStockIndex.value = '0'
      toast.success('封存成功')
    }
    archiveConfirmVisible.value = false
  }

  function confirmUnarchive(stock: StockItem) {
    archiveTarget.value = stock
    unarchiveConfirmVisible.value = true
  }

  async function doUnarchive() {
    if (archiveTarget.value) {
      archiveTarget.value.archived = false
      await saveData()
      activeTabType.value = 'active'
      activeStockIndex.value = '0'
      toast.success('解冻成功')
    }
    unarchiveConfirmVisible.value = false
  }

  async function deleteStock() {
    if (!stockToDelete.value) return
    const idx = stocks.value.findIndex((s) => s.code === stockToDelete.value!.code)
    if (idx === -1) return
    stocks.value.splice(idx, 1)
    await saveData()
    if (displayedStocks.value.length > 0) activeStockIndex.value = '0'
    stockToDelete.value = null
    deleteStockDialogVisible.value = false
    toast.success('删除成功')
  }

  // ==================== 交易记录操作 ====================
  function openAddTransactionDialog() {
    if (!currentStock.value) return
    editingIndex.value = -1
    transactionDialogVisible.value = true
  }

  function editTransaction(index: number) {
    if (!currentStock.value) return
    editingIndex.value = index
    transactionDialogVisible.value = true
  }

  async function onTransactionSubmit(tx: Transaction) {
    if (!currentStock.value) return
    const stock = currentStock.value

    if (tx.type === '卖出') {
      let available = currentStats.value.currentQuantity
      if (editingIndex.value >= 0) {
        const old = stock.transactions[editingIndex.value]
        if (old.type === '买入') {
          available -= old.quantity
        } else {
          available += old.quantity
        }
      }
      if (tx.quantity > available) {
        toast.warning(`卖出数量不能超过当前持仓 ${available}`)
        return
      }
    }

    if (editingIndex.value >= 0) {
      stock.transactions[editingIndex.value] = tx
    } else {
      stock.transactions.push(tx)
    }

    stock.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    stock.transactions = [...stock.transactions]
    const wasEditing = editingIndex.value >= 0

    try {
      await recalc()
      transactionDialogVisible.value = false
      editingIndex.value = -1
      toast.success(wasEditing ? '修改交易记录成功' : '添加交易记录成功')
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
    }
  }

  function confirmDeleteTx(index: number) {
    if (!currentStock.value) return
    const tx = currentStock.value.transactions[index]
    deleteTxTarget.value = tx
    deleteTxIndex.value = index
    deleteTxConfirmVisible.value = true
  }

  async function doDeleteTx() {
    if (!currentStock.value || deleteTxIndex.value < 0) return
    const stock = currentStock.value
    const tx = stock.transactions[deleteTxIndex.value]

    if (tx?.type === '买入' && currentStats.value.currentQuantity < tx.quantity) {
      toast.warning('删除该买入记录会导致持仓为负，请先删除相关的卖出记录')
      deleteTxConfirmVisible.value = false
      return
    }

    stock.transactions.splice(deleteTxIndex.value, 1)
    stock.transactions = [...stock.transactions]
    if (stock.transactions.length === 0) {
      stock.currentPrice = 0
    }
    try {
      await recalc()
      deleteTxConfirmVisible.value = false
      toast.success('删除交易记录成功')
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
    }
  }

  async function batchDeleteTransactions() {
    if (!currentStock.value || selectedTransactions.value.length === 0) return

    let buyQty = 0,
      sellQty = 0
    for (const tx of selectedTransactions.value) {
      if (tx.type === '买入') buyQty += tx.quantity
      else sellQty += tx.quantity
    }
    if (currentStats.value.currentQuantity < buyQty - sellQty) {
      toast.warning('删除这些交易记录会导致持仓为负')
      batchDeleteDialogVisible.value = false
      return
    }

    const toRemove = new Set(selectedTransactions.value)
    currentStock.value.transactions = currentStock.value.transactions.filter(
      (t) => !toRemove.has(t),
    )

    if (currentStock.value.transactions.length === 0) {
      currentStock.value.currentPrice = 0
    }
    selectedTransactions.value = []
    try {
      await recalc()
      batchDeleteDialogVisible.value = false
      toast.success('成功删除交易记录')
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
    }
  }

  // ==================== 保本价计算 ====================
  function calcBreakEven() {
    if (selectedTransactions.value.length === 0 || !currentStock.value) return

    let qty = 0,
      cost = 0
    for (const tx of selectedTransactions.value) {
      if (tx.type === '买入') {
        qty += tx.quantity
        cost += tx.totalAmount || 0
      } else {
        qty -= tx.quantity
        cost -= tx.totalAmount || 0
      }
    }

    if (qty <= 0.00001) {
      toast.warning('选中记录的净持仓数量必须大于0')
      return
    }

    const avgBuy = cost / qty
    const effectiveFee = resolveFeeSettings(feeSettings.value, currentStock.value.customFeeSettings)
    const estFee = calculateSellingFee(
      qty,
      avgBuy,
      currentStock.value.type,
      currentStock.value.code,
      effectiveFee,
    )
    const breakEven = Math.max(0, (cost + estFee) / qty)

    const origAvg = currentStats.value.averageCost
    const newCost = currentStats.value.totalInvestment - cost
    const newQty = currentStats.value.currentQuantity - qty
    const newAvg = newQty > 0 ? newCost / newQty : 0
    const pctChg = origAvg > 0 && newAvg > 0 ? ((newAvg - origAvg) / origAvg) * 100 : 0

    breakEvenCalculation.value = {
      selectedCount: selectedTransactions.value.length,
      data: {
        totalQuantity: qty,
        totalCost: cost,
        averageBuyPrice: avgBuy,
        breakEvenPrice: breakEven,
        estimatedSellingFee: estFee,
        originalAveragePrice: origAvg,
        newAveragePrice: newAvg,
        priceChangePercentage: pctChg,
      },
    }
    breakEvenDialogVisible.value = true
  }

  // ==================== 导入导出 ====================
  type ExportFormat = 'json' | 'csv' | 'xlsx'

  async function exportData(format: ExportFormat = 'json') {
    try {
      isExporting.value = true
      const ok = await exportToFormat(stocks.value, format)
      if (ok) toast.success('数据导出成功')
    } finally {
      isExporting.value = false
    }
  }

  async function importData(incoming: StockItem[], overwrite: boolean) {
    try {
      isImporting.value = true
      mergeImportStocks(stocks.value, incoming, overwrite)
      recalculateAllStocks()
      activeStockIndex.value = '0'
      await saveData()
      const mergedText = overwrite ? '已覆盖' : '已'
      toast.success(`${mergedText}导入 ${incoming.length} 只股票数据`)
    } catch (error: unknown) {
      const err = error as Error
      toast.error('导入失败：' + (err.message || '未知错误'))
    } finally {
      isImporting.value = false
    }
  }

  // ==================== 截图分享 ====================
  async function shareAsImage() {
    await shareElementAsImage(
      '.share-container',
      `${currentStock.value?.name ?? ''} (${currentStock.value?.code ?? ''}) 交易报告`,
      `${currentStock.value?.name ?? 'stock'}_交易报告`,
      (clonedDoc, container) => {
        const tableContainer = container.querySelector(
          '[data-slot="table-container"]',
        ) as HTMLElement
        tableContainer.style.maxHeight = 'none'
        const selectItems = container.querySelector('[data-slot="table-selects"]') as HTMLElement
        selectItems.style.display = 'none'

        const currentPriceInput = container.querySelector(
          'input[data-slot="input"]',
        ) as HTMLInputElement
        currentPriceInput.style.display = 'none'
        const spanPrice = clonedDoc.createElement('span')
        spanPrice.className = 'text-right font-semibold tabular-nums'
        spanPrice.textContent = currentPriceInput.value
        currentPriceInput?.parentNode?.insertBefore(spanPrice, currentPriceInput.nextSibling)
      },
    )
  }

  // ==================== 切换股票时清除选中 ====================
  watch(currentStock, () => {
    selectedTransactions.value = []
  })

  return {
    activeStockIndex,
    activeTabType,
    editingIndex,
    transactionDialogVisible,
    processingTransaction,
    breakEvenDialogVisible,
    dailyFeesDialogVisible,
    batchDeleteDialogVisible,
    deleteStockDialogVisible,
    feeSettingDialogVisible,
    stockFeeDialogVisible,
    stockFeeTarget,
    archiveConfirmVisible,
    unarchiveConfirmVisible,
    deleteTxConfirmVisible,
    archiveTarget,
    deleteTxTarget,
    deleteTxIndex,
    stockToDelete,
    selectedTransactions,
    isExporting,
    isImporting,
    breakEvenCalculation,
    activeStocks,
    archivedStocks,
    displayedStocks,
    currentStock,
    stockUnit,
    currentStats,
    totalFees,
    avgSellPriceAfterFee,
    dailyFees,
    editTransactionData,
    recalc,
    addStock,
    confirmArchive,
    doArchive,
    confirmUnarchive,
    doUnarchive,
    deleteStock,
    openAddTransactionDialog,
    editTransaction,
    onTransactionSubmit,
    confirmDeleteTx,
    doDeleteTx,
    batchDeleteTransactions,
    calcBreakEven,
    exportData,
    downloadTemplate,
    importData,
    shareAsImage,
  }
}
