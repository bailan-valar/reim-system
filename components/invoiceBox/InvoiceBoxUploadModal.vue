<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">上传发票</h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Upload area -->
        <div
          @dragover.prevent
          @drop.prevent="handleDrop"
          :class="[
            'border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors',
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          ]"
          @dragenter="isDragging = true"
          @dragleave="isDragging = false"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".pdf,.ofd,.png,.jpg,.jpeg"
            @change="handleFileSelect"
            class="hidden"
          />

          <div v-if="!selectedFile">
            <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="text-gray-600 mb-2">拖拽文件到此处或</p>
            <button
              @click="$refs.fileInput.click()"
              class="text-blue-600 hover:text-blue-700 font-medium"
            >
              点击选择文件
            </button>
            <p class="text-xs text-gray-500 mt-2">支持 PDF, OFD, PNG, JPG 格式，最大 10MB</p>
          </div>

          <div v-else class="flex items-center justify-center gap-4">
            <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="text-left">
              <p class="font-medium text-gray-900">{{ selectedFile.name }}</p>
              <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
            <button
              @click="clearFile"
              class="text-red-600 hover:text-red-700"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- OCR Recognition status -->
        <div v-if="isRecognizing" class="mb-6 p-4 bg-blue-50 rounded-lg">
          <div class="flex items-center gap-3">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <p class="text-blue-800 font-medium">正在智能识别发票信息...</p>
              <p class="text-blue-600 text-sm mt-1">使用腾讯云OCR技术自动提取发票数据</p>
            </div>
          </div>
        </div>

        <!-- OCR Success status -->
        <div v-if="ocrSuccess" class="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="text-green-800 font-medium">✓ 发票信息识别成功</p>
              <p class="text-green-600 text-sm mt-1">已自动填充表单，请核对信息</p>
            </div>
          </div>
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
              :disabled="uploading"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!selectedFile || uploading"
            >
              <span v-if="uploading">上传中...</span>
              <span v-else>确认上传</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InvoiceType } from '~/types/invoiceBox'

defineEmits<{
  close: []
  uploaded: []
}>()

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const isRecognizing = ref(false)
const ocrSuccess = ref(false)
const error = ref('')

const form = ref({
  invoiceNumber: '',
  invoiceType: '' as InvoiceType | '',
  totalAmount: 0,
  taxRate: null as number | null,
  taxAmount: null as number | null,
  invoiceDate: new Date().toISOString().split('T')[0]
})

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
    recognizeInvoice()
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    selectedFile.value = event.dataTransfer.files[0]
    recognizeInvoice()
  }
}

function clearFile() {
  selectedFile.value = null
  ocrSuccess.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function recognizeInvoice() {
  if (!selectedFile.value) return

  isRecognizing.value = true
  ocrSuccess.value = false
  error.value = ''

  try {
    // Create FormData for OCR preview
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    // Call OCR API to get preview data
    const response = await $fetch('/api/invoice-box/recognize', {
      method: 'POST',
      body: formData
    })

    if (response.success && response.data) {
      // Auto-fill form with OCR results
      if (response.data.invoiceNumber) {
        form.value.invoiceNumber = response.data.invoiceNumber
      }
      if (response.data.invoiceType) {
        form.value.invoiceType = response.data.invoiceType as InvoiceType
      }
      if (response.data.totalAmount) {
        form.value.totalAmount = response.data.totalAmount
      }
      if (response.data.taxRate) {
        form.value.taxRate = response.data.taxRate
      }
      if (response.data.taxAmount) {
        form.value.taxAmount = response.data.taxAmount
      }
      if (response.data.invoiceDate) {
        form.value.invoiceDate = response.data.invoiceDate
      }

      ocrSuccess.value = true
      console.log('[OCR] Recognition successful:', response.data)
    }
  } catch (err: any) {
    console.error('[OCR] Recognition failed:', err)
    // Don't show error to user, just log it
    // OCR is optional, user can still fill manually
  } finally {
    isRecognizing.value = false
  }
}

async function handleSubmit() {
  if (!selectedFile.value) {
    error.value = '请选择文件'
    return
  }

  uploading.value = true
  error.value = ''

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('invoiceNumber', form.value.invoiceNumber)
    formData.append('invoiceType', form.value.invoiceType)
    formData.append('totalAmount', form.value.totalAmount.toString())
    if (form.value.taxRate !== null) {
      formData.append('taxRate', form.value.taxRate.toString())
    }
    if (form.value.taxAmount !== null) {
      formData.append('taxAmount', form.value.taxAmount.toString())
    }
    formData.append('invoiceDate', form.value.invoiceDate)

    await $fetch('/api/invoice-box', {
      method: 'POST',
      body: formData
    })

    emit('uploaded')
  } catch (err: any) {
    console.error('Upload failed:', err)
    error.value = err.data?.message || '上传失败，请重试'
  } finally {
    uploading.value = false
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

</script>
