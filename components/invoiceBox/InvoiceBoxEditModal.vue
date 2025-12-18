<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">编辑发票</h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              发票号码 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.invoiceNumber"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入发票号码"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              发票类型 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.invoiceType"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择发票类型</option>
              <option value="增值税专用发票">增值税专用发票</option>
              <option value="增值税普通发票">增值税普通发票</option>
              <option value="增值税电子普通发票">增值税电子普通发票</option>
              <option value="增值税电子专用发票">增值税电子专用发票</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                票面总额 <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.totalAmount"
                type="number"
                step="0.01"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                开票日期 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.invoiceDate"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                税率 (%)
              </label>
              <input
                v-model.number="form.taxRate"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="13"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                税额
              </label>
              <input
                v-model.number="form.taxAmount"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Error message -->
          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-800 text-sm">{{ error }}</p>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              :disabled="saving"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="saving"
            >
              <span v-if="saving">保存中...</span>
              <span v-else>保存</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InvoiceBox, InvoiceType } from '~/types/invoiceBox'

const props = defineProps<{
  invoice: InvoiceBox
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const saving = ref(false)
const error = ref('')

const form = ref({
  invoiceNumber: props.invoice.invoiceNumber,
  invoiceType: props.invoice.invoiceType as InvoiceType,
  totalAmount: props.invoice.totalAmount,
  taxRate: props.invoice.taxRate,
  taxAmount: props.invoice.taxAmount,
  invoiceDate: new Date(props.invoice.invoiceDate).toISOString().split('T')[0]
})

async function handleSubmit() {
  saving.value = true
  error.value = ''

  try {
    await $fetch(`/api/invoice-box/${props.invoice.id}`, {
      method: 'PUT',
      body: {
        invoiceNumber: form.value.invoiceNumber,
        invoiceType: form.value.invoiceType,
        totalAmount: form.value.totalAmount,
        taxRate: form.value.taxRate,
        taxAmount: form.value.taxAmount,
        invoiceDate: form.value.invoiceDate
      }
    })

    emit('updated')
  } catch (err: any) {
    console.error('Update failed:', err)
    error.value = err.data?.message || '更新失败，请重试'
  } finally {
    saving.value = false
  }
}
</script>
