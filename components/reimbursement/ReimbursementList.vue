<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <UiSelect
        v-model="selectedStatus"
        :options="statusOptions"
        placeholder="全部状态"
        class="sm:w-48"
      />
      <UiSelect
        v-model="selectedCompany"
        :options="companyOptions"
        placeholder="全部公司"
        class="sm:w-48"
      />
      <UiSelect
        v-model="sortBy"
        :options="sortOptions"
        class="sm:w-48"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!reimbursements.length" class="text-center py-12">
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

    <!-- List -->
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ReimbursementCard
        v-for="reimbursement in reimbursements"
        :key="reimbursement.id"
        :reimbursement="reimbursement"
        @status-changed="handleStatusChanged"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Reimbursement } from '~/types/reimbursement'
import type { Company } from '~/types/company'
import { REIMBURSEMENT_STATUSES } from '~/utils/constants'

const props = defineProps<{
  reimbursements: Reimbursement[]
  loading?: boolean
}>()

const emit = defineEmits<{
  filter: [status: string, companyId: string, sortBy: string, order: string]
  reload: []
}>()

const { fetchCompanies } = useCompanies()

const selectedStatus = ref('')
const selectedCompany = ref('')
const sortBy = ref('createdAt-desc')
const companies = ref<Company[]>([])

const statusOptions = computed(() => [
  { value: '', label: '全部状态' },
  ...REIMBURSEMENT_STATUSES.map(status => ({
    value: status,
    label: status
  }))
])

const companyOptions = computed(() => [
  { value: '', label: '全部公司' },
  ...companies.value.map(company => ({
    value: company.id,
    label: company.name
  }))
])

const sortOptions = [
  { value: 'createdAt-desc', label: '创建时间 (新到旧)' },
  { value: 'createdAt-asc', label: '创建时间 (旧到新)' },
  { value: 'updatedAt-desc', label: '更新时间 (新到旧)' },
  { value: 'startDate-desc', label: '费用日期 (新到旧)' },
  { value: 'startDate-asc', label: '费用日期 (旧到新)' },
  { value: 'totalAmount-desc', label: '金额 (高到低)' },
  { value: 'totalAmount-asc', label: '金额 (低到高)' }
]

const handleStatusChanged = () => {
  emit('reload')
}

watch([selectedStatus, selectedCompany, sortBy], () => {
  const [field, order] = sortBy.value.split('-')
  emit('filter', selectedStatus.value, selectedCompany.value, field, order)
})

onMounted(async () => {
  try {
    companies.value = await fetchCompanies()
  } catch (error) {
    console.error('Failed to fetch companies:', error)
  }
})
</script>
