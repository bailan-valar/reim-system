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
        accept=".pdf,.png,.jpg,.jpeg"
        class="hidden"
        @change="handleFileSelect"
      />

      <div v-if="!selectedFile">
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
          支持 PDF, PNG, JPG, JPEG (最大 10MB)
        </p>
      </div>

      <div v-else class="space-y-3">
        <div class="flex items-center justify-center gap-2">
          <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div class="text-left">
            <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
            <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
        </div>
        <button
          type="button"
          class="text-sm text-red-600 hover:text-red-700"
          @click="clearFile"
        >
          移除文件
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
        :disabled="!selectedFile || uploading"
      >
        {{ uploading ? '上传中...' : '上传' }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  itemId: string
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const dragActive = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref('')

const { uploadInvoice } = useFileUpload()

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  dragActive.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const validateAndSetFile = (file: File) => {
  error.value = ''

  // Check file type
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    error.value = '不支持的文件类型。请上传 PDF, PNG, JPG 或 JPEG 文件'
    return
  }

  // Check file size (10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    error.value = '文件大小超过限制 (最大 10MB)'
    return
  }

  selectedFile.value = file
}

const clearFile = () => {
  selectedFile.value = null
  error.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) return

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
    await uploadInvoice(selectedFile.value, props.itemId)
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
