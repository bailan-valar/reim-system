<template>
  <UiCard hover @click="handleCardClick">
    <div class="space-y-3">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-gray-900 truncate">
            {{ reimbursement.title }}
          </h3>
          <p v-if="reimbursement.description" class="mt-1 text-sm text-gray-600 line-clamp-2">
            {{ reimbursement.description }}
          </p>
        </div>
        <ReimbursementStatusBadgeDropdown
          :status="reimbursement.status"
          :reimbursement-id="reimbursement.id"
          @status-changed="handleStatusChanged"
        />
      </div>

      <!-- Date Range and Company -->
      <div v-if="reimbursement.startDate || reimbursement.endDate || reimbursement.company" class="flex flex-wrap items-center gap-4 text-sm">
        <div v-if="reimbursement.startDate || reimbursement.endDate" class="flex items-center gap-1 text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            <span v-if="reimbursement.startDate">{{ formatDate(reimbursement.startDate) }}</span>
            <span v-if="reimbursement.startDate && reimbursement.endDate"> - </span>
            <span v-if="reimbursement.endDate">{{ formatDate(reimbursement.endDate) }}</span>
          </span>
        </div>

        <div v-if="reimbursement.company" class="flex items-center gap-1 text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>{{ reimbursement.company.name }}</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="flex items-center gap-6 text-sm">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-semibold text-gray-900">{{ formatCurrency(reimbursement.totalAmount) }}</span>
        </div>

        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="text-gray-600">{{ itemCount }} 项费用</span>
        </div>

        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="text-gray-600">{{ invoiceCount }}/{{ itemCount }} 发票</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between pt-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          {{ formatRelativeTime(reimbursement.createdAt) }}
        </span>
        <span class="text-sm text-primary-600 font-medium">
          查看详情 →
        </span>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { Reimbursement } from '~/types/reimbursement'
import { formatCurrency, formatRelativeTime, formatDate } from '~/utils/formatters'

const props = defineProps<{
  reimbursement: Reimbursement
}>()

const emit = defineEmits<{
  statusChanged: []
}>()

const itemCount = computed(() => props.reimbursement.items?.length || 0)
const invoiceCount = computed(() => props.reimbursement.items?.filter(item => item.hasInvoice).length || 0)

const handleCardClick = () => {
  navigateTo(`/reimbursements/${props.reimbursement.id}`)
}

const handleStatusChanged = () => {
  emit('statusChanged')
}
</script>
