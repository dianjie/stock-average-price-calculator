<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>导入数据</DialogTitle>
        <DialogDescription>支持 .json、.csv、.xlsx 格式</DialogDescription>
      </DialogHeader>

      <div
        class="border-muted-foreground/25 hover:border-primary/50 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors"
        :class="isDragOver ? 'border-primary bg-primary/5' : ''"
        @click="triggerFileInput"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="onDrop"
      >
        <Upload class="text-muted-foreground mb-3 size-8" />
        <p class="text-sm font-medium">点击选择文件或拖拽文件到此处</p>
        <p class="text-muted-foreground mt-1 text-xs">支持 .json, .csv, .xlsx, .xls</p>
        <input
          ref="fileInputRef"
          type="file"
          class="hidden"
          accept=".json,.csv,.xlsx,.xls"
          @change="onFileSelect"
        />
      </div>

      <div v-if="file" class="bg-muted flex items-center justify-between rounded-md px-3 py-2">
        <div class="flex items-center gap-2 overflow-hidden">
          <FileText class="text-muted-foreground size-4 shrink-0" />
          <span class="truncate text-sm">{{ file.name }}</span>
          <span class="text-muted-foreground shrink-0 text-xs">{{ formatSize(file.size) }}</span>
        </div>
        <Button variant="ghost" size="icon-sm" @click="clearFile">
          <X class="size-4" />
        </Button>
      </div>

      <div v-if="parseError" class="text-destructive text-sm">{{ parseError }}</div>

      <div v-if="preview" class="bg-muted space-y-1 rounded-md px-3 py-2 text-sm">
        <p>
          将导入 <strong>{{ preview.stockCount }}</strong> 只股票，共
          <strong>{{ preview.txCount }}</strong> 条交易记录
        </p>
        <p v-if="preview.overlapCount > 0" class="text-muted-foreground text-xs">
          其中 {{ preview.overlapCount }} 只股票与现有数据代码相同，
          {{ overwrite ? '将覆盖' : '将被跳过' }}
        </p>
        <p v-if="!overwrite && preview.overlapCount > 0" class="text-muted-foreground text-xs">
          取消勾选时将跳过已存在的股票
        </p>
        <p v-if="preview.newCount > 0" class="text-muted-foreground text-xs">
          新增 {{ preview.newCount }} 只股票
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Checkbox id="import-overwrite" v-model="overwrite" />

        <label for="import-overwrite" class="text-sm leading-none font-medium">
          {{ overwrite ? '覆盖同名股票数据' : '跳过已存在的股票（默认）' }}
        </label>
      </div>

      <div class="flex items-center gap-2 text-xs">
        <span class="text-muted-foreground">下载导入模板：</span>
        <Button
          variant="link"
          size="sm"
          class="h-auto p-0 text-xs"
          @click="downloadTemplate('csv')"
        >
          CSV
        </Button>
        <Button
          variant="link"
          size="sm"
          class="h-auto p-0 text-xs"
          @click="downloadTemplate('xlsx')"
        >
          Excel
        </Button>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" @click="clearFile">取消</Button>
        </DialogClose>
        <Button :disabled="!preview || importing" @click="confirmImport">
          <Loader2Icon v-if="importing" class="size-4 animate-spin" />
          {{ importing ? '导入中...' : '确认导入' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Upload, FileText, X, Loader2Icon } from 'lucide-vue-next'
import { importFromFile, downloadTemplate } from '@/utils/dataIO'
import type { StockItem } from '@/utils/stockStats'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const props = defineProps<{
  open: boolean
  stocks: StockItem[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  import: [stocks: StockItem[], overwrite: boolean]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const isDragOver = ref(false)
const importing = ref(false)
const overwrite = ref(false)
const parsedStocks = ref<StockItem[] | null>(null)
const parseError = ref('')

const preview = computed(() => {
  if (!parsedStocks.value) return null
  const incoming = parsedStocks.value
  const existingCodes = new Set(props.stocks.map((s) => s.code))
  const overlapCount = incoming.filter((s) => existingCodes.has(s.code)).length
  const newCount = incoming.length - overlapCount
  const txCount = incoming.reduce((sum, s) => sum + s.transactions.length, 0)
  return { stockCount: incoming.length, txCount, overlapCount, newCount }
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileSelect(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) setFile(f)
}

function onDrop(e: DragEvent) {
  isDragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) setFile(f)
}

async function setFile(f: File) {
  file.value = f
  parsedStocks.value = null
  parseError.value = ''
  try {
    parsedStocks.value = await importFromFile(f)
  } catch (err: unknown) {
    parseError.value = (err as Error).message || '文件解析失败'
  }
}

function clearFile() {
  file.value = null
  parsedStocks.value = null
  parseError.value = ''
  importing.value = false
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function confirmImport() {
  if (!parsedStocks.value) return
  importing.value = true
  emit('import', parsedStocks.value, overwrite.value)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

watch(
  () => props.open,
  (val) => {
    if (!val) clearFile()
  },
)
</script>
