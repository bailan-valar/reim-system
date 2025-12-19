<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <UiInput
      v-model="formData.amount"
      type="number"
      step="0.01"
      label="金额"
      placeholder="请输入金额"
      required
      :error="errors.amount"
    />

    <UiInput
      v-model="formData.date"
      type="date"
      label="日期"
      required
      :error="errors.date"
    />

    <UiSelect
      v-model="formData.category"
      label="类别"
      :options="categoryOptions"
      required
      :error="errors.category"
    />

    <!-- Departure and Arrival fields for train/plane -->
    <div v-if="showTravelFields" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UiInput
        v-model="formData.departure"
        label="出发地"
        placeholder="请输入出发地"
        required
        :error="errors.departure"
      />
      <UiInput
        v-model="formData.arrival"
        label="到达地"
        placeholder="请输入到达地"
        required
        :error="errors.arrival"
      />
    </div>

    <div>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          v-model="formData.hasInvoice"
          type="checkbox"
          class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <span class="text-sm font-medium text-gray-700">已开票</span>
      </label>
      <p class="mt-1 text-xs text-gray-500">勾选此项表示该费用已开具发票，但尚未上传</p>
    </div>

    <div>
      <label class="label">描述</label>
      <textarea
        v-model="formData.description"
        rows="3"
        class="input"
        placeholder="请输入费用描述（可选）"
      />
    </div>

    <div class="flex gap-3 justify-end pt-4">
      <UiButton
        type="button"
        variant="secondary"
        @click="$emit('cancel')"
      >
        取消
      </UiButton>
      <UiButton
        type="submit"
        :disabled="loading"
      >
        {{ loading ? '保存中...' : '保存' }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { ExpenseItem, CreateExpenseItemInput } from '~/types/expenseItem'
import { EXPENSE_CATEGORIES } from '~/utils/constants'

const props = defineProps<{
  item?: ExpenseItem
  loading?: boolean
  defaultDate?: string
}>()

const emit = defineEmits<{
  submit: [data: CreateExpenseItemInput]
  cancel: []
}>()

const getDefaultDate = () => {
  if (props.item?.date) {
    return new Date(props.item.date).toISOString().split('T')[0]
  }
  if (props.defaultDate) {
    return new Date(props.defaultDate).toISOString().split('T')[0]
  }
  return new Date().toISOString().split('T')[0]
}

const formData = reactive({
  amount: props.item?.amount?.toString() || '',
  date: getDefaultDate(),
  category: props.item?.category || '',
  description: props.item?.description || '',
  hasInvoice: props.item?.hasInvoice || false,
  departure: props.item?.departure || '',
  arrival: props.item?.arrival || ''
})

const errors = reactive({
  amount: '',
  date: '',
  category: '',
  departure: '',
  arrival: ''
})

// Computed property to show/hide travel fields
const showTravelFields = computed(() => {
  return formData.category === '火车' || formData.category === '飞机'
})

const categoryOptions = EXPENSE_CATEGORIES.map(category => ({
  value: category,
  label: category
}))

const handleSubmit = () => {
  // Reset errors
  errors.amount = ''
  errors.date = ''
  errors.category = ''
  errors.departure = ''
  errors.arrival = ''

  // Validate
  if (!formData.amount || parseFloat(formData.amount) <= 0) {
    errors.amount = '请输入有效的金额'
    return
  }

  if (!formData.date) {
    errors.date = '请选择日期'
    return
  }

  if (!formData.category) {
    errors.category = '请选择类别'
    return
  }

  // Validate departure and arrival for train/plane
  if (formData.category === '火车' || formData.category === '飞机') {
    if (!formData.departure.trim()) {
      errors.departure = '请输入出发地'
      return
    }
    if (!formData.arrival.trim()) {
      errors.arrival = '请输入到达地'
      return
    }
  }

  emit('submit', {
    amount: parseFloat(formData.amount),
    date: formData.date,
    category: formData.category as any,
    description: formData.description.trim() || undefined,
    hasInvoice: formData.hasInvoice,
    departure: formData.departure.trim() || undefined,
    arrival: formData.arrival.trim() || undefined
  })
}
</script>
