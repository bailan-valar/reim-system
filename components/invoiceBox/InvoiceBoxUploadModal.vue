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

        <!-- Batch Tags Input (show when multiple files selected) -->
        <div v-if="selectedFiles.length > 1" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            批量标签（将应用于所有上传的发票）
          </label>
          <input
            v-model="batchTags"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="请输入标签，多个标签用逗号分隔（如：差旅,北京,项目A）"
          />
          <p class="text-xs text-gray-500 mt-1">批量上传时，这些标签将自动添加到所有发票中</p>
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
            accept=".pdf,.png,.jpg,.jpeg"
            multiple
            @change="handleFileSelect"
            class="hidden"
          />

          <div v-if="selectedFiles.length === 0">
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
            <p class="text-xs text-gray-500 mt-2">支持 PDF, PNG, JPG 格式，最大 10MB，支持批量上传</p>
          </div>

          <div v-else class="space-y-2">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-gray-700">已选择 {{ selectedFiles.length }} 个文件</p>
              <button
                @click="$refs.fileInput.click()"
                class="text-sm text-blue-600 hover:text-blue-700"
              >
                添加更多
              </button>
            </div>
            <div class="max-h-40 overflow-y-auto space-y-2">
              <div
                v-for="(file, index) in selectedFiles"
                :key="index"
                class="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ file.name }}</p>
                    <p class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</p>
                  </div>
                </div>
                <button
                  @click="removeFile(index)"
                  class="text-red-600 hover:text-red-700 flex-shrink-0 ml-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Batch Recognition status -->
        <div v-if="isRecognizing" class="mb-6 p-4 bg-blue-50 rounded-lg">
          <div class="flex items-center gap-3">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div class="flex-1">
              <p class="text-blue-800 font-medium">正在智能识别发票信息...</p>
              <p class="text-blue-600 text-sm mt-1">使用腾讯云OCR技术自动提取发票数据</p>
              <div class="mt-2">
                <div class="flex justify-between text-xs text-blue-700 mb-1">
                  <span>识别进度</span>
                  <span>{{ recognitionProgress.completed }} / {{ recognitionProgress.total }}</span>
                </div>
                <div class="w-full bg-blue-200 rounded-full h-2">
                  <div
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${(recognitionProgress.completed / recognitionProgress.total) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recognition Results -->
        <div v-if="recognizedInvoices.length > 0 && !isRecognizing" class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-gray-700">识别结果 ({{ recognizedInvoices.length }} 张发票)</h3>
            <button
              v-if="selectedFiles.length > 0"
              @click="handleBatchSubmit"
              class="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
              :disabled="uploading"
            >
              批量上传全部
            </button>
          </div>
          <div class="max-h-96 overflow-y-auto space-y-3">
            <div
              v-for="(invoice, index) in recognizedInvoices"
              :key="index"
              class="p-3 border rounded-lg"
              :class="invoice.uploaded ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <svg v-if="invoice.uploaded" class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-sm font-medium text-gray-900">{{ invoice.fileName }}</p>
                </div>
                <span
                  v-if="invoice.uploaded"
                  class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded"
                >
                  已上传
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span class="text-gray-500">发票号码:</span>
                  <span class="ml-1 text-gray-900">{{ invoice.data.invoiceNumber || '-' }}</span>
                </div>
                <div>
                  <span class="text-gray-500">金额:</span>
                  <span class="ml-1 text-gray-900">¥{{ invoice.data.totalAmount || 0 }}</span>
                </div>
                <div>
                  <span class="text-gray-500">类型:</span>
                  <span class="ml-1 text-gray-900">{{ invoice.data.invoiceType || '-' }}</span>
                </div>
                <div>
                  <span class="text-gray-500">日期:</span>
                  <span class="ml-1 text-gray-900">{{ invoice.data.invoiceDate || '-' }}</span>
                </div>
                <div v-if="invoice.data.expenseCategory" class="col-span-2">
                  <span class="text-gray-500">费用项目:</span>
                  <span class="ml-1 text-gray-900 font-medium">{{ invoice.data.expenseCategory }}</span>
                </div>
              </div>
              <div v-if="invoice.error" class="mt-2 text-xs text-red-600">
                错误: {{ invoice.error }}
              </div>
            </div>
          </div>
        </div>

        <!-- Single Invoice Form (only show when 1 file selected) -->
        <div v-if="selectedFiles.length === 1 && recognizedInvoices.length === 1 && !recognizedInvoices[0].uploaded">
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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              购买方名称
            </label>
            <input
              v-model="form.buyerName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入购买方名称"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              费用项目
            </label>
            <input
              v-model="form.expenseCategory"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入费用项目（如：餐饮费、交通费等）"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              v-model="form.remark"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="请输入备注信息（如火车票行程、其他说明等）"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              标签
            </label>
            <input
              v-model="form.tags"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入标签，多个标签用逗号分隔（如：差旅,北京,项目A）"
            />
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
              :disabled="uploading"
            >
              <span v-if="uploading">上传中...</span>
              <span v-else>确认上传</span>
            </button>
          </div>
        </form>
        </div>

        <!-- Batch Upload Actions (show when multiple files or all uploaded) -->
        <div v-if="selectedFiles.length !== 1 || (recognizedInvoices.length > 0 && recognizedInvoices[0].uploaded)" class="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            :disabled="uploading"
          >
            {{ allUploaded ? '关闭' : '取消' }}
          </button>
          <button
            v-if="!allUploaded && selectedFiles.length > 0"
            @click="handleBatchSubmit"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="uploading || selectedFiles.length === 0"
          >
            <span v-if="uploading">上传中 ({{ uploadProgress.completed }}/{{ uploadProgress.total }})...</span>
            <span v-else>批量上传 ({{ selectedFiles.length }} 个文件)</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InvoiceType } from '~/types/invoiceBox'

const emit = defineEmits<{
  close: []
  uploaded: [uploadedInvoiceIds?: string[]]
}>()

interface RecognizedInvoice {
  fileName: string
  file: File
  data: {
    invoiceNumber?: string
    invoiceType?: InvoiceType
    totalAmount?: number
    taxRate?: number | null
    taxAmount?: number | null
    invoiceDate?: string
    buyerName?: string
    remark?: string
    expenseCategory?: string
  }
  uploaded: boolean
  uploadedId?: string
  error?: string
}

const fileInput = ref<HTMLInputElement>()
const selectedFiles = ref<File[]>([])
const isDragging = ref(false)
const uploading = ref(false)
const isRecognizing = ref(false)
const error = ref('')
const batchTags = ref('')

const recognizedInvoices = ref<RecognizedInvoice[]>([])
const recognitionProgress = ref({ completed: 0, total: 0 })
const uploadProgress = ref({ completed: 0, total: 0 })

const form = ref({
  invoiceNumber: '',
  invoiceType: '' as InvoiceType | '',
  totalAmount: 0,
  taxRate: null as number | null,
  taxAmount: null as number | null,
  invoiceDate: new Date().toISOString().split('T')[0],
  buyerName: '',
  expenseCategory: '',
  remark: '',
  tags: ''
})

const allUploaded = computed(() => {
  return recognizedInvoices.value.length > 0 && recognizedInvoices.value.every(inv => inv.uploaded)
})

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const newFiles = Array.from(target.files)
    selectedFiles.value = [...selectedFiles.value, ...newFiles]
    recognizeBatchInvoices()
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const newFiles = Array.from(event.dataTransfer.files)
    selectedFiles.value = [...selectedFiles.value, ...newFiles]
    recognizeBatchInvoices()
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
  recognizedInvoices.value.splice(index, 1)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function recognizeBatchInvoices() {
  if (selectedFiles.value.length === 0) return

  isRecognizing.value = true
  error.value = ''
  recognitionProgress.value = { completed: 0, total: selectedFiles.value.length }

  // Only recognize new files that haven't been recognized yet
  const startIndex = recognizedInvoices.value.length
  const filesToRecognize = selectedFiles.value.slice(startIndex)

  for (const file of filesToRecognize) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await $fetch('/api/invoice-box/recognize', {
        method: 'POST',
        body: formData
      })

      const invoiceData: RecognizedInvoice = {
        fileName: file.name,
        file: file,
        data: response.success && response.data ? {
          invoiceNumber: response.data.invoiceNumber,
          invoiceType: response.data.invoiceType as InvoiceType,
          totalAmount: response.data.totalAmount,
          taxRate: response.data.taxRate,
          taxAmount: response.data.taxAmount,
          invoiceDate: response.data.invoiceDate,
          buyerName: response.data.buyerName,
          remark: response.data.remark,
          expenseCategory: response.data.expenseCategory
        } : {
          invoiceNumber: `INV-${Date.now()}-${recognizedInvoices.value.length}`,
          totalAmount: 0,
          invoiceDate: new Date().toISOString().split('T')[0]
        },
        uploaded: false
      }

      recognizedInvoices.value.push(invoiceData)

      // If single file, auto-fill form
      if (selectedFiles.value.length === 1 && response.success && response.data) {
        form.value.invoiceNumber = response.data.invoiceNumber || ''
        form.value.invoiceType = (response.data.invoiceType as InvoiceType) || ''
        form.value.totalAmount = response.data.totalAmount || 0
        form.value.taxRate = response.data.taxRate ?? null
        form.value.taxAmount = response.data.taxAmount ?? null
        form.value.invoiceDate = response.data.invoiceDate || new Date().toISOString().split('T')[0]
        form.value.buyerName = response.data.buyerName || ''
        form.value.expenseCategory = response.data.expenseCategory || ''
        form.value.remark = response.data.remark || ''
      }

      console.log('[OCR] Recognition successful for:', file.name)
    } catch (err: any) {
      console.error('[OCR] Recognition failed for:', file.name, err)
      recognizedInvoices.value.push({
        fileName: file.name,
        file: file,
        data: {
          invoiceNumber: `INV-${Date.now()}-${recognizedInvoices.value.length}`,
          totalAmount: 0,
          invoiceDate: new Date().toISOString().split('T')[0]
        },
        uploaded: false,
        error: 'OCR识别失败'
      })
    } finally {
      recognitionProgress.value.completed++
    }
  }

  isRecognizing.value = false
}

async function handleSubmit() {
  if (selectedFiles.value.length === 0) {
    error.value = '请选择文件'
    return
  }

  // Single file upload with form data
  if (selectedFiles.value.length === 1 && recognizedInvoices.value.length === 1) {
    uploading.value = true
    error.value = ''

    try {
      const formData = new FormData()
      formData.append('file', selectedFiles.value[0])
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
      if (form.value.buyerName) {
        formData.append('buyerName', form.value.buyerName)
      }
      if (form.value.expenseCategory) {
        formData.append('expenseCategory', form.value.expenseCategory)
      }
      if (form.value.remark) {
        formData.append('remark', form.value.remark)
      }
      if (form.value.tags) {
        formData.append('tags', form.value.tags)
      }

      const result = await $fetch<{ data: { id: string } }>('/api/invoice-box', {
        method: 'POST',
        body: formData
      })

      recognizedInvoices.value[0].uploaded = true
      recognizedInvoices.value[0].uploadedId = result.data.id
      emit('uploaded', [result.data.id])
    } catch (err: any) {
      console.error('Upload failed:', err)
      error.value = err.data?.message || '上传失败，请重试'
    } finally {
      uploading.value = false
    }
  }
}

async function handleBatchSubmit() {
  if (recognizedInvoices.value.length === 0) return

  uploading.value = true
  error.value = ''
  uploadProgress.value = { completed: 0, total: recognizedInvoices.value.filter(inv => !inv.uploaded).length }

  const uploadedIds: string[] = []

  for (const invoice of recognizedInvoices.value) {
    if (invoice.uploaded) continue

    try {
      const formData = new FormData()
      formData.append('file', invoice.file)
      formData.append('invoiceNumber', invoice.data.invoiceNumber || '')
      formData.append('invoiceType', invoice.data.invoiceType || '其他')
      formData.append('totalAmount', (invoice.data.totalAmount || 0).toString())
      if (invoice.data.taxRate !== null && invoice.data.taxRate !== undefined) {
        formData.append('taxRate', invoice.data.taxRate.toString())
      }
      if (invoice.data.taxAmount !== null && invoice.data.taxAmount !== undefined) {
        formData.append('taxAmount', invoice.data.taxAmount.toString())
      }
      formData.append('invoiceDate', invoice.data.invoiceDate || new Date().toISOString().split('T')[0])
      if (invoice.data.buyerName) {
        formData.append('buyerName', invoice.data.buyerName)
      }
      if (invoice.data.expenseCategory) {
        formData.append('expenseCategory', invoice.data.expenseCategory)
      }
      if (invoice.data.remark) {
        formData.append('remark', invoice.data.remark)
      }
      if (batchTags.value) {
        formData.append('tags', batchTags.value)
      }

      const result = await $fetch<{ data: { id: string } }>('/api/invoice-box', {
        method: 'POST',
        body: formData
      })

      invoice.uploaded = true
      invoice.uploadedId = result.data.id
      invoice.error = undefined
      uploadedIds.push(result.data.id)
      uploadProgress.value.completed++
    } catch (err: any) {
      console.error('Upload failed for:', invoice.fileName, err)
      invoice.error = err.data?.message || '上传失败'
      uploadProgress.value.completed++
    }
  }

  uploading.value = false

  // If all uploaded successfully, emit event with uploaded IDs
  if (allUploaded.value) {
    emit('uploaded', uploadedIds)
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

</script>
