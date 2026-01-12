<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      ref="buttonRef"
      :class="badgeClasses"
      @click.stop="toggleDropdown"
      :disabled="loading"
      class="cursor-pointer hover:opacity-80 transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-md"
    >
      <span>{{ status }}</span>
      <svg
        v-if="!loading"
        class="w-4 h-4 ml-1 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
      <svg
        v-else
        class="w-4 h-4 ml-1 animate-spin"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>

    <!-- Dropdown Menu - Teleported to body -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          ref="menuRef"
          :style="menuStyle"
          class="fixed w-48 rounded-lg shadow-xl bg-white ring-1 ring-gray-200 z-[9999]"
        >
          <div class="py-2 px-1 flex flex-col" role="menu">
            <button
              v-for="statusOption in REIMBURSEMENT_STATUSES"
              :key="statusOption"
              type="button"
              @click.stop="handleStatusChange(statusOption)"
              :disabled="statusOption === status || loading"
              :class="[
                'w-full text-left px-3 py-2 text-sm transition-all rounded-md mb-1 last:mb-0',
                statusOption === status
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50 cursor-pointer hover:scale-[1.02]'
              ]"
              role="menuitem"
            >
              <div class="flex items-center justify-between gap-3">
                <span :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
                  getStatusColorClass(statusOption)
                ]">
                  {{ statusOption }}
                </span>
                <span v-if="statusOption === status" class="text-primary-600 text-sm font-bold">✓</span>
              </div>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { ReimbursementStatus } from '~/types/reimbursement'
import { STATUS_COLORS, REIMBURSEMENT_STATUSES } from '~/utils/constants'

const props = defineProps<{
  status: ReimbursementStatus
  reimbursementId: string
}>()

const emit = defineEmits<{
  statusChanged: [status: ReimbursementStatus]
}>()

const { updateReimbursement } = useReimbursements()

const isOpen = ref(false)
const loading = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium'
  const colorClass = STATUS_COLORS[props.status] || 'bg-gray-100 text-gray-800'
  return `${base} ${colorClass}`
})

// 计算菜单位置
const menuStyle = computed(() => {
  if (!buttonRef.value) return {}

  const rect = buttonRef.value.getBoundingClientRect()
  const menuWidth = 192 // w-48 = 12rem = 192px

  return {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left + rect.width / 2 - menuWidth / 2}px`,
  }
})

const getStatusColorClass = (status: ReimbursementStatus) => {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    // 强制更新位置
    nextTick(() => {
      updateMenuPosition()
    })
  }
}

const closeDropdown = () => {
  isOpen.value = false
}

// 更新菜单位置
const updateMenuPosition = () => {
  if (!buttonRef.value || !menuRef.value) return

  const rect = buttonRef.value.getBoundingClientRect()
  const menuWidth = 192 // w-48 = 12rem = 192px

  menuRef.value.style.top = `${rect.bottom + 8}px`
  menuRef.value.style.left = `${rect.left + rect.width / 2 - menuWidth / 2}px`
}

const handleStatusChange = async (newStatus: ReimbursementStatus) => {
  if (newStatus === props.status || loading.value) return

  loading.value = true
  try {
    await updateReimbursement(props.reimbursementId, { status: newStatus })
    emit('statusChanged', newStatus)
    closeDropdown()
  } catch (error: any) {
    console.error('Failed to update status:', error)
    const errorMessage = error.message || '更新状态失败，请重试'
    // Use a more user-friendly notification instead of alert
    if (typeof window !== 'undefined') {
      alert(errorMessage)
    }
  } finally {
    loading.value = false
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    // 检查点击是否在菜单内
    if (menuRef.value && menuRef.value.contains(event.target as Node)) {
      return
    }
    closeDropdown()
  }
}

// 监听滚动和窗口大小变化，更新菜单位置
const handleScroll = () => {
  if (isOpen.value) {
    updateMenuPosition()
  }
}

const handleResize = () => {
  if (isOpen.value) {
    updateMenuPosition()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleResize)
})
</script>
