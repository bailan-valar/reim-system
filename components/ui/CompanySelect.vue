<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <div class="relative">
      <input
        :id="id"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        @focus="showDropdown = true"
        @blur="handleBlur"
        @input="handleInput"
      />

      <!-- Dropdown -->
      <div
        v-if="showDropdown && (filteredCompanies.length > 0 || canCreateNew)"
        class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
      >
        <!-- Existing companies -->
        <button
          v-for="company in filteredCompanies"
          :key="company.id"
          type="button"
          class="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
          @mousedown.prevent="selectCompany(company)"
        >
          {{ company.name }}
        </button>

        <!-- Create new option -->
        <button
          v-if="canCreateNew"
          type="button"
          class="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-t border-gray-200"
          @mousedown.prevent="createNewCompany"
        >
          <span class="font-medium">+ 创建 "{{ searchQuery }}"</span>
        </button>

        <!-- No results -->
        <div
          v-if="filteredCompanies.length === 0 && !canCreateNew"
          class="px-4 py-2 text-gray-500 text-sm"
        >
          无匹配结果
        </div>
      </div>

      <!-- Clear button -->
      <button
        v-if="selectedCompany && !disabled"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        @click="clearSelection"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Company } from '~/types/company'

const props = defineProps<{
  id?: string
  label?: string
  modelValue?: string | null
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const { fetchCompanies, createCompany } = useCompanies()

const companies = ref<Company[]>([])
const searchQuery = ref('')
const showDropdown = ref(false)
const selectedCompany = ref<Company | null>(null)
const loading = ref(false)

const filteredCompanies = computed(() => {
  if (!searchQuery.value.trim()) return companies.value

  const query = searchQuery.value.toLowerCase()
  return companies.value.filter(c =>
    c.name.toLowerCase().includes(query)
  )
})

const canCreateNew = computed(() => {
  if (!searchQuery.value.trim()) return false
  const query = searchQuery.value.trim()
  const exactMatch = companies.value.some(c =>
    c.name.toLowerCase() === query.toLowerCase()
  )

  return !exactMatch
})

const loadCompanies = async () => {
  try {
    companies.value = await fetchCompanies()

    // Set initial selection if modelValue provided
    if (props.modelValue) {
      selectedCompany.value = companies.value.find(c => c.id === props.modelValue) || null
      if (selectedCompany.value) {
        searchQuery.value = selectedCompany.value.name
      }
    }
  } catch (error) {
    console.error('Failed to load companies:', error)
  }
}

const selectCompany = (company: Company) => {
  selectedCompany.value = company
  searchQuery.value = company.name
  showDropdown.value = false
  emit('update:modelValue', company.id)
}

const createNewCompany = async () => {
  if (!searchQuery.value.trim()) return

  loading.value = true
  try {
    const newCompany = await createCompany({ name: searchQuery.value.trim() })
    companies.value.push(newCompany)
    selectCompany(newCompany)
  } catch (error: any) {
    alert(error.message || '创建公司失败')
  } finally {
    loading.value = false
  }
}

const clearSelection = () => {
  selectedCompany.value = null
  searchQuery.value = ''
  emit('update:modelValue', null)
}

const handleInput = () => {
  if (selectedCompany.value) {
    // User is typing after selection, clear it
    selectedCompany.value = null
    emit('update:modelValue', null)
  }
}

const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false

    // Restore selected company name if user didn't select anything
    if (selectedCompany.value && searchQuery.value !== selectedCompany.value.name) {
      searchQuery.value = selectedCompany.value.name
    } else if (!selectedCompany.value) {
      searchQuery.value = ''
    }
  }, 200)
}

onMounted(() => {
  loadCompanies()
})

watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    selectedCompany.value = null
    searchQuery.value = ''
  } else if (newValue !== selectedCompany.value?.id) {
    const company = companies.value.find(c => c.id === newValue)
    if (company) {
      selectedCompany.value = company
      searchQuery.value = company.name
    }
  }
})
</script>
