<template>
  <UiModal v-model="isOpen" title="打印预览" size="xl">
    <div class="print-preview-container">
      <!-- 预览内容 -->
      <div id="print-content" class="print-content bg-white p-8 border border-gray-200 rounded-lg">
        <!-- 公司名称 -->
        <div class="company-header text-center text-xl font-bold mb-4">
          <input v-model="editableData.companyName" type="text"
            class="w-full text-center border-b border-gray-300 focus:border-primary-500 outline-none" />
        </div>

        <!-- 部门和标题 -->
        <div class="title-row flex justify-between items-center mb-4">
          <div class="department flex items-center gap-2">
            <span>部门：</span>
            <input v-model="editableData.department" type="text"
              class="border-b border-gray-300 focus:border-primary-500 outline-none w-32" />
          </div>
          <div class="main-title text-2xl font-bold tracking-widest">
            现 金 报 销 单
          </div>
          <div class="w-32"></div>
        </div>

        <!-- 主表格 -->
        <table class="reimbursement-table w-full border-collapse border-2 border-gray-800">
          <!-- 表头 -->
          <thead>
            <tr>
              <th rowspan="2" colspan="2" class="border border-gray-800 p-2 bg-gray-50 align-middle">发生日期</th>
              <th rowspan="2" class="border border-gray-800 p-2 bg-gray-50 align-middle w-64">报销内容</th>
              <th rowspan="2" class="border border-gray-800 p-2 bg-gray-50 align-middle w-20">单据<br />张数</th>
              <th colspan="9" class="border border-gray-800 p-2 bg-gray-50">金额</th>
              <th rowspan="2" class="border border-gray-800 p-2 bg-gray-50 align-middle w-24">备注</th>
              <th rowspan="2" class="border border-gray-800 p-2 bg-gray-50 align-middle w-12">附<br />件<br /><br />张</th>
            </tr>
            <tr class="sub-header text-sm">
              <th class="border border-gray-800 p-1 bg-gray-50 w-8">百</th>
              <th class="border border-gray-800 p-1 bg-gray-50 w-8">十</th>
              <th class="border border-gray-800 p-1 bg-gray-50 w-8">万</th>
              <th class="border border-gray-800 p-1 bg-gray-50 w-8">千</th>
              <th class="border border-gray-800 p-1 bg-gray-50 w-8">百</th>
              <th class="border border-gray-800 p-1 bg-gray-50 w-8">十</th>
              <th class="border border-gray-800 p-1 bg-gray-50 w-8">元</th>
              <th class="border border-gray-800 p-1 bg-gray-50 w-8">角</th>
              <th class="border border-gray-800 p-1 bg-gray-50 w-8">分</th>
            </tr>
            <tr class="sub-header text-sm">
              <th class="border border-gray-800 p-1 bg-gray-50 w-10">月</th>
              <th class="border border-gray-800 p-1 bg-gray-50 w-10">日</th>
              <th class="border border-gray-800 p-1 bg-gray-50"></th>
              <th class="border border-gray-800 p-1 bg-gray-50"></th>
              <th class="border border-gray-800 p-1 bg-gray-50"></th>
              <th class="border border-gray-800 p-1 bg-gray-50"></th>
              <th class="border border-gray-800 p-1 bg-gray-50"></th>
              <th class="border border-gray-800 p-1 bg-gray-50"></th>
              <th class="border border-gray-800 p-1 bg-gray-50"></th>
              <th class="border border-gray-800 p-1 bg-gray-50"></th>
              <th class="border border-gray-800 p-1 bg-gray-50"></th>
              <th class="border border-gray-800 p-1 bg-gray-50"></th>
              <th class="border border-gray-800 p-1 bg-gray-50"></th>
              <th class="border border-gray-800 p-1 bg-gray-50"></th>
              <th class="border border-gray-800 p-1 bg-gray-50"></th>
            </tr>
          </thead>

          <!-- 明细行 -->
          <tbody>
            <tr v-for="(item, index) in editableData.items" :key="index" class="detail-row">
              <td class="border border-gray-800 p-1 text-center w-10">
                <input v-model="item.month" type="text" class="w-full text-center outline-none" maxlength="2" />
              </td>
              <td class="border border-gray-800 p-1 text-center w-10">
                <input v-model="item.day" type="text" class="w-full text-center outline-none" maxlength="2" />
              </td>
              <td class="border border-gray-800 p-1">
                <input v-model="item.description" type="text" class="w-full outline-none" />
              </td>
              <td class="border border-gray-800 p-1 text-center">
                <input v-model="item.invoiceCount" type="text" class="w-full text-center outline-none"
                  maxlength="3" />
              </td>
              <td class="border border-gray-800 p-1 text-center w-8">{{ item.amountDigits[7] }}</td>
              <td class="border border-gray-800 p-1 text-center w-8">{{ item.amountDigits[6] }}</td>
              <td class="border border-gray-800 p-1 text-center w-8">{{ item.amountDigits[5] }}</td>
              <td class="border border-gray-800 p-1 text-center w-8">{{ item.amountDigits[4] }}</td>
              <td class="border border-gray-800 p-1 text-center w-8">{{ item.amountDigits[3] }}</td>
              <td class="border border-gray-800 p-1 text-center w-8">{{ item.amountDigits[2] }}</td>
              <td class="border border-gray-800 p-1 text-center w-8">{{ item.amountDigits[1] }}</td>
              <td class="border border-gray-800 p-1 text-center w-8">{{ item.amountDigits[0] }}</td>
              <td class="border border-gray-800 p-1 text-center w-8">{{ item.amountDigits[-1] }}</td>
              <td class="border border-gray-800 p-1 text-center"></td>
              <td rowspan="4" class="border border-gray-800 p-1 text-center align-middle" v-if="index === 0"></td>
            </tr>

            <!-- 空行 -->
            <tr v-for="i in emptyRowCount" :key="`empty-${i}`" class="detail-row">
              <td class="border border-gray-800 p-1 h-10"></td>
              <td class="border border-gray-800 p-1"></td>
              <td class="border border-gray-800 p-1"></td>
              <td class="border border-gray-800 p-1"></td>
              <td class="border border-gray-800 p-1"></td>
              <td class="border border-gray-800 p-1"></td>
              <td class="border border-gray-800 p-1"></td>
              <td class="border border-gray-800 p-1"></td>
              <td class="border border-gray-800 p-1"></td>
              <td class="border border-gray-800 p-1"></td>
              <td class="border border-gray-800 p-1"></td>
              <td class="border border-gray-800 p-1"></td>
              <td class="border border-gray-800 p-1"></td>
              <td class="border border-gray-800 p-1 text-center"></td>
            </tr>
          </tbody>

          <!-- 合计行 -->
          <tfoot>
            <tr class="total-row font-bold">
              <td colspan="3" class="border border-gray-800 p-2">
                合计人民币（大写）{{ totalAmountChinese }}
              </td>
              <td class="border border-gray-800 p-2 text-center">{{ totalInvoiceCount }}</td>
              <td class="border border-gray-800 p-1 text-center">{{ totalAmountDigits[7] }}</td>
              <td class="border border-gray-800 p-1 text-center">{{ totalAmountDigits[6] }}</td>
              <td class="border border-gray-800 p-1 text-center">{{ totalAmountDigits[5] }}</td>
              <td class="border border-gray-800 p-1 text-center">{{ totalAmountDigits[4] }}</td>
              <td class="border border-gray-800 p-1 text-center">{{ totalAmountDigits[3] }}</td>
              <td class="border border-gray-800 p-1 text-center">{{ totalAmountDigits[2] }}</td>
              <td class="border border-gray-800 p-1 text-center">{{ totalAmountDigits[1] }}</td>
              <td class="border border-gray-800 p-1 text-center">{{ totalAmountDigits[0] }}</td>
              <td class="border border-gray-800 p-1 text-center">{{ totalAmountDigits[-1] }}</td>
              <td class="border border-gray-800 p-1"></td>
              <td class="border border-gray-800 p-1"></td>
            </tr>
            <!-- 签字栏（在表格内） -->
            <tr class="signature-row">
              <td colspan="2" class="border border-gray-800 p-2 text-center text-xs">总经理</td>
              <td colspan="2" class="border border-gray-800 p-2 text-center text-xs">区域或部门<br />分管领导</td>
              <td colspan="2" class="border border-gray-800 p-2 text-center text-xs">财务部<br />审核</td>
              <td colspan="2" class="border border-gray-800 p-2 text-center text-xs">区域<br />负责人</td>
              <td colspan="2" class="border border-gray-800 p-2 text-center text-xs">部门<br />负责人</td>
              <td colspan="2" class="border border-gray-800 p-2 text-center text-xs">报销人</td>
              <td colspan="3" class="border border-gray-800 p-2"></td>
            </tr>
          </tfoot>
        </table>

        <!-- 报销日期 -->
        <div class="footer-date text-right mt-4">
          <span>报销日期：</span>
          <input v-model="editableData.reimbursementDate" type="text"
            class="border-b border-gray-300 focus:border-primary-500 outline-none w-48" />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end gap-3 mt-6">
        <UiButton variant="secondary" @click="handleClose">
          取消
        </UiButton>
        <UiButton @click="handlePrint">
          打印
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import type { Reimbursement } from '~/types/reimbursement'
import { formatDate } from '~/utils/formatters'

interface Props {
  modelValue: boolean
  reimbursement: Reimbursement
}

interface EditableItem {
  month: string
  day: string
  description: string
  invoiceCount: string
  amount: number
  amountDigits: Record<number, string>
}

interface EditableData {
  companyName: string
  department: string
  items: EditableItem[]
  reimbursementDate: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 初始化可编辑数据
const editableData = ref<EditableData>({
  companyName: props.reimbursement.company?.name || '绿晶环境服务集团有限公司',
  department: '信息部',
  items: [],
  reimbursementDate: formatDate(new Date())
})

// 初始化明细项
const initializeItems = () => {
  const items = props.reimbursement.items || []
  editableData.value.items = items.map(item => {
    const date = new Date(item.date)
    return {
      month: String(date.getMonth() + 1),
      day: String(date.getDate()),
      description: item.description || getCategoryName(item.category),
      invoiceCount: String(item.invoices?.length || 0),
      amount: item.amount,
      amountDigits: getAmountDigits(item.amount)
    }
  })
}

// 计算属性
const emptyRowCount = computed(() => {
  return Math.max(0, 3 - editableData.value.items.length)
})

const totalAmount = computed(() => {
  return editableData.value.items.reduce((sum, item) => sum + item.amount, 0)
})

const totalInvoiceCount = computed(() => {
  return editableData.value.items.reduce((sum, item) => sum + parseInt(item.invoiceCount || '0'), 0)
})

const totalAmountDigits = computed(() => {
  return getAmountDigits(totalAmount.value)
})

const totalAmountChinese = computed(() => {
  return convertToChinese(totalAmount.value)
})

// 工具函数
const getCategoryName = (category: string) => {
  const categoryMap: Record<string, string> = {
    TRANSPORTATION: '交通费',
    ACCOMMODATION: '住宿费',
    MEALS: '餐费',
    OFFICE_SUPPLIES: '办公用品',
    COMMUNICATION: '通讯费',
    ENTERTAINMENT: '招待费',
    TRAINING: '培训费',
    OTHER: '其他'
  }
  return categoryMap[category] || category
}

const getAmountDigits = (amount: number): Record<number, string> => {
  const digits: Record<number, string> = {}

  const amountStr = amount.toFixed(2)
  const [integerPart, decimalPart] = amountStr.split('.')

  // 整数部分 (position 1-7)
  const intDigits = integerPart.padStart(7, ' ').split('').reverse()
  for (let i = 0; i < 7; i++) {
    const digit = intDigits[i]
    digits[i + 1] = digit === ' ' ? '' : digit
  }

  // 角和分
  digits[0] = decimalPart[0] || '0'
  digits[-1] = decimalPart[1] || '0'

  // 找到最高位有效数字的位置，在其左侧显示￥符号
  for (let i = 7; i >= 1; i--) {
    if (digits[i] && digits[i] !== '') {
      // 在最高位左侧的位置显示￥
      if (i < 7) {
        digits[i + 1] = '￥'
      }
      break
    }
  }

  return digits
}

const convertToChinese = (amount: number): string => {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿']

  if (amount === 0) return '零元整'

  const [integerPart, decimalPart] = amount.toFixed(2).split('.')
  let result = ''

  // 处理整数部分
  const intNum = parseInt(integerPart)
  if (intNum === 0) {
    result = '零'
  } else {
    const intStr = intNum.toString()
    let zeroCount = 0

    for (let i = 0; i < intStr.length; i++) {
      const digit = parseInt(intStr[i])
      const unit = units[intStr.length - i - 1]

      if (digit === 0) {
        zeroCount++
      } else {
        if (zeroCount > 0) {
          result += '零'
        }
        result += digits[digit] + unit
        zeroCount = 0
      }

      // 处理万位
      if ((intStr.length - i - 1) === 4 && digit === 0 && result.indexOf('万') === -1) {
        result += '万'
        zeroCount = 0
      }
    }
  }

  result += '元'

  // 处理小数部分
  const jiao = parseInt(decimalPart[0])
  const fen = parseInt(decimalPart[1])

  if (jiao === 0 && fen === 0) {
    result += '整'
  } else {
    if (jiao > 0) {
      result += digits[jiao] + '角'
    }
    if (fen > 0) {
      if (jiao === 0) {
        result += '零'
      }
      result += digits[fen] + '分'
    }
  }

  return result
}

const handleClose = () => {
  isOpen.value = false
}

const handlePrint = () => {
  // 打印指定区域
  const printContent = document.getElementById('print-content')
  if (!printContent) return

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  // 获取当前页面的所有样式表
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n')
      } catch (e) {
        // 跨域样式表可能无法访问
        return ''
      }
    })
    .join('\n')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>现金报销单</title>
        <meta charset="UTF-8">
        <style>
          /* 引入页面的所有样式 */
          ${styles}

          /* 打印专用样式 */
          @page {
            size: A4;
            margin: 20mm;
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
            }

            /* 隐藏输入框边框 */
            input {
              border: none !important;
              outline: none !important;
            }

            /* 确保背景色打印 */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            /* 防止分页 */
            .print-content {
              page-break-inside: avoid;
            }

            table {
              page-break-inside: avoid;
            }
          }

          /* 屏幕显示样式 */
          @media screen {
            body {
              padding: 20px;
              background: #f5f5f5;
            }

            .print-content {
              max-width: 210mm;
              margin: 0 auto;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
          }

          /* 确保输入框内容可见 */
          input {
            border: none !important;
            outline: none !important;
            background: transparent !important;
            font-family: inherit;
            font-size: inherit;
            color: inherit;
            padding: 0;
          }

          /* 移除可能影响布局的样式 */
          input:focus {
            background: transparent !important;
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()

  // 等待内容和样式加载后打印
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 500)
}

// 监听弹框打开，初始化数据
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initializeItems()
  }
})

// 初始化
onMounted(() => {
  if (props.modelValue) {
    initializeItems()
  }
})
</script>

<style scoped>
.print-preview-container {
  max-height: 80vh;
  overflow-y: auto;
}

.print-content {
  font-family: 'SimSun', '宋体', serif;
}

.reimbursement-table input {
  background: transparent;
  padding: 2px;
}

.reimbursement-table input:focus {
  background: #fef3c7;
}

/* 隐藏数字输入框的上下箭头 */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
