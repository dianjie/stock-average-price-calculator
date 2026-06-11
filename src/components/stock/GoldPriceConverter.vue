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
            :loading="fetching"
            :cooldown="cooldown"
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
          @blur="persistIntlAndRate"
        />

        <div class="flex items-center justify-between">
          <label class="text-muted-foreground text-xs">汇率 (美元兑人民币)</label>
        </div>
        <Input
          type="number"
          :model-value="exchangeRate"
          :step="0.0001"
          :min="0"
          placeholder="如 7.25"
          @update:model-value="updateExchangeRate"
          @blur="persistAllValues"
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
          @blur="persistDomesticAndRate"
        />

        <div class="flex items-center justify-between">
          <label class="text-muted-foreground text-xs">汇率 (美元兑人民币)</label>
        </div>
        <Input
          type="number"
          :model-value="exchangeRate"
          :step="0.0001"
          :min="0"
          placeholder="如 7.25"
          @update:model-value="updateExchangeRate"
          @blur="persistAllValues"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import FetchButton from './FetchButton.vue'

// 常量
const OZ_TO_GRAM = 31.1035
const COOLDOWN_SECONDS = 60
const GOLD_API_URL = 'https://api.gold-api.com/price/XAU/CNY'
const STORAGE_KEY = 'gold_price_cache'

// 响应式状态
const intlPrice = ref(0)
const exchangeRate = ref(7.25)
const domesticInput = ref(0)

// 计算属性
const domesticPrice = computed(() => {
  if (intlPrice.value <= 0 || exchangeRate.value <= 0) return 0
  return (intlPrice.value * exchangeRate.value) / OZ_TO_GRAM
})

const intlPriceRev = computed(() => {
  if (domesticInput.value <= 0 || exchangeRate.value <= 0) return 0
  return (domesticInput.value * OZ_TO_GRAM) / exchangeRate.value
})

// 获取行情状态
const fetching = ref(false)
const cooldown = ref(0)

const emit = defineEmits<{
  apply: [price: number]
}>()

// 应用价格
function applyDomesticPrice() {
  if (domesticPrice.value > 0) {
    emit('apply', domesticPrice.value)
  }
}

// 输入更新
function updateIntlPrice(value: string | number) {
  intlPrice.value = Number(value) || 0
}

function updateExchangeRate(value: string | number) {
  exchangeRate.value = Number(value) || 0
}

function updateDomesticInput(value: string | number) {
  domesticInput.value = Number(value) || 0
}

// 冷却计时器
const { startCooldown, clearCooldown } = (() => {
  let timer: ReturnType<typeof setInterval> | null = null

  function start(duration = COOLDOWN_SECONDS) {
    cooldown.value = duration
    if (timer) clearInterval(timer)
    timer = setInterval(() => {
      cooldown.value--
      if (cooldown.value <= 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  }

  function clear() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return { startCooldown: start, clearCooldown: clear }
})()

// 数据持久化
function persistIntlAndRate() {
  const cache = _loadCache()
  cache.intl = intlPrice.value
  cache.rate = exchangeRate.value
  _saveCache(cache)
}

function persistDomesticAndRate() {
  const cache = _loadCache()
  cache.domestic = domesticInput.value
  cache.rate = exchangeRate.value
  _saveCache(cache)
}

function persistAllValues() {
  _saveCache({
    intl: intlPrice.value,
    rate: exchangeRate.value,
    domestic: domesticInput.value,
  })
}

function _saveCache(partial: { intl: number; rate: number; domestic: number }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...partial, ts: Date.now() }))
}

function _loadCache(): { intl: number; rate: number; domestic: number; ts: number } {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { intl: 0, rate: 7.25, domestic: 0, ts: 0 }
  try {
    return JSON.parse(raw)
  } catch {
    return { intl: 0, rate: 7.25, domestic: 0, ts: 0 }
  }
}

// 获取行情
async function fetchGoldPrice() {
  if (cooldown.value > 0 || fetching.value) return

  fetching.value = true
  try {
    const response = await fetch(GOLD_API_URL)
    if (!response.ok) {
      throw new Error(`金价API请求失败: ${response.status} ${response.statusText}`)
    }

    const data: { price: number; exchangeRate: number } = await response.json()

    if (typeof data.price !== 'number' || typeof data.exchangeRate !== 'number') {
      toast.error('获取金价失败：数据格式异常')
      return
    }

    // price 为人民币/盎司，转换为美元/盎司
    const usdPrice = data.price / data.exchangeRate
    intlPrice.value = Math.round(usdPrice * 100) / 100
    exchangeRate.value = data.exchangeRate
    persistIntlAndRate()
    toast.success('已更新伦敦金实时价格')
  } catch (error) {
    console.error('获取金价错误:', error)
    toast.error('获取伦敦金价格失败，请稍后重试')
  } finally {
    fetching.value = false
    startCooldown()
  }
}

// 挂载/卸载
onMounted(() => {
  const cached = _loadCache()
  intlPrice.value = cached.intl || 0
  exchangeRate.value = cached.rate || 7.25
  domesticInput.value = cached.domestic || 0

  if (cached.ts > 0) {
    const elapsed = (Date.now() - cached.ts) / 1000
    const remaining = Math.max(0, Math.ceil(COOLDOWN_SECONDS - elapsed))
    if (remaining > 0) {
      startCooldown(remaining)
    }
  }
})

onUnmounted(() => {
  clearCooldown()
})
</script>
