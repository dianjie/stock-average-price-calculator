<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle v-if="mode === 'global'">全局默认费率</DialogTitle>
        <DialogTitle v-else>「{{ stockName }}」独立费率</DialogTitle>
        <DialogDescription v-if="mode === 'global'">
          设置所有股票费用的计算基准。若某股票开启了独立费率，则以独立费率为准。
        </DialogDescription>
        <DialogDescription v-else>
          {{
            useCustom
              ? '当前使用独立费率，将覆盖全局默认费率。'
              : '当前使用全局默认费率，开启后可独立设置。'
          }}
        </DialogDescription>
      </DialogHeader>

      <template v-if="mode === 'stock'">
        <div class="flex items-center gap-2 py-1">
          <Checkbox
            id="use-custom-fee"
            :model-value="useCustom"
            @update:model-value="onToggleUseCustom"
          />
          <Label for="use-custom-fee" class="cursor-pointer text-sm">启用独立费率设置</Label>
        </div>
      </template>

      <template v-if="!useCustom && mode === 'stock'">
        <div class="bg-muted/30 space-y-1.5 rounded-md border p-3 text-sm">
          <p class="text-muted-foreground mb-2 text-xs">当前生效的全局默认费率：</p>
          <div class="flex justify-between">
            <span>普通佣金费率</span>
            <span class="tabular-nums"
              >万分之{{ (globalFeeSettings!.commission * 10000).toFixed(2) }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>最低佣金</span>
            <span class="tabular-nums">{{ globalFeeSettings!.minCommission.toFixed(2) }} 元</span>
          </div>
          <div class="flex justify-between">
            <span>印花税率</span>
            <span class="tabular-nums"
              >千分之{{ (globalFeeSettings!.stampTax * 1000).toFixed(2) }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>过户费率</span>
            <span class="tabular-nums"
              >万分之{{ (globalFeeSettings!.transferFee * 10000).toFixed(2) }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>ETF 佣金费率</span>
            <span class="tabular-nums"
              >万分之{{ (globalFeeSettings!.etfCommission * 10000).toFixed(2) }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>积存金卖出费率</span>
            <span class="tabular-nums"
              >百分之{{ (globalFeeSettings!.goldSellFeeRate * 100).toFixed(2) }}</span
            >
          </div>
        </div>
      </template>

      <form v-if="useCustom || mode === 'global'" class="space-y-3" @submit="onSubmit">
        <VeeField v-slot="{ value, errorMessage, handleChange }" name="commission">
          <Field>
            <FieldLabel for="tx-commission"
              >普通佣金费率 (万分之{{
                ((value ?? feeSettings.commission) * 10000).toFixed(2)
              }})</FieldLabel
            >
            <NumberField
              id="tx-commission"
              :model-value="value"
              :format-options="rateFormat5"
              :step="0.00001"
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
        <VeeField v-slot="{ value, errorMessage, handleChange }" name="minCommission">
          <Field>
            <FieldLabel for="tx-minCommission">最低佣金 (元)</FieldLabel>
            <NumberField
              id="tx-minCommission"
              :model-value="value"
              :format-options="rateFormat2"
              :step="0.01"
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
        <VeeField v-slot="{ value, errorMessage, handleChange }" name="stampTax">
          <Field>
            <FieldLabel for="tx-stampTax"
              >印花税率 (千分之{{
                ((value ?? feeSettings.stampTax) * 1000).toFixed(2)
              }})</FieldLabel
            >
            <NumberField
              id="tx-stampTax"
              :model-value="value"
              :format-options="rateFormat5"
              :step="0.00001"
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
        <VeeField v-slot="{ value, errorMessage, handleChange }" name="transferFee">
          <Field>
            <FieldLabel for="tx-transferFee"
              >过户费率 (万分之{{
                ((value ?? feeSettings.transferFee) * 10000).toFixed(2)
              }})</FieldLabel
            >
            <NumberField
              id="tx-transferFee"
              :model-value="value"
              :format-options="rateFormat5"
              :step="0.00001"
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
        <VeeField v-slot="{ value, errorMessage, handleChange }" name="etfCommission">
          <Field>
            <FieldLabel for="tx-etfCommission"
              >ETF 佣金费率 (万分之{{
                ((value ?? feeSettings.etfCommission) * 10000).toFixed(2)
              }})</FieldLabel
            >
            <NumberField
              id="tx-etfCommission"
              :model-value="value"
              :format-options="rateFormat5"
              :step="0.00001"
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
        <VeeField v-slot="{ value, errorMessage, handleChange }" name="goldSellFeeRate">
          <Field>
            <FieldLabel for="tx-goldSellFeeRate"
              >积存金卖出费率 (百分之{{
                ((value ?? feeSettings.goldSellFeeRate) * 100).toFixed(2)
              }})</FieldLabel
            >
            <NumberField
              id="tx-goldSellFeeRate"
              :model-value="value"
              :format-options="rateFormat4"
              :step="0.0001"
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
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit">{{ mode === 'global' ? '保存' : '保存独立费率' }}</Button>
        </DialogFooter>
      </form>

      <DialogFooter v-else>
        <DialogClose as-child>
          <Button variant="outline">关闭</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm, Field as VeeField } from 'vee-validate'
import { z } from 'zod'
import type { FeeSettings } from '@/config/feeSettings'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
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

const props = withDefaults(
  defineProps<{
    open: boolean
    feeSettings: FeeSettings
    mode?: 'global' | 'stock'
    stockName?: string
    globalFeeSettings?: FeeSettings
    hasCustomFee?: boolean
  }>(),
  {
    mode: 'global',
    stockName: '',
    globalFeeSettings: undefined,
    hasCustomFee: false,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [settings: FeeSettings | null]
}>()

const rateFormat5 = { minimumFractionDigits: 5, maximumFractionDigits: 5 }
const rateFormat4 = { minimumFractionDigits: 4, maximumFractionDigits: 4 }
const rateFormat2 = { minimumFractionDigits: 2, maximumFractionDigits: 2 }

const useCustom = ref(props.hasCustomFee)

const schema = z.object({
  commission: z.number('请输入普通佣金费率'),
  minCommission: z.number('请输入最低佣金'),
  stampTax: z.number('请输入印花税率'),
  transferFee: z.number('请输入过户费率'),
  etfCommission: z.number('请输入ETF佣金费率'),
  goldSellFeeRate: z.number('请输入积存金卖出费率'),
})

const initialValues = (): FeeSettings => {
  if (props.mode === 'stock') {
    return { ...(props.feeSettings || props.globalFeeSettings!) }
  }
  return { ...props.feeSettings }
}

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: initialValues(),
})

function onToggleUseCustom(val: boolean | 'indeterminate') {
  const v = val === true
  useCustom.value = v
  if (v) {
    const s = props.feeSettings || props.globalFeeSettings!
    setFieldValue('commission', s.commission)
    setFieldValue('minCommission', s.minCommission)
    setFieldValue('stampTax', s.stampTax)
    setFieldValue('transferFee', s.transferFee)
    setFieldValue('etfCommission', s.etfCommission)
    setFieldValue('goldSellFeeRate', s.goldSellFeeRate)
  } else {
    emit('save', null)
  }
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      useCustom.value = props.hasCustomFee
      const s =
        props.mode === 'stock' && props.hasCustomFee
          ? props.feeSettings
          : props.mode === 'stock'
            ? props.globalFeeSettings!
            : props.feeSettings
      setFieldValue('commission', s.commission)
      setFieldValue('minCommission', s.minCommission)
      setFieldValue('stampTax', s.stampTax)
      setFieldValue('transferFee', s.transferFee)
      setFieldValue('etfCommission', s.etfCommission)
      setFieldValue('goldSellFeeRate', s.goldSellFeeRate)
    }
  },
)

const onSubmit = handleSubmit((values) => {
  emit('save', { ...values })
})
</script>
