<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div>
          <NuxtLink to="/reimbursements" class="text-primary-600 hover:text-primary-700 text-sm font-medium mb-2 inline-block">
            ← 返回列表
          </NuxtLink>
          <div class="flex items-center justify-between">
            <h1 class="text-3xl font-bold text-gray-900">报销单详情</h1>
            <div class="flex gap-3">
              <UiButton variant="secondary" @click="showEditModal = true">
                编辑
              </UiButton>
              <UiButton variant="danger" @click="handleDelete">
                删除
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-gray-600">加载中...</p>
      </div>

      <div v-else-if="reimbursement" class="space-y-6">
        <!-- Reimbursement Info -->
        <UiCard>
          <div class="space-y-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h2 class="text-2xl font-bold text-gray-900">{{ reimbursement.title }}</h2>
                <p v-if="reimbursement.description" class="mt-2 text-gray-600">
                  {{ reimbursement.description }}
                </p>
              </div>
              <ReimbursementStatusBadge :status="reimbursement.status" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
              <div>
                <p class="text-sm text-gray-600">总金额</p>
                <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(reimbursement.totalAmount) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">费用项目</p>
                <p class="text-2xl font-bold text-gray-900">{{ reimbursement.items?.length || 0 }} 项</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">发票状态</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ invoiceCount }}/{{ reimbursement.items?.length || 0 }}
                </p>
              </div>
            </div>

            <!-- Date Range and Company Section -->
            <div v-if="reimbursement.startDate || reimbursement.endDate || reimbursement.company" class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
              <div v-if="reimbursement.startDate || reimbursement.endDate">
                <p class="text-sm text-gray-600">报销期间</p>
                <p class="text-sm font-medium text-gray-900">
                  <span v-if="reimbursement.startDate">{{ formatDate(reimbursement.startDate) }}</span>
                  <span v-if="reimbursement.startDate && reimbursement.endDate"> 至 </span>
                  <span v-if="reimbursement.endDate">{{ formatDate(reimbursement.endDate) }}</span>
                </p>
              </div>

              <div v-if="reimbursement.company">
                <p class="text-sm text-gray-600">所属公司</p>
                <p class="text-sm font-medium text-gray-900">{{ reimbursement.company.name }}</p>
              </div>
            </div>

            <div class="flex gap-4 pt-4 border-t border-gray-200">
              <div>
                <p class="text-sm text-gray-600">创建时间</p>
                <p class="text-sm font-medium text-gray-900">{{ formatDateTime(reimbursement.createdAt) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">更新时间</p>
                <p class="text-sm font-medium text-gray-900">{{ formatDateTime(reimbursement.updatedAt) }}</p>
              </div>
            </div>
          </div>
        </UiCard>

        <!-- Expense Items -->
        <ExpenseItemList
          :items="reimbursement.items || []"
          @add="showAddItemModal = true"
          @edit="handleEditItem"
          @delete="handleDeleteItem"
          @upload-invoice="handleUploadInvoice"
          @delete-invoice="handleDeleteInvoice"
        />
      </div>

      <div v-else class="text-center py-12">
        <p class="text-gray-600">报销单不存在</p>
      </div>
    </main>

    <!-- Edit Reimbursement Modal -->
    <UiModal v-model="showEditModal" title="编辑报销单">
      <ReimbursementForm
        :reimbursement="reimbursement"
        :loading="updating"
        @submit="handleUpdate"
        @cancel="showEditModal = false"
      />
    </UiModal>

    <!-- Add/Edit Expense Item Modal -->
    <UiModal v-model="showAddItemModal" :title="editingItem ? '编辑费用项目' : '添加费用项目'">
      <ExpenseItemForm
        :item="editingItem"
        :loading="itemLoading"
        @submit="handleSaveItem"
        @cancel="closeItemModal"
      />
    </UiModal>

    <!-- Upload Invoice Modal -->
    <UiModal v-model="showUploadModal" title="上传发票">
      <ExpenseInvoiceUpload
        v-if="uploadingItem"
        :item-id="uploadingItem.id"
        @success="handleUploadSuccess"
        @cancel="showUploadModal = false"
      />
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { Reimbursement, UpdateReimbursementInput } from '~/types/reimbursement'
import type { ExpenseItem, CreateExpenseItemInput } from '~/types/expenseItem'
import { formatCurrency, formatDateTime, formatDate } from '~/utils/formatters'

const route = useRoute()
const id = route.params.id as string

const { fetchReimbursement, updateReimbursement, deleteReimbursement } = useReimbursements()
const { createExpenseItem, updateExpenseItem, deleteExpenseItem } = useExpenseItems()
const { deleteInvoice } = useFileUpload()

const loading = ref(true)
const updating = ref(false)
const itemLoading = ref(false)
const reimbursement = ref<Reimbursement | null>(null)

const showEditModal = ref(false)
const showAddItemModal = ref(false)
const showUploadModal = ref(false)
const editingItem = ref<ExpenseItem | null>(null)
const uploadingItem = ref<ExpenseItem | null>(null)

const invoiceCount = computed(() => {
  return reimbursement.value?.items?.filter(item => item.hasInvoice).length || 0
})

const loadReimbursement = async () => {
  loading.value = true
  try {
    const data = await fetchReimbursement(id)
    reimbursement.value = data || null
  } catch (error) {
    console.error('Failed to fetch reimbursement:', error)
  } finally {
    loading.value = false
  }
}

const handleUpdate = async (data: UpdateReimbursementInput) => {
  updating.value = true
  try {
    await updateReimbursement(id, data)
    await loadReimbursement()
    showEditModal.value = false
  } catch (error: any) {
    alert(error.message || '更新报销单失败')
  } finally {
    updating.value = false
  }
}

const handleDelete = async () => {
  if (!confirm('确定要删除此报销单吗？此操作不可恢复。')) return

  try {
    await deleteReimbursement(id)
    navigateTo('/reimbursements')
  } catch (error: any) {
    alert(error.message || '删除报销单失败')
  }
}

const handleEditItem = (item: ExpenseItem) => {
  editingItem.value = item
  showAddItemModal.value = true
}

const handleSaveItem = async (data: CreateExpenseItemInput) => {
  itemLoading.value = true
  try {
    if (editingItem.value) {
      await updateExpenseItem(id, editingItem.value.id, data)
    } else {
      await createExpenseItem(id, data)
    }
    await loadReimbursement()
    closeItemModal()
  } catch (error: any) {
    alert(error.message || '保存费用项目失败')
  } finally {
    itemLoading.value = false
  }
}

const handleDeleteItem = async (item: ExpenseItem) => {
  if (!confirm('确定要删除此费用项目吗？')) return

  try {
    await deleteExpenseItem(id, item.id)
    await loadReimbursement()
  } catch (error: any) {
    alert(error.message || '删除费用项目失败')
  }
}

const handleUploadInvoice = (item: ExpenseItem) => {
  uploadingItem.value = item
  showUploadModal.value = true
}

const handleUploadSuccess = async () => {
  showUploadModal.value = false
  uploadingItem.value = null
  await loadReimbursement()
}

const handleDeleteInvoice = async (item: ExpenseItem) => {
  if (!confirm('确定要删除此发票吗？')) return

  try {
    if (item.invoiceFileName) {
      await deleteInvoice(item.invoiceFileName, item.id)
      await loadReimbursement()
    }
  } catch (error: any) {
    alert(error.message || '删除发票失败')
  }
}

const closeItemModal = () => {
  showAddItemModal.value = false
  editingItem.value = null
}

onMounted(() => {
  loadReimbursement()
})
</script>
