<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>计算选中盈亏</DialogTitle>
        <DialogDescription>
          基于已选记录，输入当前价试算浮动盈亏（移动加权平均成本法）
        </DialogDescription>
      </DialogHeader>

      <!-- 起始日期：自己选，可清除 -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-muted-foreground text-sm">起始日期</span>
        <Input v-model="afterDate" type="date" class="h-9 w-auto" />
        <Button
          variant="ghost"
          size="sm"
          class="h-9 px-2"
          :disabled="!afterDate"
          @click="afterDate = ''"
        >
          清除
        </Button>
      </div>

      <div class="text-muted-foreground text-xs">
        已选 {{ transactions.length }} 条，参与计算
        <span class="text-foreground font-medium">{{ working.length }}</span> 条
        <template v-if="afterDate">（{{ afterDate }} 起）</template>
      </div>

      <!-- 无记录 -->
      <div v-if="!transactions.length" class="text-muted-foreground py-6 text-center text-sm">
        请先勾选交易记录。
      </div>

      <template v-else>
        <!-- 参与计算明细：日期粗筛后可逐条排除 -->
        <div class="rounded-md border">
          <div class="flex items-center justify-between px-3 py-2">
            <span class="text-muted-foreground text-xs">参与计算明细</span>
            <div class="flex gap-1">
              <Button variant="ghost" size="sm" class="h-7 px-2 text-xs" @click="includeAll">
                全选
              </Button>
              <Button variant="ghost" size="sm" class="h-7 px-2 text-xs" @click="excludeAll">
                全不选
              </Button>
            </div>
          </div>
          <div class="max-h-40 divide-y overflow-y-auto">
            <div
              v-for="(tx, i) in dated"
              :key="i"
              class="hover:bg-muted/40 flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs"
              @click="toggle(tx)"
            >
              <Checkbox :model-value="!isExcluded(tx)" @update:model-value="toggle(tx)" />
              <span
                class="w-9 shrink-0 text-center font-medium"
                :class="tx.type === '买入' ? 'text-red-500' : 'text-green-600'"
              >
                {{ tx.type }}
              </span>
              <span class="text-muted-foreground shrink-0 tabular-nums">{{ tx.date }}</span>
              <span class="ml-auto shrink-0 tabular-nums">
                {{ fmt(tx.price, 3) }} × {{ fmtQty(tx.quantity) }}
              </span>
            </div>
            <div v-if="!dated.length" class="text-muted-foreground px-3 py-4 text-center text-xs">
              该日期区间内没有已选记录，换个日期试试。
            </div>
          </div>
        </div>

        <!-- 现价输入 -->
        <div class="flex flex-wrap items-center gap-2">
          <label class="text-muted-foreground text-sm">当前价格</label>
          <Input
            v-model.number="calcPrice"
            type="number"
            :step="0.001"
            :min="0"
            placeholder="输入当前价"
            class="h-9 w-36"
          />
          <span class="text-muted-foreground text-xs">{{ unit }}</span>
          <Button
            v-if="calcPrice != null"
            variant="ghost"
            size="sm"
            class="h-8 px-2"
            @click="calcPrice = undefined"
          >
            清空
          </Button>
        </div>

        <!-- 有持仓 -->
        <template v-if="holdings.quantity > 0">
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="bg-muted/40 rounded-md p-2">
              <div class="text-muted-foreground text-xs">持仓数量</div>
              <div class="font-medium">{{ fmtQty(holdings.quantity) }}</div>
            </div>
            <div class="bg-muted/40 rounded-md p-2">
              <div class="text-muted-foreground text-xs">持仓均价</div>
              <div class="font-medium">{{ fmt(holdings.avgCost, 4) }} {{ unit }}</div>
            </div>
            <div class="bg-muted/40 rounded-md p-2">
              <div class="text-muted-foreground text-xs">持仓成本</div>
              <div class="font-medium">{{ fmt(holdings.costBasis) }}</div>
            </div>
            <div class="bg-muted/40 rounded-md p-2">
              <div class="text-muted-foreground text-xs">当前市值</div>
              <div class="font-medium">{{
                calcPrice != null ? fmt(holdings.marketValue) : '—'
              }}</div>
            </div>
          </div>

          <div
            v-if="calcPrice != null"
            class="space-y-2 rounded-md p-3 text-sm"
            :class="plClass(holdings.unrealized)"
          >
            <div class="flex items-center justify-between">
              <span>浮动盈亏</span>
              <span class="text-base font-semibold">{{ signed(holdings.unrealized) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>盈亏比例</span>
              <span class="font-semibold">{{ signed(holdings.unrealizedPct, '%') }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>已实现盈亏</span>
              <span :class="plClass(holdings.realized)">{{ signed(holdings.realized) }}</span>
            </div>
            <div class="flex items-center justify-between border-t pt-2">
              <span>合计盈亏</span>
              <span class="text-base font-semibold">{{ signed(holdings.totalPL) }}</span>
            </div>
          </div>
          <p v-else class="text-muted-foreground text-xs">输入当前价格后计算浮动盈亏。</p>
        </template>

        <!-- 已清仓 -->
        <template v-else>
          <div class="bg-muted/40 rounded-md p-3 text-sm">
            该区间对应持仓为 <span class="font-medium">0</span>（已清仓），已实现盈亏：
            <span class="font-semibold" :class="plClass(holdings.realized)">
              {{ signed(holdings.realized) }}
            </span>
          </div>
        </template>
      </template>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { StockItem, Transaction } from '@/utils/stockStats'
import type { FeeSettings } from '@/config/feeSettings'
import { calculateSellingFee } from '@/utils/feeCalculator'

const props = defineProps<{
  open: boolean
  stock: StockItem | null // 可能为空（初始化中）
  feeSettings: FeeSettings
}>()

defineEmits<{ 'update:open': [value: boolean] }>()

/* 从 stock 里挑字段，做好空值兜底 */
const transactions = computed<Transaction[]>(() => props.stock?.transactions ?? [])
const unit = computed(() => (props.stock?.type === '积存金' ? '元/克' : '元'))
const stockType = computed(() => props.stock?.type ?? 'A股')

/* 起始日期：仅一个输入框，选了筛 >= 该日期（粗筛） */
const afterDate = ref<string>('')

/** 日期粗筛结果（升序），供明细列表展示 */
const dated = computed(() => {
  const base = afterDate.value
    ? transactions.value.filter((t) => t.date >= afterDate.value)
    : [...transactions.value]
  return base.sort((a, b) => a.date.localeCompare(b.date))
})

/* ===== 逐条排除：用对象引用记录，引用稳定、不怕重排 ===== */
const excluded = ref<Set<Transaction>>(new Set())

function isExcluded(tx: Transaction): boolean {
  return excluded.value.has(tx)
}
function toggle(tx: Transaction) {
  const s = new Set(excluded.value)
  if (s.has(tx)) s.delete(tx)
  else s.add(tx)
  excluded.value = s
}
function includeAll() {
  excluded.value = new Set()
}
function excludeAll() {
  excluded.value = new Set(dated.value)
}

/** 最终参与计算：日期粗筛 ∩ 未被排除 */
const working = computed(() => dated.value.filter((t) => !excluded.value.has(t)))

const calcPrice = ref<number>()

// 每次打开重置：现价、日期、排除集全清
watch(
  () => props.open,
  (o) => {
    if (o) {
      calcPrice.value = undefined
      afterDate.value = ''
      excluded.value = new Set()
    }
  },
)

interface HoldingResult {
  quantity: number
  avgCost: number
  costBasis: number
  realized: number
  marketValue: number
  sellFee: number
  unrealized: number
  unrealizedPct: number
  totalPL: number
}

const holdings = computed<HoldingResult>(() => {
  let totalBuyCost = 0
  let totalSellReceived = 0
  let buyShares = 0
  let sellShares = 0
  for (const tx of working.value) {
    if (tx.type === '买入') {
      totalBuyCost += tx.totalAmount ?? tx.price * tx.quantity + (tx.fee ?? 0)
      buyShares += tx.quantity
    } else {
      totalSellReceived += tx.totalAmount ?? tx.price * tx.quantity - (tx.fee ?? 0)
      sellShares += tx.quantity
    }
  }

  const remaining = buyShares - sellShares
  // 摊薄成本口径：持仓成本 = 总买入 − 总卖出（净投入）；成本价(持仓均价) = 净投入 ÷ 剩余股数
  const costBasis = totalBuyCost - totalSellReceived
  const avgCost = remaining > 0 ? costBasis / remaining : 0

  const price = calcPrice.value
  // 预估「按现价清仓 remaining 股」要交的卖出手续费
  const sellFee =
    price != null && price > 0 && remaining > 0
      ? calculateSellingFee(
          remaining,
          price,
          stockType.value,
          props.stock?.code || '',
          props.feeSettings,
        )
      : 0

  const r: HoldingResult = {
    quantity: remaining,
    avgCost,
    costBasis,
    realized: 0,
    marketValue: 0,
    sellFee,
    unrealized: 0,
    unrealizedPct: 0,
    totalPL: 0,
  }

  if (price != null && price > 0 && remaining > 0) {
    r.marketValue = price * remaining
    // 浮动盈亏 = 市值 − 持仓成本 − 卖出手续费（按现价清仓真正能落袋的）
    r.unrealized = r.marketValue - costBasis - sellFee
    r.unrealizedPct = costBasis > 0 ? (r.unrealized / costBasis) * 100 : 0
    // 总盈亏 = 市值 − 卖出手续费 + 累计卖出收回 − 累计买入花费
    r.totalPL = r.marketValue - sellFee + totalSellReceived - totalBuyCost
    // 已实现 = 总盈亏 − 浮动（保证 已实现 + 浮动 = 总盈亏，三者自洽）
    r.realized = r.totalPL - r.unrealized
  } else if (remaining <= 0) {
    // 已清仓 / 无持仓：全部落为已实现
    r.totalPL = totalSellReceived - totalBuyCost
    r.realized = r.totalPL
  }
  return r
})

function fmt(n: number, digits = 2): string {
  if (!isFinite(n)) n = 0
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function fmtQty(n: number): string {
  if (!isFinite(n)) n = 0
  if (Number.isInteger(n)) return String(n)
  return String(parseFloat(n.toFixed(4)))
}

function signed(n: number, suffix = ''): string {
  const sign = n > 0 ? '+' : n < 0 ? '-' : ''
  return `${sign}${fmt(Math.abs(n), 2)}${suffix}`
}

function plClass(n: number): string {
  if (n > 0) return 'text-red-500'
  if (n < 0) return 'text-green-600'
  return 'text-muted-foreground'
}
</script>
