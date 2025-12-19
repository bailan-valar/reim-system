<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <UiInput
      v-model="formData.title"
      label="报销单标题"
      placeholder="请输入报销单标题"
      required
      :error="errors.title"
    />

    <div>
      <label class="label">描述</label>
      <textarea
        v-model="formData.description"
        rows="3"
        class="input"
        placeholder="请输入报销单描述（可选）"
      />
    </div>

    <UiSelect
      v-model="formData.type"
      label="报销类型"
      :options="typeOptions"
      required
    />

    <!-- Date Range Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UiInput
        v-model="formData.startDate"
        type="date"
        label="开始日期"
        placeholder="选择开始日期（可选）"
        :error="errors.startDate"
      />

      <UiInput
        v-model="formData.endDate"
        type="date"
        label="结束日期"
        placeholder="选择结束日期（可选）"
        :error="errors.endDate"
      />
    </div>

    <!-- Company Selection -->
    <UiCompanySelect
      v-model="formData.companyId"
      label="所属公司"
      placeholder="选择或创建公司（可选）"
      :error="errors.companyId"
    />

    <UiSelect
      v-model="formData.status"
      label="状态"
      :options="statusOptions"
      required
    />

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
import type { Reimbursement, CreateReimbursementInput } from '~/types/reimbursement'
import { REIMBURSEMENT_STATUSES, REIMBURSEMENT_TYPES } from '~/utils/constants'

const props = defineProps<{
  reimbursement?: Reimbursement
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateReimbursementInput]
  cancel: []
}>()

// Helper function to format date for input[type="date"]
const formatDateForInput = (date: Date | string | null | undefined): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

const formData = reactive({
  title: props.reimbursement?.title || '',
  description: props.reimbursement?.description || '',
  type: props.reimbursement?.type || '现金报销',
  status: props.reimbursement?.status || '待整理',
  startDate: formatDateForInput(props.reimbursement?.startDate),
  endDate: formatDateForInput(props.reimbursement?.endDate),
  companyId: props.reimbursement?.companyId || null
})

const errors = reactive({
  title: '',
  startDate: '',
  endDate: '',
  companyId: ''
})

const typeOptions = REIMBURSEMENT_TYPES.map(type => ({
  value: type,
  label: type
}))

const statusOptions = REIMBURSEMENT_STATUSES.map(status => ({
  value: status,
  label: status
}))

const handleSubmit = () => {
  // Reset errors
  errors.title = ''
  errors.startDate = ''
  errors.endDate = ''
  errors.companyId = ''

  // Validate title
  if (!formData.title.trim()) {
    errors.title = '标题不能为空'
    return
  }

  // Validate date range
  if (formData.startDate && formData.endDate) {
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    if (start > end) {
      errors.startDate = '开始日期不能晚于结束日期'
      errors.endDate = '结束日期不能早于开始日期'
      return
    }
  }

  emit('submit', {
    title: formData.title.trim(),
    description: formData.description.trim() || undefined,
    type: formData.type as any,
    status: formData.status as any,
    startDate: formData.startDate || undefined,
    endDate: formData.endDate || undefined,
    companyId: formData.companyId || undefined
  })
}
</script>
