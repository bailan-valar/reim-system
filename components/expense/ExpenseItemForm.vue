<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Invoice Selection Section -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-medium text-gray-700">从发票箱选择发票（可选）</label>
        <button
          type="button"
          @click="showInvoiceSelector = true"
          class="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          选择发票
        </button>
      </div>
      <div v-if="selectedInvoices.length > 0" class="space-y-2">
        <div v-for="invoice in selectedInvoices" :key="invoice.id" class="bg-white rounded-lg p-3 border border-blue-300">
          <div class="flex items-start justify-between">
            <div class="flex-1 space-y-1">
              <p class="text-sm font-medium text-gray-900">{{ invoice.invoiceNumber }}</p>
              <p class="text-xs text-gray-600">{{ invoice.invoiceType }}</p>
              <p class="text-sm font-semibold text-blue-600">¥{{ invoice.totalAmount.toFixed(2) }}</p>
              <p class="text-xs text-gray-500">开票日期: {{ formatDate(invoice.invoiceDate) }}</p>
            </div>
            <button
              type="button"
              @click="removeInvoice(invoice.id)"
              class="text-gray-400 hover:text-red-600"
              title="移除此发票"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div class="bg-blue-100 rounded-lg p-2 text-sm">
          <p class="font-medium text-blue-900">已选择 {{ selectedInvoices.length }} 张发票</p>
          <p class="text-xs text-blue-700">总金额: ¥{{ totalInvoiceAmount.toFixed(2) }}</p>
        </div>
      </div>
      <p v-else class="text-xs text-gray-500">选择发票后将自动填充金额、日期和类别信息</p>
    </div>

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

    <!-- Invoice Selector Modal -->
    <ClientOnly>
      <InvoiceBoxSelector
        v-if="showInvoiceSelector"
        @close="showInvoiceSelector = false"
        @select="handleInvoiceSelected"
      />
    </ClientOnly>
  </form>
</template>

<script setup lang="ts">
import type { ExpenseItem, CreateExpenseItemInput } from '~/types/expenseItem'
import type { InvoiceBox } from '~/types/invoiceBox'
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

const showInvoiceSelector = ref(false)
const selectedInvoices = ref<InvoiceBox[]>([])

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

// Computed property for total invoice amount
const totalInvoiceAmount = computed(() => {
  return selectedInvoices.value.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
})

const categoryOptions = EXPENSE_CATEGORIES.map(category => ({
  value: category,
  label: category
}))

// Map invoice expense category to form category
const mapInvoiceCategoryToFormCategory = (expenseCategory?: string | null): string => {
  if (!expenseCategory) return ''

  // Direct match
  if (EXPENSE_CATEGORIES.includes(expenseCategory as any)) {
    return expenseCategory
  }

  // Fuzzy matching for common categories
  const categoryLower = expenseCategory.toLowerCase()

  if (categoryLower.includes('餐') || categoryLower.includes('饮食') || categoryLower.includes('食')) {
    return '餐饮'
  }
  if (categoryLower.includes('交通') || categoryLower.includes('打车') || categoryLower.includes('出租')) {
    return '交通'
  }
  if (categoryLower.includes('住宿') || categoryLower.includes('酒店') || categoryLower.includes('宾馆')) {
    return '住宿'
  }
  if (categoryLower.includes('火车') || categoryLower.includes('高铁') || categoryLower.includes('动车')) {
    return '火车'
  }
  if (categoryLower.includes('飞机') || categoryLower.includes('机票') || categoryLower.includes('航空')) {
    return '飞机'
  }
  if (categoryLower.includes('办公') || categoryLower.includes('文具') || categoryLower.includes('用品')) {
    return '办公用品'
  }
  if (categoryLower.includes('通讯') || categoryLower.includes('电话') || categoryLower.includes('网络')) {
    return '通讯费'
  }
  if (categoryLower.includes('快递') || categoryLower.includes('邮寄') || categoryLower.includes('物流')) {
    return '快递费'
  }

  // Default to '其他' if no match
  return '其他'
}

// Handle invoice selection (multiple invoices)
const handleInvoiceSelected = (invoices: InvoiceBox[]) => {
  selectedInvoices.value = invoices
  showInvoiceSelector.value = false

  if (invoices.length === 0) return

  // Auto-fill form data from the first invoice or aggregate data
  const firstInvoice = invoices[0]

  // Calculate total amount from all selected invoices
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  formData.amount = totalAmount.toString()

  // Use the date from the first invoice
  formData.date = new Date(firstInvoice.invoiceDate).toISOString().split('T')[0]
  formData.hasInvoice = true

  // Map invoice expense category to form category (use first invoice's category)
  if (firstInvoice.expenseCategory) {
    const mappedCategory = mapInvoiceCategoryToFormCategory(firstInvoice.expenseCategory)
    if (mappedCategory) {
      formData.category = mappedCategory
    }
  }

  // Auto-fill description with invoice info
  if (!formData.description) {
    if (invoices.length === 1) {
      // Single invoice: show detailed info
      const descriptionParts = []
      if (firstInvoice.buyerName) {
        descriptionParts.push(`购买方: ${firstInvoice.buyerName}`)
      }
      if (firstInvoice.expenseCategory) {
        descriptionParts.push(`项目: ${firstInvoice.expenseCategory}`)
      }
      if (firstInvoice.remark) {
        descriptionParts.push(firstInvoice.remark)
      }
      formData.description = descriptionParts.join(' | ')
    } else {
      // Multiple invoices: show summary
      formData.description = `包含 ${invoices.length} 张发票，发票号: ${invoices.map(inv => inv.invoiceNumber).join(', ')}`
    }
  }
}

// Remove a specific invoice from selection
const removeInvoice = (invoiceId: string) => {
  const index = selectedInvoices.value.findIndex(inv => inv.id === invoiceId)
  if (index > -1) {
    selectedInvoices.value.splice(index, 1)

    // Recalculate amount if there are remaining invoices
    if (selectedInvoices.value.length > 0) {
      const totalAmount = selectedInvoices.value.reduce((sum, inv) => sum + inv.totalAmount, 0)
      formData.amount = totalAmount.toString()
    }
  }
}

// Format date for display
const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

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

  const submitData: CreateExpenseItemInput = {
    amount: parseFloat(formData.amount),
    date: formData.date,
    category: formData.category as any,
    description: formData.description.trim() || undefined,
    hasInvoice: formData.hasInvoice,
    departure: formData.departure.trim() || undefined,
    arrival: formData.arrival.trim() || undefined
  }

  // Include selected invoice IDs if available
  if (selectedInvoices.value.length > 0) {
    submitData.invoiceBoxIds = selectedInvoices.value.map(inv => inv.id)
  }

  emit('submit', submitData)
}
</script>
