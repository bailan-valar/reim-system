<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold text-gray-900">个人报销管理系统</h1>
          <UiButton @click="navigateTo('/reimbursements/new')">
            创建报销单
          </UiButton>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <UiCard>
          <div class="flex items-center">
            <div class="flex-shrink-0 p-3 bg-primary-100 rounded-lg">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">总报销单</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.total }}</p>
            </div>
          </div>
        </UiCard>

        <UiCard>
          <div class="flex items-center">
            <div class="flex-shrink-0 p-3 bg-yellow-100 rounded-lg">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">待处理</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.pending }}</p>
            </div>
          </div>
        </UiCard>

        <UiCard>
          <div class="flex items-center">
            <div class="flex-shrink-0 p-3 bg-green-100 rounded-lg">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">已完成</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.completed }}</p>
            </div>
          </div>
        </UiCard>

        <UiCard>
          <div class="flex items-center">
            <div class="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">总金额</p>
              <p class="text-2xl font-semibold text-gray-900">{{ formatCurrency(stats.totalAmount) }}</p>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- Recent Reimbursements -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900">最近的报销单</h2>
          <NuxtLink to="/reimbursements" class="text-primary-600 hover:text-primary-700 font-medium">
            查看全部 →
          </NuxtLink>
        </div>

        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p class="mt-2 text-gray-600">加载中...</p>
        </div>

        <div v-else-if="!recentReimbursements.length" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">暂无报销单</h3>
          <p class="mt-1 text-sm text-gray-500">开始创建您的第一个报销单</p>
          <div class="mt-6">
            <UiButton @click="navigateTo('/reimbursements/new')">
              创建报销单
            </UiButton>
          </div>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ReimbursementCard
            v-for="reimbursement in recentReimbursements"
            :key="reimbursement.id"
            :reimbursement="reimbursement"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Reimbursement } from '~/types/reimbursement'
import { formatCurrency } from '~/utils/formatters'

const { fetchReimbursements } = useReimbursements()

const loading = ref(true)
const reimbursements = ref<Reimbursement[]>([])

const stats = computed(() => {
  const total = reimbursements.value.length
  const pending = reimbursements.value.filter(r => r.status !== '已完成').length
  const completed = reimbursements.value.filter(r => r.status === '已完成').length
  const totalAmount = reimbursements.value.reduce((sum, r) => sum + r.totalAmount, 0)

  return { total, pending, completed, totalAmount }
})

const recentReimbursements = computed(() => {
  return reimbursements.value.slice(0, 6)
})

onMounted(async () => {
  try {
    const data = await fetchReimbursements({ sortBy: 'createdAt', order: 'desc' })
    reimbursements.value = data || []
  } catch (error) {
    console.error('Failed to fetch reimbursements:', error)
  } finally {
    loading.value = false
  }
})
</script>
