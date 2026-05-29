<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ editing ? '修改交易记录' : '添加交易记录' }}</DialogTitle>
        <DialogDescription>请输入交易详情</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit="onSubmit">
        <VeeField v-slot="{ componentField, errorMessage }" name="date">
          <Field>
            <FieldLabel for="tx-date">日期</FieldLabel>
            <Input id="tx-date" v-bind="componentField" type="date" />
            <FieldError v-if="errorMessage" :errors="[errorMessage]" />
          </Field>
        </VeeField>

        <VeeField v-slot="{ componentField }" name="type">
          <Field>
            <FieldLabel for="tx-type">类型</FieldLabel>
            <Select id="tx-type" v-bind="componentField">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="买入">买入</SelectItem>
                <SelectItem value="卖出">卖出</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </VeeField>

        <VeeField v-slot="{ value, errorMessage, handleChange }" name="price">
          <Field>
            <FieldLabel for="tx-price">价格</FieldLabel>
            <NumberField
              id="tx-price"
              :model-value="value"
              :format-options="priceFormatOptions"
              :step="0.001"
              :min="0"
              @update:model-value="handleChange"
            >
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
            <FieldError v-if="errorMessage" :errors="[errorMessage]" />
          </Field>
        </VeeField>

        <VeeField v-slot="{ value, errorMessage, handleChange }" name="quantity">
          <Field>
            <FieldLabel for="tx-qty">数量({{ stockUnit }})</FieldLabel>
            <NumberField
              id="tx-qty"
              :model-value="value"
              :format-options="qtyFormatOptions"
              :step="qtyStep"
              :min="0"
              @update:model-value="handleChange"
            >
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
            <FieldError v-if="errorMessage" :errors="[errorMessage]" />
          </Field>
        </VeeField>

        <VeeField v-slot="{ value, handleChange }" name="tags">
          <Field>
            <FieldLabel for="tx-tags">标签</FieldLabel>
            <TagsInput id="tx-tags" :model-value="value" @update:model-value="handleChange">
              <TagsInputItem v-for="(tag, i) in value" :key="i" :value="tag">
                <TagsInputItemText />
                <TagsInputItemDelete />
              </TagsInputItem>
              <TagsInputInput placeholder="输入标签后回车" />
            </TagsInput>
          </Field>
        </VeeField>

        <Field>
          <FieldLabel>金额 (自动计算)</FieldLabel>
          <Input :model-value="calculatedAmount.toFixed(2)" disabled />
        </Field>
        <Field>
          <FieldLabel>费用 (自动计算)</FieldLabel>
          <Input :model-value="calculatedFee.toFixed(2)" disabled />
        </Field>
        <Field>
          <FieldLabel>总金额 (自动计算)</FieldLabel>
          <Input :model-value="calculatedTotalAmount.toFixed(2)" disabled />
        </Field>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="loading">{{ editing ? '确认修改' : '确认' }}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { useForm, Field as VeeField } from 'vee-validate'
import { z } from 'zod'
import type { Transaction } from '@/utils/stockStats'
import { calculateTransactionFee, getMarketType } from '@/utils/feeCalculator'
import type { StockItem } from '@/utils/stockStats'
import type { FeeSettings } from '@/config/feeSettings'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from '@/components/ui/tags-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'

const props = defineProps<{
  open: boolean
  editing: boolean
  stock: StockItem | null
  feeSettings: FeeSettings
  loading: boolean
  currentPosition: number
  initialData: Transaction | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [transaction: Transaction]
}>()

const stockUnit = computed(() => (props.stock?.type === '积存金' ? '克' : '股'))
const qtyStep = computed(() => (props.stock?.type === '积存金' ? 0.0001 : 100))

const qtyFormatOptions = computed(() => {
  if (props.stock?.type === '积存金') {
    return { minimumFractionDigits: 4, maximumFractionDigits: 4 }
  }
  return { minimumFractionDigits: 0, maximumFractionDigits: 0 }
})

const priceFormatOptions = {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
}

const today = new Date().toISOString().split('T')[0]

const schema = z.object({
  date: z.string().min(1, '请选择日期'),
  type: z.enum(['买入', '卖出']),
  price: z.number('请输入价格'),
  quantity: z.number('请输入数量'),
  tags: z.array(z.string()),
})

const {
  handleSubmit,
  setFieldValue,
  values: formValues,
} = useForm({
  validationSchema: schema,
  initialValues: { date: today, type: '买入', price: 0, quantity: 100, tags: [] },
})

const calculatedAmount = computed(() => (formValues.price || 0) * (formValues.quantity || 0))

const calculatedFee = computed(() => {
  if (!props.stock) return 0
  return calculateTransactionFee(
    formValues.type as '买入' | '卖出',
    formValues.price || 0,
    formValues.quantity || 0,
    props.stock.type,
    getMarketType(props.stock.code),
    props.feeSettings,
  )
})

const calculatedTotalAmount = computed(() =>
  formValues.type === '买入'
    ? calculatedAmount.value + calculatedFee.value
    : calculatedAmount.value - calculatedFee.value,
)

watch(
  () => props.open,
  (val) => {
    if (val && props.initialData) {
      setFieldValue('date', props.initialData.date)
      setFieldValue('type', props.initialData.type)
      setFieldValue('price', props.initialData.price)
      setFieldValue('quantity', props.initialData.quantity)
      setFieldValue('tags', props.initialData.tags || [])
    } else if (val) {
      setFieldValue('date', today)
      setFieldValue('type', '买入')
      setFieldValue('price', 0)
      setFieldValue('quantity', props.stock?.type === '积存金' ? 1 : 100)
      setFieldValue('tags', [])
    }
  },
)

const onSubmit = handleSubmit((values) => {
  if (values.type === '卖出') {
    let available = props.currentPosition
    if (props.editing && props.initialData) {
      const old = props.initialData
      if (old.type === '买入') {
        available -= old.quantity
      } else {
        available += old.quantity
      }
    }
    if (values.quantity > available) {
      toast.warning(`卖出数量不能超过当前持仓 ${available}`)
      return
    }
  }

  emit('submit', {
    date: values.date,
    type: values.type,
    price: values.price,
    quantity: values.quantity,
    amount: calculatedAmount.value,
    fee: calculatedFee.value,
    totalAmount: calculatedTotalAmount.value,
    tags: values.tags,
  })
})
</script>
