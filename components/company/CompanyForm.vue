<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <UiInput
      v-model="formData.name"
      type="text"
      label="公司名称"
      placeholder="请输入公司名称"
      required
      :error="errors.name"
    />

    <!-- Logo Upload Section -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">
        公司 Logo
      </label>

      <!-- Logo Preview -->
      <div v-if="logoPreview" class="relative inline-block">
        <img
          :src="logoPreview"
          alt="Logo preview"
          class="max-w-32 max-h-32 rounded-lg object-contain border-2 border-gray-200"
        />
        <button
          type="button"
          @click="removeLogo"
          class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          title="删除 Logo"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Upload Button -->
      <div v-if="!logoPreview" class="flex items-center gap-3">
        <label
          class="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {{ uploading ? '上传中...' : '选择图片' }}
          <input
            ref="fileInput"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            class="hidden"
            @change="handleFileSelect"
            :disabled="uploading"
          />
        </label>
        <span class="text-xs text-gray-500">支持 PNG、JPG 格式，最大 5MB</span>
      </div>

      <p v-if="errors.logo" class="text-sm text-red-600">{{ errors.logo }}</p>
    </div>

    <div class="flex gap-3 justify-end pt-4">
      <UiButton
        type="button"
        variant="secondary"
        @click="$emit('cancel')"
      >
        取消
      </UiButton>
      <UiButton
        type="submit"
        :disabled="loading || uploading"
      >
        {{ loading ? '保存中...' : (isEdit ? '更新' : '创建') }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Company, CreateCompanyInput, UpdateCompanyInput } from '~/types/company'

const props = defineProps<{
  company?: Company
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateCompanyInput | UpdateCompanyInput]
  cancel: []
}>()

const isEdit = computed(() => !!props.company)

const formData = reactive({
  name: props.company?.name || '',
  logoUrl: props.company?.logoUrl || ''
})

const errors = reactive({
  name: '',
  logo: ''
})

const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const logoPreview = ref<string>(props.company?.logoUrl || '')

// Watch for company prop changes (when editing)
watch(() => props.company?.logoUrl, (newLogoUrl) => {
  if (newLogoUrl) {
    logoPreview.value = newLogoUrl
    formData.logoUrl = newLogoUrl
  }
})

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  errors.logo = ''

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    errors.logo = '不支持的文件类型。请选择 PNG 或 JPG 格式的图片'
    return
  }

  // Validate file size (5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    errors.logo = '文件大小超过限制 (最大 5MB)'
    return
  }

  // Upload file
  uploading.value = true
  try {
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    const response = await $fetch<{ data: { filePath: string } }>('/api/uploads/logo', {
      method: 'POST',
      body: uploadFormData
    })

    // Update form data and preview
    formData.logoUrl = response.data.filePath
    logoPreview.value = response.data.filePath
  } catch (error: any) {
    errors.logo = error.message || '上传图片失败'
    console.error('Failed to upload logo:', error)
  } finally {
    uploading.value = false
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const removeLogo = () => {
  logoPreview.value = ''
  formData.logoUrl = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleSubmit = () => {
  // Reset errors
  errors.name = ''
  errors.logo = ''

  // Validate
  if (!formData.name || !formData.name.trim()) {
    errors.name = '请输入公司名称'
    return
  }

  emit('submit', {
    name: formData.name.trim(),
    logoUrl: formData.logoUrl || null
  })
}
</script>
