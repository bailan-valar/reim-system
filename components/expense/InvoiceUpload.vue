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
        accept=".pdf,.png,.jpg,.jpeg,.ofd"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />

      <div v-if="selectedFiles.length === 0">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="mt-2 text-sm text-gray-600">
          拖拽文件到此处或
          <button
            type="button"
            class="text-primary-600 hover:text-primary-700 font-medium"
            @click="fileInput?.click()"
          >
            点击选择
          </button>
        </p>
        <p class="mt-1 text-xs text-gray-500">
          支持 PDF, PNG, JPG, JPEG, OFD (最大 10MB)，可选择多个文件
        </p>
        <p class="mt-1 text-xs text-gray-500">
          系统将使用阿里云智能识别发票信息
        </p>
      </div>

      <div v-else class="space-y-3">
        <div class="text-sm text-gray-600 mb-2">已选择 {{ selectedFiles.length }} 个文件</div>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <div v-for="(file, index) in selectedFiles" :key="index"
               class="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div class="flex items-center gap-2">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div class="text-left">
                <p class="text-sm font-medium text-gray-900">{{ file.name }}</p>
                <p class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</p>
              </div>
            </div>
            <button
              type="button"
              class="text-sm text-red-600 hover:text-red-700"
              @click="removeFile(index)"
            >
              移除
            </button>
          </div>
        </div>
        <button
          type="button"
          class="text-sm text-primary-600 hover:text-primary-700"
          @click="fileInput?.click()"
        >
          + 添加更多文件
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <!-- Upload Progress -->
    <div v-if="uploading" class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-600">上传中...</span>
        <span class="text-gray-900 font-medium">{{ uploadProgress }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="bg-primary-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${uploadProgress}%` }"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 justify-end">
      <UiButton
        type="button"
        variant="secondary"
        @click="$emit('cancel')"
        :disabled="uploading"
      >
        取消
      </UiButton>
      <UiButton
        type="button"
        @click="handleUpload"
        :disabled="selectedFiles.length === 0 || uploading"
      >
        {{ uploading ? '上传中...' : `上传 (${selectedFiles.length})` }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  itemId: string
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

const { uploadInvoices } = useInvoices()

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  files.forEach(file => validateAndAddFile(file))
}

const handleDrop = (event: DragEvent) => {
  dragActive.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  files.forEach(file => validateAndAddFile(file))
}

const validateAndAddFile = (file: File) => {
  error.value = ''

  // Check file type
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/ofd', 'application/x-ofd']
  if (!allowedTypes.includes(file.type)) {
    error.value = '不支持的文件类型。请上传 PDF, PNG, JPG, JPEG 或 OFD 文件'
    return
  }

  // Check file size (10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    error.value = `文件 ${file.name} 大小超过限制 (最大 10MB)`
    return
  }

  // Check if file already exists
  if (selectedFiles.value.some(f => f.name === file.name && f.size === file.size)) {
    error.value = `文件 ${file.name} 已存在`
    return
  }

  selectedFiles.value.push(file)
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
  error.value = ''
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

  // Simulate progress
  const progressInterval = setInterval(() => {
    if (uploadProgress.value < 90) {
      uploadProgress.value += 10
    }
  }, 200)

  try {
    await uploadInvoices(props.reimbursementId, props.itemId, selectedFiles.value)
    uploadProgress.value = 100

    setTimeout(() => {
      emit('success')
    }, 500)
  } catch (e: any) {
    error.value = e.message || '上传失败'
  } finally {
    clearInterval(progressInterval)
    uploading.value = false
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>
