<template>
  <div class="bg-muted mb-5 rounded-md p-4">
    <form @submit="onSubmit">
      <div class="grid grid-cols-3 gap-4">
        <VeeField v-slot="{ componentField, errorMessage }" name="code">
          <Field>
            <FieldLabel for="stock-code">代码</FieldLabel>
            <Input id="stock-code" v-bind="componentField" placeholder="请输入代码" class="w-36" />
            <FieldError v-if="errorMessage" :errors="[errorMessage]" />
          </Field>
        </VeeField>

        <VeeField v-slot="{ componentField, errorMessage }" name="name">
          <Field>
            <FieldLabel for="stock-name">名称</FieldLabel>
            <Input id="stock-name" v-bind="componentField" placeholder="请输入名称" class="w-36" />
            <FieldError v-if="errorMessage" :errors="[errorMessage]" />
          </Field>
        </VeeField>

        <VeeField v-slot="{ componentField, errorMessage }" name="type">
          <Field>
            <FieldLabel for="stock-type">类型</FieldLabel>
            <Select
              id="stock-type"
              :model-value="componentField.modelValue"
              @update:model-value="componentField.onChange"
            >
              <SelectTrigger class="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A股">A股</SelectItem>
                <SelectItem value="ETF">ETF</SelectItem>
                <SelectItem value="积存金">积存金</SelectItem>
              </SelectContent>
            </Select>
            <FieldError v-if="errorMessage" :errors="[errorMessage]" />
          </Field>
        </VeeField>
      </div>

      <Button type="submit" class="mx-auto mt-4 flex w-36" :disabled="isSubmitting">
        <Loader2Icon v-if="isSubmitting" class="size-4 animate-spin" />
        {{ isSubmitting ? '添加中...' : '添加' }}
      </Button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useForm, Field as VeeField } from 'vee-validate'
import { z } from 'zod'
import { Loader2Icon } from 'lucide-vue-next'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StockType } from '@/utils/feeCalculator'

const emit = defineEmits<{
  (e: 'add', code: string, name: string, type: StockType): void
}>()

const stockSelectorSchema = z
  .object({
    code: z.string().min(1, '请输入代码'),
    name: z.string().min(1, '请输入名称'),
    type: z.enum(['A股', 'ETF', '积存金']),
  })
  .refine((data) => data.type === '积存金' || /^\d{6}$/.test(data.code), {
    message: '股票代码应为6位数字',
    path: ['code'],
  })

const { handleSubmit, resetForm } = useForm({
  validationSchema: stockSelectorSchema,
  initialValues: { code: '', name: '', type: 'A股' },
})

const isSubmitting = ref(false)

const onSubmit = handleSubmit((values) => {
  isSubmitting.value = true
  emit('add', values.code, values.name, values.type)
  resetForm({ values: { code: '', name: '', type: 'A股' } })
  isSubmitting.value = false
})
</script>
