<template>
  <UiModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" title="从发票箱创建报销单" size="large">
    <div class="space-y-4">
      <!-- Instructions -->
      <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-blue-900">
              从发票收集箱选择发票创建报销单
            </p>
            <p class="text-xs text-blue-700 mt-1">
              请先填写报销单基本信息，然后从发票箱中选择未使用的发票
            </p>
          </div>
        </div>
      </div>

      <!-- Form Fields -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            报销单标题 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="例如：2024年1月出差报销"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :disabled="creating"
          />
          <p v-if="titleError" class="mt-1 text-sm text-red-600">{{ titleError }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            描述（可选）
          </label>
          <textarea
            v-model="description"
            rows="2"
            placeholder="添加备注信息..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :disabled="creating"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            所属公司（可选）
          </label>
          <select
            v-model="companyId"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :disabled="creating || loadingCompanies"
          >
            <option value="">请选择公司</option>
            <option v-for="company in companies" :key="company.id" :value="company.id">
              {{ company.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Selected Invoices Section -->
      <div class="border-t pt-4">
        <div class="flex items-center justify-between mb-3">
          <label class="block text-sm font-medium text-gray-700">
            选择发票 <span class="text-red-500">*</span>
          </label>
          <UiButton
            variant="outline"
            size="sm"
            @click="showInvoiceSelector = true"
            :disabled="creating"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            从发票箱选择
          </UiButton>
        </div>

        <!-- Selected Invoices List -->
        <div v-if="selectedInvoices.length === 0" class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-sm text-gray-500">尚未选择发票</p>
          <p class="text-xs text-gray-400 mt-1">点击上方按钮从发票箱选择发票</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="(invoice, index) in selectedInvoices"
            :key="invoice.id"
            class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {{ invoice.invoiceType }}
                </span>
                <span class="text-xs text-gray-500">{{ invoice.invoiceNumber }}</span>
              </div>
              <div class="flex items-center gap-4 text-sm">
                <span class="font-medium text-gray-900">¥{{ formatAmount(invoice.totalAmount) }}</span>
                <span class="text-gray-500">{{ formatDate(invoice.invoiceDate) }}</span>
                <span v-if="invoice.buyerName" class="text-gray-600 truncate">{{ invoice.buyerName }}</span>
              </div>
            </div>
            <button
              type="button"
              class="text-red-600 hover:text-red-700 ml-2 flex-shrink-0"
              @click="removeInvoice(index)"
              :disabled="creating"
              title="移除"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Total Amount -->
          <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span class="text-sm font-medium text-gray-700">总金额</span>
            <span class="text-lg font-bold text-blue-600">¥{{ formatAmount(totalAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <!-- Creating Progress -->
      <div v-if="creating" class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">正在创建报销单...</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-primary-600 h-2 rounded-full animate-pulse w-full" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <UiButton
          type="button"
          variant="secondary"
          @click="handleCancel"
          :disabled="creating"
        >
          取消
        </UiButton>
        <UiButton
          type="button"
          @click="handleCreate"
          :disabled="!canCreate || creating"
        >
          {{ creating ? '创建中...' : '创建报销单' }}
        </UiButton>
      </div>
    </template>

    <!-- Invoice Selector Modal -->
    <InvoiceBoxSelector
      v-if="showInvoiceSelector"
      @close="showInvoiceSelector = false"
      @select="handleInvoiceSelect"
    />
  </UiModal>
</template>

<script setup lang="ts">
import type { Company } from '~/types/company'
import type { InvoiceBox } from '~/types/invoiceBox'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: [reimbursementId: string]
  cancel: []
}>()

const { fetchCompanies } = useCompanies()

const creating = ref(false)
const error = ref('')

// Form fields
const title = ref('')
const description = ref('')
const companyId = ref('')
const titleError = ref('')

// Companies
const companies = ref<Company[]>([])
const loadingCompanies = ref(false)

// Invoice selection
const selectedInvoices = ref<InvoiceBox[]>([])
const showInvoiceSelector = ref(false)

// Load companies when modal opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    loadingCompanies.value = true
    try {
      companies.value = await fetchCompanies()
    } catch (e) {
      console.error('Failed to load companies:', e)
    } finally {
      loadingCompanies.value = false
    }
  } else {
    // Reset form when modal closes
    resetForm()
  }
})

const canCreate = computed(() => {
  return selectedInvoices.value.length > 0 && title.value.trim() !== ''
})

const totalAmount = computed(() => {
  return selectedInvoices.value.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
})

const handleInvoiceSelect = (invoice: InvoiceBox) => {
  // Check if invoice is already selected
  if (!selectedInvoices.value.some(inv => inv.id === invoice.id)) {
    selectedInvoices.value.push(invoice)
  }
  showInvoiceSelector.value = false
}

const removeInvoice = (index: number) => {
  selectedInvoices.value.splice(index, 1)
}

const handleCreate = async () => {
  // Validate title
  if (!title.value.trim()) {
    titleError.value = '标题不能为空'
    return
  }

  if (selectedInvoices.value.length === 0) {
    error.value = '请至少选择一张发票'
    return
  }

  titleError.value = ''
  error.value = ''

  creating.value = true

  try {
    const { data } = await $fetch<any>('/api/reimbursements/create-from-invoice-box', {
      method: 'POST',
      body: {
        title: title.value.trim(),
        description: description.value.trim() || undefined,
        companyId: companyId.value || undefined,
        invoiceBoxIds: selectedInvoices.value.map(inv => inv.id)
      }
    })

    emit('success', data.reimbursement.id)
  } catch (e: any) {
    error.value = e.data?.message || e.message || '创建报销单失败'
  } finally {
    creating.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}

const resetForm = () => {
  selectedInvoices.value = []
  title.value = ''
  description.value = ''
  companyId.value = ''
  titleError.value = ''
  error.value = ''
  showInvoiceSelector.value = false
}

function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>
