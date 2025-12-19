<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold">从发票箱选择发票</h2>
            <p class="text-sm text-gray-500 mt-1">
              选择一张未使用的发票关联到此费用项目
              <span v-if="expenseAmount" class="font-medium text-blue-600">（费用金额: ¥{{ formatAmount(expenseAmount) }}）</span>
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Search and Filter -->
        <div class="mt-4 space-y-3">
          <div class="flex gap-4">
            <div class="flex-1 relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索发票号码、购买方、金额（如：100 或 100-200）..."
                class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="清除搜索"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <select
              v-model="selectedType"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部类型</option>
              <option value="增值税专用发票">增值税专用发票</option>
              <option value="增值税普通发票">增值税普通发票</option>
              <option value="增值税电子普通发票">增值税电子普通发票</option>
              <option value="增值税电子专用发票">增值税电子专用发票</option>
              <option value="其他">其他</option>
            </select>
            <select
              v-model="selectedBuyer"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
            >
              <option value="">全部购买方</option>
              <option v-for="buyer in buyerList" :key="buyer" :value="buyer">
                {{ buyer }}
              </option>
            </select>
            <button
              @click="showUploadModal = true"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              上传发票
            </button>
          </div>
        </div>
      </div>

      <!-- Invoice List -->
      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="text-gray-500">加载中...</div>
        </div>

        <div v-else-if="error" class="flex justify-center items-center h-64">
          <div class="text-red-500">{{ error }}</div>
        </div>

        <div v-else-if="filteredInvoices.length === 0" class="flex flex-col justify-center items-center h-64">
          <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p class="text-gray-500">暂无可用发票</p>
          <p class="text-sm text-gray-400 mt-2">请先在发票箱中添加发票</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="invoice in filteredInvoices"
            :key="invoice.id"
            @click="selectInvoice(invoice)"
            class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500"
            :class="selectedInvoice?.id === invoice.id ? 'border-blue-500 bg-blue-50' : 'border-transparent'"
          >
            <!-- Status badge -->
            <div class="flex justify-between items-start mb-3">
              <span class="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                {{ invoice.status }}
              </span>
              <button
                @click.stop="viewInvoice(invoice)"
                class="text-blue-600 hover:text-blue-700 text-sm"
                title="查看详情"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>

            <!-- Invoice info -->
            <div class="space-y-2">
              <div>
                <p class="text-xs text-gray-500">发票号码</p>
                <p class="font-medium text-gray-900 truncate">{{ invoice.invoiceNumber }}</p>
              </div>

              <div>
                <p class="text-xs text-gray-500">发票类型</p>
                <p class="text-sm text-gray-700">{{ invoice.invoiceType }}</p>
              </div>

              <div class="flex justify-between items-center">
                <div>
                  <p class="text-xs text-gray-500">票面总额</p>
                  <p class="text-lg font-bold text-blue-600">¥{{ formatAmount(invoice.totalAmount) }}</p>
                </div>
                <div v-if="invoice.taxRate" class="text-right">
                  <p class="text-xs text-gray-500">税率</p>
                  <p class="text-sm text-gray-700">{{ invoice.taxRate }}%</p>
                </div>
              </div>

              <div>
                <p class="text-xs text-gray-500">开票日期</p>
                <p class="text-sm text-gray-700">{{ formatDate(invoice.invoiceDate) }}</p>
              </div>

              <div v-if="invoice.buyerName">
                <p class="text-xs text-gray-500">购买方</p>
                <p class="text-sm text-gray-700 truncate" :title="invoice.buyerName">{{ invoice.buyerName }}</p>
              </div>

              <div v-if="invoice.remark">
                <p class="text-xs text-gray-500">备注</p>
                <p class="text-sm text-gray-700 line-clamp-2" :title="invoice.remark">{{ invoice.remark }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="p-6 border-t bg-gray-50">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600">
            <span v-if="selectedInvoice">已选择: {{ selectedInvoice.invoiceNumber }}</span>
            <span v-else>请选择一张发票</span>
          </div>
          <div class="flex gap-3">
            <button
              @click="$emit('close')"
              class="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
            >
              取消
            </button>
            <button
              @click="confirmSelection"
              :disabled="!selectedInvoice"
              class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- View Invoice Modal -->
    <InvoiceBoxViewModal
      v-if="viewingInvoice"
      :invoice="viewingInvoice"
      @close="viewingInvoice = null"
      @unlinked="handleUnlinked"
      @deleted="handleDeleted"
    />

    <!-- Upload Invoice Modal -->
    <InvoiceBoxUploadModal
      v-if="showUploadModal"
      @close="showUploadModal = false"
      @uploaded="handleUploadSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import type { InvoiceBox } from '~/types/invoiceBox'

const props = defineProps<{
  expenseAmount?: number
}>()

const emit = defineEmits<{
  close: []
  select: [invoice: InvoiceBox]
}>()

const { fetchInvoiceBoxList } = useInvoiceBox()

const loading = ref(false)
const error = ref<string | null>(null)
const invoices = ref<InvoiceBox[]>([])
const selectedInvoice = ref<InvoiceBox | null>(null)
const viewingInvoice = ref<InvoiceBox | null>(null)
const showUploadModal = ref(false)
const searchQuery = ref('')
const selectedType = ref('')
const selectedBuyer = ref('')
const amountFilterEnabled = ref(false)
const amountTolerance = ref(0.05) // Default 5% tolerance

// Load invoices on mount
onMounted(async () => {
  // Set default search query to expense amount if provided
  if (props.expenseAmount) {
    searchQuery.value = props.expenseAmount.toString()
  }
  await loadInvoices()
})

async function loadInvoices() {
  loading.value = true
  error.value = null
  try {
    invoices.value = await fetchInvoiceBoxList('未使用')
  } catch (e: any) {
    error.value = e.message || '加载发票列表失败'
  } finally {
    loading.value = false
  }
}

// Get unique buyer list from invoices
const buyerList = computed(() => {
  const buyers = invoices.value
    .map(invoice => invoice.buyerName)
    .filter((buyer): buyer is string => !!buyer)
  return [...new Set(buyers)].sort()
})

// Calculate amount range based on tolerance
const minAmount = computed(() => {
  if (!props.expenseAmount || !amountFilterEnabled.value) return 0
  return props.expenseAmount * (1 - amountTolerance.value)
})

const maxAmount = computed(() => {
  if (!props.expenseAmount || !amountFilterEnabled.value) return 0
  return props.expenseAmount * (1 + amountTolerance.value)
})

// Parse amount from search query
const parseAmountQuery = (query: string) => {
  // Match patterns like: "100", "100-200", "100~200", ">100", "<100", ">=100", "<=100"
  const rangeMatch = query.match(/^(\d+(?:\.\d+)?)\s*[-~]\s*(\d+(?:\.\d+)?)$/)
  const gtMatch = query.match(/^>\s*(\d+(?:\.\d+)?)$/)
  const gteMatch = query.match(/^>=\s*(\d+(?:\.\d+)?)$/)
  const ltMatch = query.match(/^<\s*(\d+(?:\.\d+)?)$/)
  const lteMatch = query.match(/^<=\s*(\d+(?:\.\d+)?)$/)
  const exactMatch = query.match(/^(\d+(?:\.\d+)?)$/)

  if (rangeMatch) {
    return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]), type: 'range' }
  } else if (gtMatch) {
    return { min: parseFloat(gtMatch[1]), max: Infinity, type: 'gt' }
  } else if (gteMatch) {
    return { min: parseFloat(gteMatch[1]), max: Infinity, type: 'gte' }
  } else if (ltMatch) {
    return { min: 0, max: parseFloat(ltMatch[1]), type: 'lt' }
  } else if (lteMatch) {
    return { min: 0, max: parseFloat(lteMatch[1]), type: 'lte' }
  } else if (exactMatch) {
    const amount = parseFloat(exactMatch[1])
    // For exact match, use a small tolerance (±1%)
    return { min: amount * 0.99, max: amount * 1.01, type: 'exact' }
  }
  return null
}

const filteredInvoices = computed(() => {
  let result = invoices.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.trim()
    const amountQuery = parseAmountQuery(query)

    if (amountQuery) {
      // If search query is an amount pattern, filter by amount
      result = result.filter(invoice => {
        if (amountQuery.type === 'gt') {
          return invoice.totalAmount > amountQuery.min
        } else if (amountQuery.type === 'lt') {
          return invoice.totalAmount < amountQuery.max
        } else {
          return invoice.totalAmount >= amountQuery.min && invoice.totalAmount <= amountQuery.max
        }
      })
    } else {
      // Otherwise, filter by text search
      const queryLower = query.toLowerCase()
      result = result.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(queryLower) ||
        invoice.buyerName?.toLowerCase().includes(queryLower) ||
        invoice.remark?.toLowerCase().includes(queryLower)
      )
    }
  }

  // Filter by type
  if (selectedType.value) {
    result = result.filter(invoice => invoice.invoiceType === selectedType.value)
  }

  // Filter by buyer
  if (selectedBuyer.value) {
    result = result.filter(invoice => invoice.buyerName === selectedBuyer.value)
  }

  // Filter by amount (when checkbox is enabled)
  if (props.expenseAmount && amountFilterEnabled.value) {
    result = result.filter(invoice => {
      return invoice.totalAmount >= minAmount.value && invoice.totalAmount <= maxAmount.value
    })
  }

  return result
})

function selectInvoice(invoice: InvoiceBox) {
  selectedInvoice.value = invoice
}

function viewInvoice(invoice: InvoiceBox) {
  viewingInvoice.value = invoice
}

function confirmSelection() {
  if (selectedInvoice.value) {
    emit('select', selectedInvoice.value)
  }
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

async function handleUploadSuccess(uploadedInvoiceIds?: string[]) {
  showUploadModal.value = false
  await loadInvoices()

  // Auto-select the first uploaded invoice
  if (uploadedInvoiceIds && uploadedInvoiceIds.length > 0) {
    const firstUploadedId = uploadedInvoiceIds[0]
    const uploadedInvoice = invoices.value.find(inv => inv.id === firstUploadedId)
    if (uploadedInvoice) {
      selectedInvoice.value = uploadedInvoice
    }
  }
}

async function handleUnlinked() {
  viewingInvoice.value = null
  await loadInvoices()
}

async function handleDeleted() {
  viewingInvoice.value = null
  await loadInvoices()
}
</script>
