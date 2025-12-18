<template>
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
        accept=".pdf,.ofd"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />

      <div v-if="selectedFiles.length === 0">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="mt-2 text-sm text-gray-600">
          拖拽PDF或OFD发票到此处或
          <button
            type="button"
            class="text-primary-600 hover:text-primary-700 font-medium"
            @click="fileInput?.click()"
          >
            点击选择
          </button>
        </p>
        <p class="mt-1 text-xs text-gray-500">
          支持批量上传多个PDF或OFD发票文件 (每个最大 10MB)
        </p>
        <p class="mt-1 text-xs text-gray-500">
          系统将使用阿里云智能识别发票信息，识别失败的项目需要手动填写
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

    <!-- Error Message -->
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <!-- Upload Progress -->
    <div v-if="uploading" class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-600">正在上传并识别发票...</span>
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
              成功识别并创建 {{ uploadResults.success }} 个费用项目
            </p>
            <div v-if="uploadResults.results.length > 0" class="mt-2 space-y-1">
              <div
                v-for="(result, index) in uploadResults.results"
                :key="index"
                :class="result.needsManualInput ? 'text-xs text-orange-800' : 'text-xs text-green-800'"
              >
                <span v-if="result.needsManualInput">
                  ⚠ {{ result.fileName }}: 已创建费用项目，请手动填写金额和日期
                </span>
                <span v-else>
                  ✓ {{ result.fileName }}: {{ result.invoiceData.description }} - ¥{{ result.invoiceData.amount }}
                </span>
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
    </div>

    <!-- Actions -->
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
        @click="handleUpload"
        :disabled="selectedFiles.length === 0 || uploading"
      >
        {{ uploading ? '上传中...' : `上传 ${selectedFiles.length} 个文件` }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  reimbursementId: string
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const fileInput = ref<HTMLInputElement>()
const selectedFiles = ref<File[]>([])
const dragActive = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref('')
const uploadResults = ref<any>(null)

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
    // Check file type - accept both PDF and OFD
    const isValidType = file.name.toLowerCase().endsWith('.pdf') ||
                        file.name.toLowerCase().endsWith('.ofd')
    if (!isValidType) {
      error.value = '仅支持PDF和OFD文件'
      continue
    }

    // Check file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      error.value = `文件 ${file.name} 大小超过限制 (最大 10MB)`
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

const handleUpload = async () => {
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

    const { data } = await $fetch<any>(`/api/reimbursements/${props.reimbursementId}/invoices/bulk-upload`, {
      method: 'POST',
      body: formData
    })

    uploadProgress.value = 100
    uploadResults.value = data

    // If all succeeded, emit success after a short delay
    if (data.failed === 0) {
      setTimeout(() => {
        emit('success')
      }, 1500)
    }
  } catch (e: any) {
    error.value = e.message || '上传失败'
  } finally {
    clearInterval(progressInterval)
    uploading.value = false
  }
}

const handleCancel = () => {
  if (uploadResults.value && uploadResults.value.success > 0) {
    emit('success')
  } else {
    emit('cancel')
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
