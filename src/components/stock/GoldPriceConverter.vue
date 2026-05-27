<template>
  <div class="space-y-3 rounded-lg border p-4 sm:p-5">
    <h3 class="text-base font-semibold">金价换算</h3>
    <p class="text-muted-foreground text-xs">
      1 金衡盎司 = 31.1035 克<br />
      元/克 = 美元/盎司 × 汇率 ÷ 31.1035
    </p>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <!-- 国际金价转换 -->
      <div class="space-y-2 rounded-md border p-3">
        <div class="flex items-center justify-between">
          <label class="text-muted-foreground text-xs">国际金价 (美元/盎司)</label>
          <FetchButton
            :loading="fetchingGold"
            :cooldown="goldFetchCooldown"
            btn-text="获取行情"
            @fetch="fetchGoldPrice"
          />
        </div>
        <Input
          type="number"
          :model-value="intlPrice"
          :step="0.01"
          :min="0"
          placeholder="如 2650"
          @update:model-value="updateIntlPrice"
        />

        <div class="flex items-center justify-between">
          <label class="text-muted-foreground text-xs">汇率 (美元兑人民币)</label>
          <FetchButton
            :loading="fetchingRate"
            :cooldown="rateFetchCooldown"
            btn-text="获取汇率"
            @fetch="fetchExchangeRate"
          />
        </div>
        <Input
          type="number"
          :model-value="exchangeRate"
          :step="0.0001"
          :min="0"
          placeholder="如 7.25"
          @update:model-value="updateExchangeRate"
        />

        <div class="flex items-center justify-between pt-1">
          <span class="text-muted-foreground text-xs">换算结果 (元/克)</span>
          <span class="text-primary text-base font-bold tabular-nums">
            {{ domesticPrice > 0 ? domesticPrice.toFixed(3) : '—' }}
          </span>
        </div>

        <Button
          variant="default"
          size="sm"
          class="w-full"
          :disabled="domesticPrice <= 0"
          @click="applyDomesticPrice"
        >
          应用为当前价格
        </Button>
      </div>

      <!-- 国内金价转换 -->
      <div class="space-y-2 rounded-md border p-3">
        <label class="text-muted-foreground text-xs">国内金价 (元/克)</label>
        <Input
          type="number"
          :model-value="domesticInput"
          :step="0.01"
          :min="0"
          placeholder="如 620"
          @update:model-value="updateDomesticInput"
        />

        <div class="flex items-center justify-between">
          <label class="text-muted-foreground text-xs">汇率 (美元兑人民币)</label>
          <FetchButton
            :loading="fetchingRate"
            :cooldown="rateFetchCooldown"
            btn-text="获取汇率"
            @fetch="fetchExchangeRate"
          />
        </div>
        <Input
          type="number"
          :model-value="exchangeRateRev"
          :step="0.0001"
          :min="0"
          placeholder="如 7.25"
          @update:model-value="updateExchangeRateRev"
        />

        <div class="flex items-center justify-between pt-1">
          <span class="text-muted-foreground text-xs">换算结果 (美元/盎司)</span>
          <span class="text-primary text-base font-bold tabular-nums">
            {{ intlPriceRev > 0 ? intlPriceRev.toFixed(2) : '—' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, type Ref } from 'vue'
import { toast } from 'vue-sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import FetchButton from './FetchButton.vue' // 引入独立组件

// 常量定义
const OZ_TO_GRAM = 31.1035
const COOLDOWN_SECONDS = 60
const GOLD_API_URL = 'https://api.gold-api.com/price/XAU/USD'
const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/CNY'
const GOLD_STORAGE_KEY = 'gold_fetched_price'
const RATE_STORAGE_KEY = 'gold_fetched_rate'

// 响应式状态
const intlPrice = ref(0)
const exchangeRate = ref(7.25)
const domesticInput = ref(0)
const exchangeRateRev = ref(7.25)

// 计算属性
const domesticPrice = computed(() => {
  if (intlPrice.value <= 0 || exchangeRate.value <= 0) return 0
  return (intlPrice.value * exchangeRate.value) / OZ_TO_GRAM
})

const intlPriceRev = computed(() => {
  if (domesticInput.value <= 0 || exchangeRateRev.value <= 0) return 0
  return (domesticInput.value * OZ_TO_GRAM) / exchangeRateRev.value
})

// API调用状态
const fetchingGold = ref(false)
const fetchingRate = ref(false)

// 冷却计时器状态
const goldFetchCooldown = ref(0)
const rateFetchCooldown = ref(0)
const goldTimer: ReturnType<typeof setInterval> | null = null
const rateTimer: ReturnType<typeof setInterval> | null = null

// 事件发射器
const emit = defineEmits<{
  apply: [price: number]
}>()

// 方法定义
function applyDomesticPrice() {
  if (domesticPrice.value > 0) {
    emit('apply', domesticPrice.value)
  }
}

// 输入值更新方法
function updateIntlPrice(value: string | number) {
  intlPrice.value = Number(value) || 0
}

function updateExchangeRate(value: string | number) {
  exchangeRate.value = Number(value) || 0
}

function updateDomesticInput(value: string | number) {
  domesticInput.value = Number(value) || 0
}

function updateExchangeRateRev(value: string | number) {
  exchangeRateRev.value = Number(value) || 0
}

// 通用冷却计时器管理
function startCooldown(
  cooldownRef: Ref<number>,
  timerRef: { value: ReturnType<typeof setInterval> | null },
  duration: number = COOLDOWN_SECONDS,
) {
  cooldownRef.value = duration
  clearTimer(timerRef)

  timerRef.value = setInterval(() => {
    cooldownRef.value--
    if (cooldownRef.value <= 0) {
      clearTimer(timerRef)
    }
  }, 1000)
}

function clearTimer(timerRef: { value: ReturnType<typeof setInterval> | null }) {
  if (timerRef.value !== null) {
    clearInterval(timerRef.value)
    timerRef.value = null
  }
}

// 数据持久化
function persistValue(key: string, value: number) {
  const payload = { value, ts: Date.now() }
  localStorage.setItem(key, JSON.stringify(payload))
}

function restoreValue(key: string): { value: number; remainingCooldown: number } | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null

  try {
    const parsed: { value: number; ts: number } = JSON.parse(raw)
    if (typeof parsed.value !== 'number' || typeof parsed.ts !== 'number') return null

    const elapsed = (Date.now() - parsed.ts) / 1000
    const remaining = Math.max(0, Math.ceil(COOLDOWN_SECONDS - elapsed))
    return { value: parsed.value, remainingCooldown: remaining }
  } catch {
    return null
  }
}

// API 调用函数
async function fetchGoldPrice() {
  if (goldFetchCooldown.value > 0 || fetchingGold.value) return

  fetchingGold.value = true
  try {
    const response = await fetch(GOLD_API_URL)
    if (!response.ok) {
      throw new Error(`金价API请求失败: ${response.status} ${response.statusText}`)
    }

    const data: { price: number } = await response.json()
    if (typeof data.price === 'number' && data.price > 0) {
      intlPrice.value = Math.round(data.price * 100) / 100
      persistValue(GOLD_STORAGE_KEY, intlPrice.value)
      toast.success('已更新伦敦金实时价格')
    } else {
      toast.error('获取金价失败：数据格式异常')
    }
  } catch (error) {
    console.error('获取金价错误:', error)
    toast.error('获取伦敦金价格失败，请稍后重试')
  } finally {
    fetchingGold.value = false
    startCooldown(goldFetchCooldown, { value: goldTimer })
  }
}

async function fetchExchangeRate() {
  if (rateFetchCooldown.value > 0 || fetchingRate.value) return

  fetchingRate.value = true
  try {
    const response = await fetch(EXCHANGE_RATE_API_URL)
    if (!response.ok) {
      throw new Error(`汇率API请求失败: ${response.status} ${response.statusText}`)
    }

    const data: { rates: { USD: number } } = await response.json()
    const usdPerCny = data.rates.USD

    if (typeof usdPerCny === 'number' && usdPerCny > 0) {
      const rate = Math.round((1 / usdPerCny) * 10000) / 10000
      exchangeRate.value = rate
      if (exchangeRateRev.value <= 0) {
        exchangeRateRev.value = rate
      }
      persistValue(RATE_STORAGE_KEY, rate)
      toast.success(`已更新汇率：1 美元 = ${rate} 人民币`)
    } else {
      toast.error('获取汇率失败：数据格式异常')
    }
  } catch (error) {
    console.error('获取汇率错误:', error)
    toast.error('获取汇率失败，请稍后重试')
  } finally {
    fetchingRate.value = false
    startCooldown(rateFetchCooldown, { value: rateTimer })
  }
}

// 监听器 - 自动同步计算结果
watch(domesticPrice, (val) => {
  if (val > 0) {
    domesticInput.value = Math.round(val * 100) / 100
  }
})

watch(domesticInput, (val) => {
  if (val > 0 && exchangeRateRev.value > 0) {
    // 更新反向计算的汇率
    exchangeRateRev.value = exchangeRate.value
  }
})

// 组件挂载和卸载
onMounted(() => {
  // 恢复存储的数据
  const goldData = restoreValue(GOLD_STORAGE_KEY)
  if (goldData) {
    intlPrice.value = goldData.value
    if (goldData.remainingCooldown > 0) {
      startCooldown(goldFetchCooldown, { value: goldTimer }, goldData.remainingCooldown)
    }
  }

  const rateData = restoreValue(RATE_STORAGE_KEY)
  if (rateData) {
    exchangeRate.value = rateData.value
    exchangeRateRev.value = rateData.value
    if (rateData.remainingCooldown > 0) {
      startCooldown(rateFetchCooldown, { value: rateTimer }, rateData.remainingCooldown)
    }
  }
})

onUnmounted(() => {
  clearTimer({ value: goldTimer })
  clearTimer({ value: rateTimer })
})
</script>
