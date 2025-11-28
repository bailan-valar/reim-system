<template>
  <UiCard padding="sm">
    <div class="space-y-3">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="px-2 py-1 text-xs font-medium rounded bg-primary-100 text-primary-800">
              {{ item.category }}
            </span>
            <span v-if="item.hasInvoice" class="text-green-600 text-sm">✓ 已上传发票</span>
            <span v-else class="text-gray-400 text-sm">未上传发票</span>
          </div>
          <p class="mt-2 text-lg font-semibold text-gray-900">
            {{ formatCurrency(item.amount) }}
          </p>
          <p class="text-sm text-gray-600">
            {{ formatDate(item.date) }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="p-1 text-gray-400 hover:text-primary-600 transition-colors"
            @click="$emit('edit')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            class="p-1 text-gray-400 hover:text-red-600 transition-colors"
            @click="$emit('delete')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Description -->
      <p v-if="item.description" class="text-sm text-gray-600">
        {{ item.description }}
      </p>

      <!-- Invoice -->
      <div v-if="item.hasInvoice && item.invoiceFilePath" class="pt-3 border-t border-gray-100">
        <div class="flex items-center justify-between">
          <a
            :href="item.invoiceFilePath"
            target="_blank"
            class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
            查看发票
          </a>
          <button
            type="button"
            class="text-sm text-red-600 hover:text-red-700"
            @click="$emit('delete-invoice')"
          >
            删除发票
          </button>
        </div>
      </div>
      <div v-else class="pt-3 border-t border-gray-100">
        <button
          type="button"
          class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          @click="$emit('upload-invoice')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          上传发票
        </button>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { ExpenseItem } from '~/types/expenseItem'
import { formatCurrency, formatDate } from '~/utils/formatters'

defineProps<{
  item: ExpenseItem
}>()

defineEmits<{
  edit: []
  delete: []
  'upload-invoice': []
  'delete-invoice': []
}>()
</script>
