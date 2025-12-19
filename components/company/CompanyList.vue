<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- Search -->
      <div class="flex-1">
        <UiInput
          v-model="searchQuery"
          type="text"
          placeholder="搜索公司名称..."
          class="w-full"
        >
          <template #prefix>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </template>
        </UiInput>
      </div>

      <!-- Sort -->
      <div class="w-full sm:w-64">
        <UiSelect
          v-model="sortBy"
          :options="sortOptions"
          label=""
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCompanies.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">
        {{ searchQuery ? '未找到匹配的公司' : '暂无公司信息' }}
      </h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery ? '尝试使用其他关键词搜索' : '开始创建您的第一个公司' }}
      </p>
      <div v-if="!searchQuery" class="mt-6">
        <UiButton @click="$emit('create')">
          创建公司
        </UiButton>
      </div>
    </div>

    <!-- Company Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <CompanyCard
        v-for="company in filteredCompanies"
        :key="company.id"
        :company="company"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Company } from '~/types/company'

const props = defineProps<{
  companies: (Company & { _count?: { reimbursements: number } })[]
  loading?: boolean
}>()

defineEmits<{
  create: []
}>()

const searchQuery = ref('')
const sortBy = ref('name-asc')

const sortOptions = [
  { value: 'name-asc', label: '名称 A-Z' },
  { value: 'name-desc', label: '名称 Z-A' },
  { value: 'createdAt-desc', label: '创建时间（新到旧）' },
  { value: 'createdAt-asc', label: '创建时间（旧到新）' }
]

const filteredCompanies = computed(() => {
  let result = [...props.companies]

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c => c.name.toLowerCase().includes(query))
  }

  // 排序
  const [field, order] = sortBy.value.split('-')
  result.sort((a, b) => {
    let aVal: any = a[field as keyof Company]
    let bVal: any = b[field as keyof Company]

    // 处理日期字段
    if (field === 'createdAt' || field === 'updatedAt') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }

    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return order === 'asc' ? comparison : -comparison
  })

  return result
})
</script>
