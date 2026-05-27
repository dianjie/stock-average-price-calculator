<template>
  <div class="bg-card text-card-foreground mx-auto max-w-5xl rounded-xl border p-6 shadow-sm">
    <div class="mb-6 flex flex-wrap justify-center gap-2">
      <Button variant="default" size="sm" @click="feeSettingDialogVisible = true">费率设置</Button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" :disabled="isExporting">
            <Loader2Icon v-if="isExporting" class="size-4 animate-spin" />
            {{ isExporting ? '导出中...' : '导出数据' }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @click="exportData()"> JSON (.json) </DropdownMenuItem>
          <DropdownMenuItem @click="exportData('csv')"> CSV (.csv) </DropdownMenuItem>
          <DropdownMenuItem @click="exportData('xlsx')"> Excel (.xlsx) </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="destructive"
        size="sm"
        :disabled="isImporting"
        @click="importDialogVisible = true"
      >
        <Loader2Icon v-if="isImporting" class="size-4 animate-spin" />
        {{ isImporting ? '导入中...' : '导入数据' }}
      </Button>
    </div>

    <StockSelector @add="addStock" />

    <div v-if="stocks.length > 0" class="space-y-4">
      <StockTabs
        :active="activeTabType"
        :stock-index="activeStockIndex"
        :current-stocks="displayedStocks"
        :active-count="activeStocks.length"
        :archived-count="archivedStocks.length"
        @update:active="
          (v: 'active' | 'archived') => {
            activeTabType = v
            activeStockIndex = '0'
          }
        "
        @update:stock-index="(v: string) => (activeStockIndex = v)"
        @archive="confirmArchive"
        @unarchive="confirmUnarchive"
        @delete="((stockToDelete = $event), (deleteStockDialogVisible = true))"
        @edit-fee="openStockFeeDialog"
      />

      <template v-if="currentStock">
        <div v-if="!currentStock.archived" class="space-y-4">
          <TransactionTable
            :transactions="currentStock.transactions"
            :selected-transactions="selectedTransactions"
            :unit="stockUnit"
            @update:selected-transactions="(v: Transaction[]) => (selectedTransactions = v)"
            @share="shareAsImage"
            @add-transaction="openAddTransactionDialog"
            @calc-break-even="calcBreakEven"
            @batch-delete="selectedTransactions.length > 0 && (batchDeleteDialogVisible = true)"
            @edit-transaction="editTransaction"
            @delete-transaction="confirmDeleteTx"
          >
            <PositionSummary
              v-if="currentStock.transactions.length > 0"
              :stats="currentStats"
              :total-fees="totalFees"
              :unit="stockUnit"
              :stock-type="currentStock.type"
              :model-value="currentStock.currentPrice ?? 0"
              @update:model-value="
                (v: number) => {
                  if (currentStock) currentStock.currentPrice = v
                  recalc()
                }
              "
              @show-daily-fees="dailyFeesDialogVisible = true"
            />
          </TransactionTable>

          <GoldPriceConverter
            v-if="currentStock.type === '积存金'"
            @apply="
              (v) => {
                if (currentStock) currentStock.currentPrice = v
                recalc()
              }
            "
          />

          <div class="space-y-4 pt-2">
            <div class="text-base font-semibold">复盘图表</div>
            <TradingCalendar v-if="hasTransactions" :data="calendarData" />
            <TradingStepChart v-if="hasTransactions" :data="stepData" />
            <PositionChart
              v-if="hasTransactions"
              :data="positionData"
              :transactions="currentStock.transactions"
            />
          </div>
        </div>

        <ArchivedStockInfo v-else :stock="currentStock" />
      </template>
    </div>

    <div v-else class="flex justify-center py-8">
      <p class="text-muted-foreground text-sm">暂无数据，请添加</p>
    </div>

    <AddTransactionDialog
      :open="transactionDialogVisible"
      :editing="editingIndex >= 0"
      :stock="currentStock"
      :fee-settings="effectiveFeeSettings"
      :loading="processingTransaction"
      :current-position="currentStats.currentQuantity"
      :initial-data="editTransactionData"
      @update:open="transactionDialogVisible = $event"
      @submit="onTransactionSubmit"
    />

    <FeeSettingsDialog
      :open="feeSettingDialogVisible"
      :fee-settings="feeSettings"
      @update:open="feeSettingDialogVisible = $event"
      @save="onFeeSettingsSave"
    />

    <FeeSettingsDialog
      v-if="stockFeeTarget"
      :open="stockFeeDialogVisible"
      mode="stock"
      :stock-name="stockFeeTarget.name"
      :fee-settings="stockFeeTarget.customFeeSettings ?? feeSettings"
      :global-fee-settings="feeSettings"
      :has-custom-fee="!!stockFeeTarget.customFeeSettings"
      @update:open="stockFeeDialogVisible = $event"
      @save="(s) => stockFeeTarget && onStockFeeSettingsSave(stockFeeTarget, s)"
    />

    <BreakEvenDialog
      :open="breakEvenDialogVisible"
      :selected-count="breakEvenCalculation.selectedCount"
      :unit="stockUnit"
      :data="breakEvenCalculation.data"
      @update:open="breakEvenDialogVisible = $event"
    />

    <DailyFeesDialog
      :open="dailyFeesDialogVisible"
      :total-fees="totalFees"
      :avg-sell-price="avgSellPriceAfterFee"
      :daily-fees="dailyFees"
      @update:open="dailyFeesDialogVisible = $event"
    />

    <!-- 批量删除 -->
    <ConfirmDialog
      v-model:open="batchDeleteDialogVisible"
      title="批量删除"
      :description="`确定要删除选中的 ${selectedTransactions.length} 条交易记录吗？`"
      confirm-variant="destructive"
      @confirm="batchDeleteTransactions"
    />

    <!-- 删除单条数据 -->
    <ConfirmDialog
      v-model:open="deleteTxConfirmVisible"
      title="确认删除"
      :description="`确定要删除这条${deleteTxTarget?.type === '买入' ? '买入' : '卖出'}记录吗？`"
      confirm-variant="destructive"
      @confirm="doDeleteTx"
    />

    <!-- 删除单组数据 -->
    <ConfirmDialog
      v-model:open="deleteStockDialogVisible"
      title="删除数据"
      :description="`确定要删除 ${stockToDelete?.name ?? ''} (${stockToDelete?.code ?? ''}) 吗？`"
      confirm-variant="destructive"
      @confirm="deleteStock"
    />

    <!-- 封存 -->
    <ConfirmDialog
      v-model:open="archiveConfirmVisible"
      title="封存确认"
      :description="`确定要封存 ${archiveTarget?.name} 吗？封存后需要解冻才能重新显示。`"
      @confirm="doArchive"
    />

    <!-- 解冻 -->
    <ConfirmDialog
      v-model:open="unarchiveConfirmVisible"
      title="解冻确认"
      :description="`确定要解冻 ${archiveTarget?.name} 吗？`"
      @confirm="doUnarchive"
    />

    <ImportDialog
      :open="importDialogVisible"
      :stocks="stocks"
      @update:open="importDialogVisible = $event"
      @import="onImportData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Loader2Icon } from 'lucide-vue-next'
import { onAuthStateChange } from '@/firebase/auth'
import { useStockData } from '@/composables/useStockData'
import { useFeeSettings } from '@/composables/useFeeSettings'
import { useStockCalculator } from '@/composables/stock/useStockCalculator'
import { useReviewDashboard } from '@/composables/review/useReviewDashboard'
import {
  computeStockStats,
  applyStatsToStock,
  type Transaction,
  type StockItem,
} from '@/utils/stockStats'
import { calculateTransactionFee, getMarketType, resolveFeeSettings } from '@/utils/feeCalculator'
import type { FeeSettings } from '@/config/feeSettings'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import StockSelector from './StockSelector.vue'
import StockTabs from './StockTabs.vue'
import TransactionTable from './TransactionTable.vue'
import PositionSummary from './PositionSummary.vue'
import ArchivedStockInfo from './ArchivedStockInfo.vue'
import AddTransactionDialog from './dialogs/AddTransactionDialog.vue'
import FeeSettingsDialog from './dialogs/FeeSettingsDialog.vue'
import BreakEvenDialog from './dialogs/BreakEvenDialog.vue'
import DailyFeesDialog from './dialogs/DailyFeesDialog.vue'
import ConfirmDialog from './dialogs/ConfirmDialog.vue'
import ImportDialog from './dialogs/ImportDialog.vue'
import TradingCalendar from '@/components/review/TradingCalendar.vue'
import TradingStepChart from '@/components/review/TradingStepChart.vue'
import PositionChart from '@/components/review/PositionChart.vue'
import GoldPriceConverter from './GoldPriceConverter.vue'

const { stocks, currentUser, setUser, loadData, saveData, recalculateAllStocks } = useStockData()
const { feeSettings, loadFeeSettings, saveFeeSettings } = useFeeSettings()

const calc = useStockCalculator({ stocks, feeSettings, saveData, recalculateAllStocks })

const importDialogVisible = ref(false)

const {
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
  importData,
  shareAsImage,
} = calc

const hasTransactions = computed(() => activeStocks.value.some((s) => s.transactions.length > 0))

const effectiveFeeSettings = computed(() =>
  resolveFeeSettings(feeSettings.value, currentStock.value?.customFeeSettings),
)

const { calendarData, stepData, positionData } = useReviewDashboard(currentStock)

function onFeeSettingsSave(settings: FeeSettings | null) {
  if (!settings) return
  feeSettings.value = settings
  saveFeeSettings(settings, currentUser.value)
  recalculateAllFees()
  feeSettingDialogVisible.value = false
}

function openStockFeeDialog(stock: StockItem) {
  stockFeeTarget.value = stock
  stockFeeDialogVisible.value = true
}

function onStockFeeSettingsSave(stock: StockItem, settings: FeeSettings | null) {
  if (settings === null) {
    delete stock.customFeeSettings
  } else {
    stock.customFeeSettings = { ...settings }
  }
  recalculateAllFees()
  saveData()
  stockFeeDialogVisible.value = false
}

function recalculateAllFees() {
  for (const stock of stocks.value) {
    const mkt = getMarketType(stock.code)
    const effectiveFee = resolveFeeSettings(feeSettings.value, stock.customFeeSettings)
    for (const tx of stock.transactions) {
      const fee = calculateTransactionFee(
        tx.type,
        tx.price,
        tx.quantity,
        stock.type,
        mkt,
        effectiveFee,
      )
      tx.fee = fee
      tx.totalAmount =
        tx.type === '买入' ? tx.price * tx.quantity + fee : tx.price * tx.quantity - fee
    }
    const stats = computeStockStats(stock, undefined, effectiveFee)
    applyStatsToStock(stock, stats)
  }
  saveData()
}

async function onImportData(incoming: StockItem[], overwrite: boolean) {
  await importData(incoming, overwrite)
  importDialogVisible.value = false
}

onMounted(() => {
  const unsub = onAuthStateChange(async (user: { uid: string } | null) => {
    setUser(user)
    await loadFeeSettings(user)
    await loadData()
    recalculateAllStocks()
  })
  return () => unsub?.()
})
</script>
