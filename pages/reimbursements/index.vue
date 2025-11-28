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
            <h1 class="text-3xl font-bold text-gray-900">报销单列表</h1>
          </div>
          <div class="flex gap-3">
            <UiButton
              variant="secondary"
              @click="showCreateFromInvoicesModal = true"
            >
              从发票创建
            </UiButton>
            <UiButton @click="navigateTo('/reimbursements/new')">
              创建报销单
            </UiButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ReimbursementList
        :reimbursements="reimbursements"
        :loading="loading"
        @filter="handleFilter"
      />
    </main>

    <!-- Create from Invoices Modal -->
    <ReimbursementCreateFromInvoicesModal
      v-model="showCreateFromInvoicesModal"
      @success="handleCreateSuccess"
      @cancel="showCreateFromInvoicesModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { Reimbursement } from '~/types/reimbursement'

const { fetchReimbursements } = useReimbursements()

const loading = ref(true)
const reimbursements = ref<Reimbursement[]>([])
const showCreateFromInvoicesModal = ref(false)

const handleCreateSuccess = (reimbursementId: string) => {
  showCreateFromInvoicesModal.value = false
  navigateTo(`/reimbursements/${reimbursementId}`)
}

const loadReimbursements = async (status?: string, sortBy?: string, order?: string) => {
  loading.value = true
  try {
    const data = await fetchReimbursements({
      status: status || undefined,
      sortBy: (sortBy as any) || 'createdAt',
      order: (order as any) || 'desc'
    })
    reimbursements.value = data || []
  } catch (error) {
    console.error('Failed to fetch reimbursements:', error)
  } finally {
    loading.value = false
  }
}

const handleFilter = (status: string, sortBy: string, order: string) => {
  loadReimbursements(status, sortBy, order)
}

onMounted(() => {
  loadReimbursements()
})
</script>
