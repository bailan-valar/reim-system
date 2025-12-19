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
            </div>

            <div v-if="!company.reimbursements || company.reimbursements.length === 0" class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="mt-2 text-sm text-gray-600">暂无关联的报销单</p>
            </div>

            <div v-else class="divide-y divide-gray-200">
              <div
                v-for="reimbursement in company.reimbursements"
                :key="reimbursement.id"
                class="py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                @click="navigateTo(`/reimbursements/${reimbursement.id}`)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-medium text-gray-900 truncate">
                      {{ reimbursement.title }}
                    </h4>
                    <p class="mt-1 text-sm text-gray-500">
                      {{ formatDate(reimbursement.createdAt) }}
                    </p>
                  </div>
                  <div class="flex items-center gap-4 ml-4">
                    <span class="text-sm font-semibold text-gray-900">
                      {{ formatCurrency(reimbursement.totalAmount) }}
                    </span>
                    <span class="text-sm text-primary-600 font-medium">
                      查看 →
                    </span>
                  </div>
                </div>
              </div>
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
import { formatCurrency, formatDateTime, formatDate } from '~/utils/formatters'

const route = useRoute()
const { fetchCompany, updateCompany, deleteCompany } = useCompanies()

const loading = ref(true)
const submitting = ref(false)
const company = ref<CompanyWithDetails | null>(null)
const showEditModal = ref(false)

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

onMounted(() => {
  loadCompany()
})
</script>
