<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div>
          <NuxtLink to="/reimbursements" class="text-primary-600 hover:text-primary-700 text-sm font-medium mb-2 inline-block">
            ← 返回列表
          </NuxtLink>
          <h1 class="text-3xl font-bold text-gray-900">创建报销单</h1>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <UiCard>
        <ReimbursementForm
          :loading="loading"
          @submit="handleSubmit"
          @cancel="navigateTo('/reimbursements')"
        />
      </UiCard>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { CreateReimbursementInput } from '~/types/reimbursement'

const { createReimbursement } = useReimbursements()
const loading = ref(false)

const handleSubmit = async (data: CreateReimbursementInput) => {
  loading.value = true
  try {
    const reimbursement = await createReimbursement(data)
    if (reimbursement) {
      navigateTo(`/reimbursements/${reimbursement.id}`)
    }
  } catch (error: any) {
    console.error('Failed to create reimbursement:', error)
    alert(error.message || '创建报销单失败')
  } finally {
    loading.value = false
  }
}
</script>
