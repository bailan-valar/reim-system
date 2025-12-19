<template>
  <UiModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" title="从发票创建报销单" size="large">
    <div class="space-y-4">
      <!-- Upload Area -->
      <div
        class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
        :class="dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'"
        @dragover.prevent="dragActive = true"
        @dragleave.prevent="dragActive = false"
        @drop.prevent="handleDrop"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".pdf"
          multiple
          class="hidden"
          @change="handleFileSelect"
        />

        <div v-if="selectedFiles.length === 0">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="mt-2 text-sm text-gray-600">
            拖拽PDF发票到此处或
            <button
              type="button"
              class="text-primary-600 hover:text-primary-700 font-medium"
              @click="fileInput?.click()"
            >
              点击选择
            </button>
          </p>
          <p class="mt-1 text-xs text-gray-500">
            支持批量上传多个PDF发票文件 (每个最大 10MB)
          </p>
          <p class="mt-1 text-xs text-gray-500">
            系统将自动识别发票信息并创建报销单
          </p>
        </div>

        <div v-else class="space-y-3">
          <div class="flex items-center justify-center gap-2">
            <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div class="text-left">
              <p class="text-sm font-medium text-gray-900">已选择 {{ selectedFiles.length }} 个文件</p>
              <p class="text-xs text-gray-500">{{ formatTotalSize() }}</p>
            </div>
          </div>
          <button
            type="button"
            class="text-sm text-red-600 hover:text-red-700"
            @click="clearFiles"
          >
            清除所有文件
          </button>
        </div>
      </div>

      <!-- File List -->
      <div v-if="selectedFiles.length > 0" class="space-y-2 max-h-60 overflow-y-auto">
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ file.name }}</p>
              <p class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</p>
            </div>
          </div>
          <button
            type="button"
            class="text-red-600 hover:text-red-700 ml-2"
            @click="removeFile(index)"
            :disabled="uploading"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Form Fields (shown after files selected) -->
      <div v-if="selectedFiles.length > 0 && !uploadResults" class="space-y-4 pt-4 border-t">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            报销单标题 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="例如：2024年1月出差报销"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :disabled="uploading"
          />
          <p v-if="titleError" class="mt-1 text-sm text-red-600">{{ titleError }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            描述（可选）
          </label>
          <textarea
            v-model="description"
            rows="2"
            placeholder="添加备注信息..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :disabled="uploading"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            所属公司（可选）
          </label>
          <select
            v-model="companyId"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :disabled="uploading || loadingCompanies"
          >
            <option value="">请选择公司</option>
            <option v-for="company in companies" :key="company.id" :value="company.id">
              {{ company.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Error Message -->
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <!-- Upload Progress -->
      <div v-if="uploading" class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">正在创建报销单并识别发票...</span>
          <span class="text-gray-900 font-medium">{{ uploadProgress }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-primary-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${uploadProgress}%` }"
          />
        </div>
      </div>

      <!-- Upload Results -->
      <div v-if="uploadResults" class="space-y-3">
        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-green-900">
                成功创建报销单，识别并添加 {{ uploadResults.success }} 个费用项目
              </p>
              <div v-if="uploadResults.items.length > 0" class="mt-2 space-y-1">
                <div
                  v-for="(result, index) in uploadResults.items"
                  :key="index"
                  class="text-xs text-green-800"
                >
                  ✓ {{ result.fileName }}: {{ result.invoiceData.description }} - ¥{{ result.invoiceData.amount.toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="uploadResults.errors.length > 0" class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-red-900">
                {{ uploadResults.failed }} 个文件处理失败
              </p>
              <div class="mt-2 space-y-1">
                <div
                  v-for="(error, index) in uploadResults.errors"
                  :key="index"
                  class="text-xs text-red-800"
                >
                  ✗ {{ error.fileName }}: {{ error.error }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="uploadResults.failed === 0" class="text-center text-sm text-gray-600">
          正在跳转到报销单详情页...
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <UiButton
          type="button"
          variant="secondary"
          @click="handleCancel"
          :disabled="uploading"
        >
          {{ uploadResults ? '关闭' : '取消' }}
        </UiButton>
        <UiButton
          v-if="!uploadResults"
          type="button"
          @click="handleCreate"
          :disabled="!canCreate || uploading"
        >
          {{ uploading ? '创建中...' : '创建报销单' }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { Company } from '~/types/company'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: [reimbursementId: string]
  cancel: []
}>()

const { fetchCompanies } = useCompanies()

const fileInput = ref<HTMLInputElement>()
const selectedFiles = ref<File[]>([])
const dragActive = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref('')
const uploadResults = ref<any>(null)

// Form fields
const title = ref('')
const description = ref('')
const companyId = ref('')
const titleError = ref('')

// Companies
const companies = ref<Company[]>([])
const loadingCompanies = ref(false)

// Load companies when modal opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    loadingCompanies.value = true
    try {
      companies.value = await fetchCompanies()
    } catch (e) {
      console.error('Failed to load companies:', e)
    } finally {
      loadingCompanies.value = false
    }
  } else {
    // Reset form when modal closes
    resetForm()
  }
})

const canCreate = computed(() => {
  return selectedFiles.value.length > 0 && title.value.trim() !== ''
})

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  addFiles(files)
}

const handleDrop = (event: DragEvent) => {
  dragActive.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  addFiles(files)
}

const addFiles = (files: File[]) => {
  error.value = ''

  for (const file of files) {
    // Check file type - only accept PDF
    const isValidType = file.name.toLowerCase().endsWith('.pdf')
    if (!isValidType) {
      error.value = '仅支持PDF文件'
      continue
    }

    // Check file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      error.value = `文件 ${file.name} 大小超过限制 (最�?10MB)`
      continue
    }

    // Check if file already added
    if (!selectedFiles.value.some(f => f.name === file.name && f.size === file.size)) {
      selectedFiles.value.push(file)
    }
  }
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const clearFiles = () => {
  selectedFiles.value = []
  error.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleCreate = async () => {
  // Validate title
  if (!title.value.trim()) {
    titleError.value = '标题不能为空'
    return
  }

  titleError.value = ''

  if (selectedFiles.value.length === 0) return

  uploading.value = true
  uploadProgress.value = 0
  error.value = ''
  uploadResults.value = null

  // Simulate progress
  const progressInterval = setInterval(() => {
    if (uploadProgress.value < 90) {
      uploadProgress.value += 5
    }
  }, 300)

  try {
    const formData = new FormData()
    selectedFiles.value.forEach(file => {
      formData.append('files', file)
    })
    formData.append('title', title.value.trim())
    if (description.value.trim()) {
      formData.append('description', description.value.trim())
    }
    if (companyId.value) {
      formData.append('companyId', companyId.value)
    }

    const { data } = await $fetch<any>('/api/reimbursements/create-from-invoices', {
      method: 'POST',
      body: formData
    })

    uploadProgress.value = 100
    uploadResults.value = data.results

    // If all succeeded, emit success and redirect after a short delay
    if (data.results.failed === 0) {
      setTimeout(() => {
        emit('success', data.reimbursement.id)
      }, 1500)
    }
  } catch (e: any) {
    error.value = e.data?.message || e.message || '创建报销单失败'
  } finally {
    clearInterval(progressInterval)
    uploading.value = false
  }
}

const handleCancel = () => {
  if (uploadResults.value && uploadResults.value.success > 0) {
    // If some items were created successfully, emit success with the reimbursement ID
    // We need to get the reimbursement ID from somewhere - let's store it
    emit('cancel')
  } else {
    emit('cancel')
  }
  emit('update:modelValue', false)
}

const resetForm = () => {
  selectedFiles.value = []
  title.value = ''
  description.value = ''
  companyId.value = ''
  titleError.value = ''
  error.value = ''
  uploadResults.value = null
  uploadProgress.value = 0
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatTotalSize = (): string => {
  const total = selectedFiles.value.reduce((sum, file) => sum + file.size, 0)
  return formatFileSize(total)
}
</script>
