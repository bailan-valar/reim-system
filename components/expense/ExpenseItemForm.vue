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
}>()

const emit = defineEmits<{
  submit: [data: CreateExpenseItemInput]
  cancel: []
}>()

const formData = reactive({
  amount: props.item?.amount?.toString() || '',
  date: props.item?.date ? new Date(props.item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  category: props.item?.category || '',
  description: props.item?.description || ''
})

const errors = reactive({
  amount: '',
  date: '',
  category: ''
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

  emit('submit', {
    amount: parseFloat(formData.amount),
    date: formData.date,
    category: formData.category as any,
    description: formData.description.trim() || undefined
  })
}
</script>
