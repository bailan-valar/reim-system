<template>
  <UiCard hover @click="navigateTo(`/companies/${company.id}`)">
    <div class="space-y-3">
      <!-- Logo -->
      <div class="flex items-center justify-center w-20 h-20 mx-auto">
        <img
          v-if="company.logoUrl"
          :src="company.logoUrl"
          :alt="company.name"
          class="max-w-20 max-h-20 rounded-lg object-contain"
        />
        <div v-else class="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>

      <!-- Company Name -->
      <h3 class="text-lg font-semibold text-gray-900 text-center truncate">
        {{ company.name }}
      </h3>

      <!-- Stats -->
      <div class="flex items-center justify-center gap-2 text-sm text-gray-600">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{{ reimbursementCount }} 个报销单</span>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between pt-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          {{ formatRelativeTime(company.createdAt) }}
        </span>
        <span class="text-sm text-primary-600 font-medium">
          查看详情 →
        </span>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { Company } from '~/types/company'
import { formatRelativeTime } from '~/utils/formatters'

const props = defineProps<{
  company: Company & { _count?: { reimbursements: number } }
}>()

const reimbursementCount = computed(() => props.company._count?.reimbursements || 0)
</script>
