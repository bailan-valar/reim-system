<template>
  <div class="container mx-auto p-6">
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-3xl font-bold">发票收集箱</h1>
      <button
        @click="showUploadModal = true"
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <span>+</span>
        <span>上传发票</span>
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="mb-6 flex gap-4 border-b">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="currentTab = tab.value"
        :class="[
          'px-4 py-2 font-medium transition-colors',
          currentTab === tab.value
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        ]"
      >
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="ml-2 text-sm">
          ({{ tab.count }})
        </span>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredInvoices.length === 0" class="text-center py-12">
      <p class="text-gray-500 text-lg">暂无发票</p>
      <button
        @click="showUploadModal = true"
        class="mt-4 text-blue-600 hover:text-blue-700"
      >
        点击上传第一张发票
      </button>
    </div>

    <!-- Invoice list -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <InvoiceBoxCard
        v-for="invoice in filteredInvoices"
        :key="invoice.id"
        :invoice="invoice"
        @edit="handleEdit"
        @delete="handleDelete"
        @view="handleView"
      />
    </div>

    <!-- Upload Modal -->
    <InvoiceBoxUploadModal
      v-if="showUploadModal"
      @close="showUploadModal = false"
      @uploaded="handleUploaded"
    />

    <!-- Edit Modal -->
    <InvoiceBoxEditModal
      v-if="showEditModal && selectedInvoice"
      :invoice="selectedInvoice"
      @close="showEditModal = false"
      @updated="handleUpdated"
    />

    <!-- View Modal -->
    <InvoiceBoxViewModal
      v-if="showViewModal && selectedInvoice"
      :invoice="selectedInvoice"
      @close="showViewModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { InvoiceBox } from '~/types/invoiceBox'

definePageMeta({
  title: '发票收集箱'
})

const showUploadModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const selectedInvoice = ref<InvoiceBox | null>(null)
const currentTab = ref<string>('all')
const loading = ref(true)
const invoices = ref<InvoiceBox[]>([])

const tabs = computed(() => [
  {
    label: '全部',
    value: 'all',
    count: invoices.value.length
  },
  {
    label: '未使用',
    value: '未使用',
    count: invoices.value.filter(i => i.status === '未使用').length
  },
  {
    label: '已使用',
    value: '已使用',
    count: invoices.value.filter(i => i.status === '已使用').length
  }
])

const filteredInvoices = computed(() => {
  if (currentTab.value === 'all') {
    return invoices.value
  }
  return invoices.value.filter(i => i.status === currentTab.value)
})

async function fetchInvoices() {
  try {
    loading.value = true
    const response = await $fetch('/api/invoice-box')
    invoices.value = response.data
  } catch (error) {
    console.error('Failed to fetch invoices:', error)
    alert('获取发票列表失败')
  } finally {
    loading.value = false
  }
}

function handleEdit(invoice: InvoiceBox) {
  selectedInvoice.value = invoice
  showEditModal.value = true
}

async function handleDelete(invoice: InvoiceBox) {
  if (!confirm(`确定要删除发票 ${invoice.invoiceNumber} 吗？`)) {
    return
  }

  try {
    await $fetch(`/api/invoice-box/${invoice.id}`, {
      method: 'DELETE'
    })
    await fetchInvoices()
  } catch (error: any) {
    console.error('Failed to delete invoice:', error)
    alert(error.data?.message || '删除发票失败')
  }
}

function handleView(invoice: InvoiceBox) {
  selectedInvoice.value = invoice
  showViewModal.value = true
}

function handleUploaded() {
  showUploadModal.value = false
  fetchInvoices()
}

function handleUpdated() {
  showEditModal.value = false
  fetchInvoices()
}

onMounted(() => {
  fetchInvoices()
})
</script>
