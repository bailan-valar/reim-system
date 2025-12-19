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
            <ExpenseInvoiceStatusBadge
              :status="invoiceStatus"
              :count="item.invoiceBoxes?.length || 0"
              :expense-amount="item.amount"
              :total-invoice-amount="totalInvoiceAmount"
            />
          </div>
          <p class="mt-2 text-lg font-semibold text-gray-900">
            {{ formatCurrency(item.amount) }}
          </p>
          <p class="text-sm text-gray-600">
            {{ formatDate(item.date) }}
          </p>
          <p v-if="item.departure && item.arrival" class="text-sm text-gray-600">
            {{ item.departure }} → {{ item.arrival }}
          </p>
          <p v-if="totalInvoiceAmount > 0" class="text-sm text-gray-500">
            发票总额: {{ formatCurrency(totalInvoiceAmount) }}
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

      <!-- InvoiceBoxes List -->
      <div v-if="item.invoiceBoxes && item.invoiceBoxes.length > 0" class="pt-3 border-t border-gray-100">
        <div class="space-y-2">
          <div v-for="invoiceBox in item.invoiceBoxes" :key="invoiceBox.id"
               class="flex items-center justify-between text-sm">
            <button type="button"
                    @click="$emit('view-invoice-box', invoiceBox)"
                    class="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-left flex-1 min-w-0">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span class="truncate">{{ invoiceBox.invoiceNumber }} - {{ invoiceBox.invoiceType }} - {{ formatCurrency(invoiceBox.totalAmount) }}</span>
            </button>
            <button type="button" class="text-sm text-red-600 hover:text-red-700 ml-2 flex-shrink-0"
                    @click="$emit('delete-invoice-box', invoiceBox)">
              移除
            </button>
          </div>
        </div>
        <div class="mt-2">
          <button type="button"
                  class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  @click="$emit('link-invoice-box')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            从发票箱选择
          </button>
        </div>
      </div>
      <div v-else class="pt-3 border-t border-gray-100">
        <button type="button"
                class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                @click="$emit('link-invoice-box')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          从发票箱选择
        </button>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { ExpenseItem } from '~/types/expenseItem'
import { formatCurrency, formatDate } from '~/utils/formatters'
import { calculateInvoiceStatus } from '~/utils/invoiceStatus'

const props = defineProps<{
  item: ExpenseItem
}>()

defineEmits<{
  edit: []
  delete: []
  'delete-invoice-box': [invoiceBox: any]
  'view-invoice-box': [invoiceBox: any]
  'link-invoice-box': []
}>()

const totalInvoiceAmount = computed(() => {
  return props.item.invoiceBoxes?.reduce((sum, inv) => sum + inv.totalAmount, 0) || 0
})

const invoiceStatus = computed(() => {
  // 将 InvoiceBox 转换为 Invoice 格式以兼容 calculateInvoiceStatus
  const invoices = props.item.invoiceBoxes?.map(ib => ({
    amount: ib.totalAmount
  })) || []
  return calculateInvoiceStatus(props.item.amount, invoices, props.item.hasInvoice)
})
</script>
