<template>
  <ClientOnly>
    <div class="w-full">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-gray-600">加载统计数据中...</p>
      </div>
      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600">{{ error }}</p>
      </div>
      <div v-else-if="!hasData" class="text-center py-12">
        <p class="text-gray-600">暂无统计数据</p>
      </div>
      <div v-else class="w-full" style="position: relative; height: 400px;">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>
    <template #fallback>
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-gray-600">加载图表中...</p>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'

// 注册 Chart.js 组件（仅在客户端）
if (process.client) {
  Chart.register(...registerables)
}

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)
const error = ref('')
const chartInstance = ref<Chart | null>(null)

interface StatsData {
  stats: {
    [companyName: string]: {
      [status: string]: number
    }
  }
  statuses: string[]
  companies: string[]
}

const statsData = ref<StatsData | null>(null)

const hasData = computed(() => {
  return statsData.value && statsData.value.companies.length > 0
})

// 为每个状态定义颜色
const statusColors: { [key: string]: string } = {
  '待整理': '#EF4444',      // 红色
  '待打印单据': '#F59E0B',  // 橙色
  '待审批': '#3B82F6',      // 蓝色
  '待打款': '#8B5CF6',      // 紫色
  '已完成': '#10B981'       // 绿色
}

// 获取统计数据
const fetchStats = async () => {
  try {
    loading.value = true
    error.value = ''

    console.log('开始获取统计数据...')
    const response = await $fetch('/api/reimbursements/stats')
    console.log('统计数据响应:', response)

    statsData.value = response.data as StatsData
    console.log('解析后的统计数据:', statsData.value)
    console.log('是否有数据:', hasData.value)
  } catch (err: any) {
    error.value = err.message || '获取统计数据失败'
    console.error('获取统计数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 监听数据和 canvas 元素，当两者都准备好时渲染图表
watch([() => chartCanvas.value, () => statsData.value, () => loading.value], async ([canvas, data, isLoading]) => {
  console.log('watch 触发:', { canvas, data, isLoading })

  if (!isLoading && canvas && data && data.companies.length > 0) {
    // 等待下一个 tick 确保 DOM 完全更新
    await nextTick()
    console.log('准备渲染图表')
    renderChart()
  }
}, { immediate: false })

// 渲染图表
const renderChart = () => {
  console.log('renderChart 被调用')
  console.log('chartCanvas.value:', chartCanvas.value)
  console.log('statsData.value:', statsData.value)

  if (!chartCanvas.value || !statsData.value) {
    console.log('canvas 或 statsData 不存在，退出渲染')
    return
  }

  // 销毁旧的图表实例
  if (chartInstance.value) {
    console.log('销毁旧的图表实例')
    chartInstance.value.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) {
    console.log('无法获取 canvas context')
    return
  }

  const { stats, statuses, companies } = statsData.value
  console.log('公司列表:', companies)
  console.log('状态列表:', statuses)
  console.log('统计数据:', stats)

  // 准备数据集
  const datasets = statuses.map(status => ({
    label: status,
    data: companies.map(company => stats[company][status] || 0),
    backgroundColor: statusColors[status] || '#6B7280',
    borderColor: statusColors[status] || '#6B7280',
    borderWidth: 1
  }))

  console.log('数据集:', datasets)

  // 创建图表
  try {
    chartInstance.value = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: companies,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
          title: {
            display: true,
            text: '各公司报销单金额统计（按状态分组）',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || ''
                const value = context.parsed.y || 0
                return `${label}: ¥${value.toFixed(2)}`
              }
            }
          }
        },
        scales: {
          x: {
            stacked: false,
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            stacked: false,
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: function(value) {
                return '¥' + value.toLocaleString()
              },
              font: {
                size: 11
              }
            },
            title: {
              display: true,
              text: '金额（元）',
              font: {
                size: 12,
                weight: 'bold'
              }
            }
          }
        }
      }
    })
    console.log('图表创建成功:', chartInstance.value)
  } catch (err) {
    console.error('创建图表失败:', err)
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchStats()
})

// 组件卸载时销毁图表
onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
})
</script>
