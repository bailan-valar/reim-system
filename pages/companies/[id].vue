<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div>
          <NuxtLink to="/companies" class="text-primary-600 hover:text-primary-700 text-sm font-medium mb-2 inline-block">
            ← 返回列表
          </NuxtLink>
          <div class="flex items-center justify-between">
            <h1 class="text-3xl font-bold text-gray-900">公司详情</h1>
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

      <div v-else-if="company" class="space-y-6">
        <!-- Company Info -->
        <UiCard>
          <div class="space-y-4">
            <div class="flex items-start gap-6">
              <!-- Logo -->
              <div class="flex-shrink-0 w-24 h-24 flex items-center justify-center">
                <img
                  v-if="company.logoUrl"
                  :src="company.logoUrl"
                  :alt="company.name"
                  class="max-w-24 max-h-24 rounded-lg object-contain"
                />
                <div v-else class="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>

              <!-- Company Name -->
              <div class="flex-1">
                <h2 class="text-2xl font-bold text-gray-900">{{ company.name }}</h2>
              </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
              <div>
                <p class="text-sm text-gray-600">报销单数量</p>
                <p class="text-2xl font-bold text-gray-900">{{ company._count?.reimbursements || 0 }} 个</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">总报销金额</p>
                <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(company.totalAmount || 0) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">创建时间</p>
                <p class="text-sm font-medium text-gray-900">{{ formatDateTime(company.createdAt) }}</p>
              </div>
            </div>

            <div class="flex gap-4 pt-4 border-t border-gray-200">
              <div>
                <p class="text-sm text-gray-600">更新时间</p>
                <p class="text-sm font-medium text-gray-900">{{ formatDateTime(company.updatedAt) }}</p>
              </div>
            </div>
          </div>
        </UiCard>

        <!-- Related Reimbursements -->
        <UiCard>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                关联的报销单 ({{ company.reimbursements?.length || 0 }})
              </h3>
              <UiButton @click="navigateTo(`/reimbursements/new?companyId=${company.id}`)">
                新增报销单
              </UiButton>
            </div>

            <div v-if="!company.reimbursements || company.reimbursements.length === 0" class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="mt-2 text-sm text-gray-600">暂无关联的报销单</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" @click="toggleSort('title')">
                      <div class="flex items-center gap-1">
                        标题
                        <span v-if="sortBy === 'title'" class="text-primary-600">
                          {{ sortOrder === 'asc' ? '↑' : '↓' }}
                        </span>
                      </div>
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" @click="toggleSort('type')">
                      <div class="flex items-center gap-1">
                        报销类型
                        <span v-if="sortBy === 'type'" class="text-primary-600">
                          {{ sortOrder === 'asc' ? '↑' : '↓' }}
                        </span>
                      </div>
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" @click="toggleSort('status')">
                      <div class="flex items-center gap-1">
                        状态
                        <span v-if="sortBy === 'status'" class="text-primary-600">
                          {{ sortOrder === 'asc' ? '↑' : '↓' }}
                        </span>
                      </div>
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" @click="toggleSort('totalAmount')">
                      <div class="flex items-center gap-1">
                        金额
                        <span v-if="sortBy === 'totalAmount'" class="text-primary-600">
                          {{ sortOrder === 'asc' ? '↑' : '↓' }}
                        </span>
                      </div>
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" @click="toggleSort('startDate')">
                      <div class="flex items-center gap-1">
                        报销时间
                        <span v-if="sortBy === 'startDate'" class="text-primary-600">
                          {{ sortOrder === 'asc' ? '↑' : '↓' }}
                        </span>
                      </div>
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" @click="toggleSort('createdAt')">
                      <div class="flex items-center gap-1">
                        创建时间
                        <span v-if="sortBy === 'createdAt'" class="text-primary-600">
                          {{ sortOrder === 'asc' ? '↑' : '↓' }}
                        </span>
                      </div>
                    </th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr
                    v-for="reimbursement in sortedReimbursements"
                    :key="reimbursement.id"
                    class="hover:bg-gray-50 transition-colors"
                  >
                    <td class="px-6 py-4 whitespace-nowrap cursor-pointer" @click="navigateTo(`/reimbursements/${reimbursement.id}`)">
                      <div class="text-sm font-medium text-gray-900">
                        {{ reimbursement.title }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap cursor-pointer" @click="navigateTo(`/reimbursements/${reimbursement.id}`)">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="getTypeClass(reimbursement.type)">
                        {{ reimbursement.type }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" @click.stop>
                      <ReimbursementStatusBadgeDropdown
                        :status="reimbursement.status"
                        :reimbursement-id="reimbursement.id"
                        @status-changed="handleStatusChanged"
                      />
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap cursor-pointer" @click="navigateTo(`/reimbursements/${reimbursement.id}`)">
                      <div class="text-sm font-semibold text-gray-900">
                        {{ formatCurrency(reimbursement.totalAmount) }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap cursor-pointer" @click="navigateTo(`/reimbursements/${reimbursement.id}`)">
                      <div class="text-sm text-gray-500">
                        {{ formatDate(reimbursement.startDate) }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap cursor-pointer" @click="navigateTo(`/reimbursements/${reimbursement.id}`)">
                      <div class="text-sm text-gray-500">
                        {{ formatDate(reimbursement.createdAt) }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium cursor-pointer" @click="navigateTo(`/reimbursements/${reimbursement.id}`)">
                      <span class="text-primary-600 hover:text-primary-900">
                        查看详情
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </UiCard>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-gray-600">公司不存在</p>
        <UiButton class="mt-4" @click="navigateTo('/companies')">
          返回列表
        </UiButton>
      </div>
    </main>

    <!-- Edit Modal -->
    <UiModal v-model="showEditModal" title="编辑公司">
      <CompanyForm
        :company="company"
        :loading="submitting"
        @submit="handleUpdate"
        @cancel="showEditModal = false"
      />
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { CompanyWithDetails, UpdateCompanyInput } from '~/types/company'
import type { Reimbursement } from '~/types/reimbursement'
import { formatCurrency, formatDateTime, formatDate } from '~/utils/formatters'

const route = useRoute()
const { fetchCompany, updateCompany, deleteCompany } = useCompanies()

const loading = ref(true)
const submitting = ref(false)
const company = ref<CompanyWithDetails | null>(null)
const showEditModal = ref(false)

// Sorting state
const sortBy = ref<'title' | 'type' | 'status' | 'totalAmount' | 'startDate' | 'createdAt'>('startDate')
const sortOrder = ref<'asc' | 'desc'>('desc')

const loadCompany = async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    const data = await fetchCompany(id)
    company.value = data
  } catch (error) {
    console.error('Failed to fetch company:', error)
    company.value = null
  } finally {
    loading.value = false
  }
}

const handleUpdate = async (input: UpdateCompanyInput) => {
  if (!company.value) return

  submitting.value = true
  try {
    await updateCompany(company.value.id, input)
    showEditModal.value = false
    await loadCompany()
  } catch (error: any) {
    console.error('Failed to update company:', error)
    alert(error.message || '更新公司失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  if (!company.value) return

  const reimbursementCount = company.value._count?.reimbursements || 0
  let confirmMessage = '确定要删除这个公司吗？'

  if (reimbursementCount > 0) {
    confirmMessage = `该公司有 ${reimbursementCount} 个关联的报销单。删除后，这些报销单将解除与该公司的关联。确定要继续吗？`
  }

  if (!confirm(confirmMessage)) return

  try {
    await deleteCompany(company.value.id)
    navigateTo('/companies')
  } catch (error: any) {
    console.error('Failed to delete company:', error)
    alert(error.message || '删除公司失败')
  }
}

const getStatusClass = (status: string) => {
  const statusClasses: Record<string, string> = {
    '待整理': 'bg-gray-100 text-gray-800',
    '待打印单据': 'bg-blue-100 text-blue-800',
    '待审批': 'bg-yellow-100 text-yellow-800',
    '待打款': 'bg-purple-100 text-purple-800',
    '已完成': 'bg-green-100 text-green-800',
  }
  return statusClasses[status] || 'bg-gray-100 text-gray-800'
}

const getTypeClass = (type: string) => {
  const typeClasses: Record<string, string> = {
    '现金报销': 'bg-indigo-100 text-indigo-800',
    '差旅费报销': 'bg-cyan-100 text-cyan-800',
  }
  return typeClasses[type] || 'bg-gray-100 text-gray-800'
}

// Format reimbursement period
const formatReimbursementPeriod = (startDate?: Date | string | null, endDate?: Date | string | null) => {
  if (!startDate && !endDate) {
    return '-'
  }

  const start = startDate ? formatDate(startDate) : ''
  const end = endDate ? formatDate(endDate) : ''

  if (start && end) {
    return `${start} ~ ${end}`
  }

  return start || end
}

// Sorting logic
const sortedReimbursements = computed(() => {
  if (!company.value?.reimbursements) return []

  const reimbursements = [...company.value.reimbursements]

  return reimbursements.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy.value) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'type':
        aValue = a.type
        bValue = b.type
        break
      case 'status':
        // 定义状态的排序优先级
        const statusOrder: Record<string, number> = {
          '待整理': 1,
          '待打印单据': 2,
          '待审批': 3,
          '待打款': 4,
          '已完成': 5,
        }
        aValue = statusOrder[a.status] || 999
        bValue = statusOrder[b.status] || 999
        break
      case 'totalAmount':
        aValue = a.totalAmount
        bValue = b.totalAmount
        break
      case 'startDate':
        aValue = a.startDate ? new Date(a.startDate).getTime() : 0
        bValue = b.startDate ? new Date(b.startDate).getTime() : 0
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

// Toggle sort
const toggleSort = (field: 'title' | 'type' | 'status' | 'totalAmount' | 'startDate' | 'createdAt') => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'desc'
  }
}

// Handle status change
const handleStatusChanged = async () => {
  await loadCompany()
}

onMounted(() => {
  loadCompany()
})
</script>
