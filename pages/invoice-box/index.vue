<template>
  <div class="container mx-auto p-6">
    <NuxtLink to="/" class="text-primary-600 hover:text-primary-700 text-sm font-medium mb-2 inline-block">
      ← 返回首页
    </NuxtLink>
    <div class="mb-6 flex justify-between items-center">
      <div class="flex items-center gap-4">
        <h1 class="text-3xl font-bold">发票收集箱</h1>
        <div v-if="selectedInvoiceIds.size > 0" class="flex items-center gap-2">
          <span class="text-sm text-gray-600">
            已选择 <span class="font-semibold text-blue-600">{{ selectedInvoiceIds.size }}</span> 项
          </span>
          <button
            @click="clearSelection"
            class="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            取消选择
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="selectedInvoiceIds.size > 0"
          @click="showBatchTagModal = true"
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span>批量标签</span>
        </button>
        <button
          v-if="selectedInvoiceIds.size > 0"
          @click="handleBatchDelete"
          class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>批量删除</span>
        </button>
        <button
          @click="showUploadModal = true"
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>+</span>
          <span>上传发票</span>
        </button>
      </div>
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

    <!-- Filter section -->
    <div class="mb-6 bg-white rounded-lg shadow p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Text search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
          <input
            v-model="filters.searchText"
            type="text"
            placeholder="发票号码、购买方、备注..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Amount range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">金额范围</label>
          <div class="flex gap-2 items-center">
            <input
              v-model.number="filters.minAmount"
              type="number"
              placeholder="最小"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span class="text-gray-500">-</span>
            <input
              v-model.number="filters.maxAmount"
              type="number"
              placeholder="最大"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- Tag filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">标签</label>
          <select
            v-model="filters.selectedTag"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部标签</option>
            <option v-for="tag in availableTags" :key="tag" :value="tag">
              {{ tag }}
            </option>
          </select>
        </div>

        <!-- Clear filters button -->
        <div class="flex items-end">
          <button
            @click="clearFilters"
            class="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            清除筛选
          </button>
        </div>
      </div>

      <!-- Active filters display -->
      <div v-if="hasActiveFilters" class="mt-3 flex flex-wrap gap-2">
        <span class="text-sm text-gray-600">当前筛选:</span>
        <span
          v-if="filters.searchText"
          class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"
        >
          搜索: {{ filters.searchText }}
          <button @click="filters.searchText = ''" class="hover:text-blue-900">×</button>
        </span>
        <span
          v-if="filters.minAmount !== null"
          class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"
        >
          最小金额: ¥{{ filters.minAmount }}
          <button @click="filters.minAmount = null" class="hover:text-blue-900">×</button>
        </span>
        <span
          v-if="filters.maxAmount !== null"
          class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"
        >
          最大金额: ¥{{ filters.maxAmount }}
          <button @click="filters.maxAmount = null" class="hover:text-blue-900">×</button>
        </span>
        <span
          v-if="filters.selectedTag"
          class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"
        >
          标签: {{ filters.selectedTag }}
          <button @click="filters.selectedTag = ''" class="hover:text-blue-900">×</button>
        </span>
      </div>
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

    <!-- Invoice table -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  :disabled="filteredInvoices.length === 0"
                />
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                发票号码
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                发票类型
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                开票日期
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                购买方
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                标签
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                票面总额
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                税额
              </th>
              <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="invoice in filteredInvoices"
              :key="invoice.id"
              :class="[
                'transition-colors',
                selectedInvoiceIds.has(invoice.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
              ]"
            >
              <td class="px-4 py-4 text-center">
                <input
                  type="checkbox"
                  :checked="selectedInvoiceIds.has(invoice.id)"
                  @change="toggleSelectInvoice(invoice.id)"
                  :disabled="invoice.status === '已使用'"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-1 rounded text-xs font-medium',
                    invoice.status === '未使用'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ invoice.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ invoice.invoiceNumber }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ invoice.invoiceType }}</div>
                <div v-if="invoice.taxRate" class="text-xs text-gray-500">税率: {{ invoice.taxRate }}%</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(invoice.invoiceDate) }}
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate" :title="invoice.buyerName || '-'">
                  {{ invoice.buyerName || '-' }}
                </div>
                <div v-if="invoice.remark" class="text-xs text-gray-500 max-w-xs truncate" :title="invoice.remark">
                  {{ invoice.remark }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div v-if="invoice.tags" class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in parseTags(invoice.tags)"
                    :key="tag"
                    class="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                  >
                    {{ tag }}
                  </span>
                </div>
                <span v-else class="text-sm text-gray-400">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="text-sm font-semibold text-blue-600">¥{{ formatAmount(invoice.totalAmount) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="text-sm text-gray-900">
                  {{ invoice.taxAmount ? '¥' + formatAmount(invoice.taxAmount) : '-' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="handleView(invoice)"
                    class="text-blue-600 hover:text-blue-700"
                    title="查看"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    v-if="invoice.status === '未使用'"
                    @click="handleEdit(invoice)"
                    class="text-gray-600 hover:text-gray-700"
                    title="编辑"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    v-if="invoice.status === '未使用'"
                    @click="handleDelete(invoice)"
                    class="text-red-600 hover:text-red-700"
                    title="删除"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
      @unlinked="handleUnlinked"
      @deleted="handleDeleted"
    />

    <!-- Batch Tag Modal -->
    <div
      v-if="showBatchTagModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showBatchTagModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">批量标签管理</h3>
            <button
              @click="showBatchTagModal = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-4">
              已选择 <span class="font-semibold text-blue-600">{{ selectedInvoiceIds.size }}</span> 张发票
            </p>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                标签内容
              </label>
              <input
                v-model="batchTagInput"
                type="text"
                placeholder="请输入标签，多个标签用逗号分隔（如：差旅,北京,项目A）"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                更新模式
              </label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="batchTagMode"
                    type="radio"
                    value="add"
                    class="mr-2"
                  />
                  <span class="text-sm">添加标签（保留原有标签，添加新标签）</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="batchTagMode"
                    type="radio"
                    value="replace"
                    class="mr-2"
                  />
                  <span class="text-sm">替换标签（删除原有标签，使用新标签）</span>
                </label>
              </div>
            </div>

            <div v-if="availableTags.length > 0" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                常用标签（点击快速添加）
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in availableTags"
                  :key="tag"
                  @click="addQuickTag(tag)"
                  class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded hover:bg-blue-100 transition-colors"
                >
                  {{ tag }}
                </button>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button
              @click="showBatchTagModal = false"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              取消
            </button>
            <button
              @click="handleBatchUpdateTags"
              :disabled="!batchTagInput.trim()"
              class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
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

// Multi-select state
const selectedInvoiceIds = ref<Set<string>>(new Set())

// Batch tag state
const showBatchTagModal = ref(false)
const batchTagInput = ref('')
const batchTagMode = ref<'add' | 'replace'>('add')

// Filter state
const filters = ref({
  searchText: '',
  minAmount: null as number | null,
  maxAmount: null as number | null,
  selectedTag: ''
})

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

// Get all unique tags from invoices
const availableTags = computed(() => {
  const tagSet = new Set<string>()
  invoices.value.forEach(invoice => {
    if (invoice.tags) {
      parseTags(invoice.tags).forEach(tag => tagSet.add(tag))
    }
  })
  return Array.from(tagSet).sort()
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return filters.value.searchText !== '' ||
    filters.value.minAmount !== null ||
    filters.value.maxAmount !== null ||
    filters.value.selectedTag !== ''
})

// Apply all filters
const filteredInvoices = computed(() => {
  let result = invoices.value

  // Filter by status tab
  if (currentTab.value !== 'all') {
    result = result.filter(i => i.status === currentTab.value)
  }

  // Filter by search text (invoice number, buyer name, remark)
  if (filters.value.searchText) {
    const searchLower = filters.value.searchText.toLowerCase()
    result = result.filter(invoice => {
      return (
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        (invoice.buyerName && invoice.buyerName.toLowerCase().includes(searchLower)) ||
        (invoice.remark && invoice.remark.toLowerCase().includes(searchLower))
      )
    })
  }

  // Filter by amount range
  if (filters.value.minAmount !== null) {
    result = result.filter(invoice => invoice.totalAmount >= filters.value.minAmount!)
  }
  if (filters.value.maxAmount !== null) {
    result = result.filter(invoice => invoice.totalAmount <= filters.value.maxAmount!)
  }

  // Filter by tag
  if (filters.value.selectedTag) {
    result = result.filter(invoice => {
      if (!invoice.tags) return false
      const tags = parseTags(invoice.tags)
      return tags.includes(filters.value.selectedTag)
    })
  }

  return result
})

// Multi-select computed properties
const selectableInvoices = computed(() => {
  return filteredInvoices.value.filter(invoice => invoice.status === '未使用')
})

const isAllSelected = computed(() => {
  if (selectableInvoices.value.length === 0) return false
  return selectableInvoices.value.every(invoice => selectedInvoiceIds.value.has(invoice.id))
})

// Clear all filters
function clearFilters() {
  filters.value = {
    searchText: '',
    minAmount: null,
    maxAmount: null,
    selectedTag: ''
  }
}

// Multi-select functions
function toggleSelectAll() {
  if (isAllSelected.value) {
    // Deselect all
    selectableInvoices.value.forEach(invoice => {
      selectedInvoiceIds.value.delete(invoice.id)
    })
  } else {
    // Select all selectable invoices
    selectableInvoices.value.forEach(invoice => {
      selectedInvoiceIds.value.add(invoice.id)
    })
  }
}

function toggleSelectInvoice(invoiceId: string) {
  if (selectedInvoiceIds.value.has(invoiceId)) {
    selectedInvoiceIds.value.delete(invoiceId)
  } else {
    selectedInvoiceIds.value.add(invoiceId)
  }
}

function clearSelection() {
  selectedInvoiceIds.value.clear()
}

async function handleBatchDelete() {
  const count = selectedInvoiceIds.value.size
  if (!confirm(`确定要删除选中的 ${count} 张发票吗？`)) {
    return
  }

  try {
    const deletePromises = Array.from(selectedInvoiceIds.value).map(id =>
      $fetch(`/api/invoice-box/${id}`, { method: 'DELETE' })
    )

    await Promise.all(deletePromises)
    clearSelection()
    await fetchInvoices()
  } catch (error: any) {
    console.error('Failed to batch delete invoices:', error)
    alert(error.data?.message || '批量删除发票失败')
  }
}

async function handleBatchUpdateTags() {
  const count = selectedInvoiceIds.value.size
  const tags = batchTagInput.value.trim()

  if (!tags) {
    alert('请输入标签内容')
    return
  }

  try {
    const response = await $fetch('/api/invoice-box/batch-update-tags', {
      method: 'POST',
      body: {
        invoiceIds: Array.from(selectedInvoiceIds.value),
        tags,
        mode: batchTagMode.value
      }
    })

    alert(response.message || '批量更新标签成功')
    showBatchTagModal.value = false
    batchTagInput.value = ''
    batchTagMode.value = 'add'
    clearSelection()
    await fetchInvoices()
  } catch (error: any) {
    console.error('Failed to batch update tags:', error)
    alert(error.data?.message || '批量更新标签失败')
  }
}

function addQuickTag(tag: string) {
  const currentTags = batchTagInput.value
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)

  if (!currentTags.includes(tag)) {
    if (currentTags.length > 0) {
      batchTagInput.value = [...currentTags, tag].join(',')
    } else {
      batchTagInput.value = tag
    }
  }
}

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

function handleUnlinked() {
  showViewModal.value = false
  fetchInvoices()
}

function handleDeleted() {
  showViewModal.value = false
  fetchInvoices()
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

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return []
  return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
}

onMounted(() => {
  fetchInvoices()
})
</script>
