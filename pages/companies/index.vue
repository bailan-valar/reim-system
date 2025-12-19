<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <NuxtLink to="/" class="text-primary-600 hover:text-primary-700 text-sm font-medium mb-2 inline-block">
              ← 返回首页
            </NuxtLink>
            <h1 class="text-3xl font-bold text-gray-900">公司管理</h1>
          </div>
          <UiButton @click="showCreateModal = true">
            创建公司
          </UiButton>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CompanyList
        :companies="companies"
        :loading="loading"
        @create="showCreateModal = true"
      />
    </main>

    <!-- Create Modal -->
    <UiModal v-model="showCreateModal" title="创建公司">
      <CompanyForm
        :loading="submitting"
        @submit="handleCreate"
        @cancel="showCreateModal = false"
      />
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { Company, CreateCompanyInput } from '~/types/company'

const { fetchCompanies, createCompany } = useCompanies()

const loading = ref(true)
const submitting = ref(false)
const companies = ref<(Company & { _count?: { reimbursements: number } })[]>([])
const showCreateModal = ref(false)

const loadCompanies = async () => {
  loading.value = true
  try {
    const data = await fetchCompanies()
    companies.value = data || []
  } catch (error) {
    console.error('Failed to fetch companies:', error)
  } finally {
    loading.value = false
  }
}

const handleCreate = async (input: CreateCompanyInput) => {
  submitting.value = true
  try {
    await createCompany(input)
    showCreateModal.value = false
    await loadCompanies()
  } catch (error: any) {
    console.error('Failed to create company:', error)
    alert(error.message || '创建公司失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCompanies()
})

// 当页面从 keepalive 缓存中激活时重新加载数据
onActivated(() => {
  loadCompanies()
})
</script>
