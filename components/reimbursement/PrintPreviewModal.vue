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

        <!-- 表格和附件区域的容器 -->
        <div class="table-with-attachment flex">
          <!-- 主表格 -->
          <table class="reimbursement-table flex-1 border-collapse border-2 border-gray-800"
            style="table-layout: fixed;">
            <!-- 表头 -->
            <thead>
              <tr>
                <th colspan="2" class="border border-gray-800 p-1 bg-gray-50 text-sm" style="width: 60px;">发生日期</th>
                <th colspan="11" class="border border-gray-800 p-1 bg-gray-50 text-sm">报 销 内 容</th>
                <th class="border border-gray-800 p-1 bg-gray-50 text-sm" style="width: 50px;">单据张数</th>
                <th colspan="9" class="border border-gray-800 p-1 bg-gray-50 text-sm">金额</th>
                <th colspan="3" class="border border-gray-800 p-1 bg-gray-50 text-sm" style="width: 80px;">备注</th>
              </tr>
              <tr class="sub-header text-xs">
                <th class="border border-gray-800 p-0.5 bg-gray-50" style="width: 30px;">月</th>
                <th class="border border-gray-800 p-0.5 bg-gray-50" style="width: 30px;">日</th>
                <th colspan="11" class="border border-gray-800 p-0.5 bg-gray-50"></th>
                <th class="border border-gray-800 p-0.5 bg-gray-50"></th>
                <th class="border border-gray-800 p-0.5 bg-gray-50" style="width: 28px;">百</th>
                <th class="border border-gray-800 p-0.5 bg-gray-50" style="width: 28px;">十</th>
                <th class="border border-gray-800 p-0.5 bg-gray-50" style="width: 28px;">万</th>
                <th class="border border-gray-800 p-0.5 bg-gray-50" style="width: 28px;">千</th>
                <th class="border border-gray-800 p-0.5 bg-gray-50" style="width: 28px;">百</th>
                <th class="border border-gray-800 p-0.5 bg-gray-50" style="width: 28px;">十</th>
                <th class="border border-gray-800 p-0.5 bg-gray-50" style="width: 28px;">元</th>
                <th class="border border-gray-800 p-0.5 bg-gray-50" style="width: 28px;">角</th>
                <th class="border border-gray-800 p-0.5 bg-gray-50" style="width: 28px;">分</th>
                <th colspan="3" class="border border-gray-800 p-0.5 bg-gray-50"></th>
              </tr>
            </thead>

            <!-- 明细行 -->
            <tbody>
              <tr v-for="(item, index) in editableData.items" :key="index" class="detail-row" style="height: 36px;">
                <td class="border border-gray-800 p-0.5 text-center text-sm">
                  <input v-model="item.month" type="text" class="w-full text-center outline-none text-sm"
                    maxlength="2" />
                </td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">
                  <input v-model="item.day" type="text" class="w-full text-center outline-none text-sm" maxlength="2" />
                </td>
                <td colspan="11" class="border border-gray-800 p-0.5 text-sm">
                  <input v-model="item.description" type="text" class="w-full outline-none text-sm" />
                </td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">
                  <input v-model="item.invoiceCount" type="text" class="w-full text-center outline-none text-sm"
                    maxlength="3" />
                </td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ item.amountDigits[7] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ item.amountDigits[6] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ item.amountDigits[5] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ item.amountDigits[4] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ item.amountDigits[3] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ item.amountDigits[2] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ item.amountDigits[1] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ item.amountDigits[0] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ item.amountDigits[-1] }}</td>
                <td colspan="3" class="border border-gray-800 p-0.5 text-center text-sm"></td>
              </tr>

              <!-- 空行 -->
              <tr v-for="i in emptyRowCount" :key="`empty-${i}`" class="detail-row" style="height: 36px;">
                <td class="border border-gray-800 p-0.5"></td>
                <td class="border border-gray-800 p-0.5"></td>
                <td colspan="11" class="border border-gray-800 p-0.5"></td>
                <td class="border border-gray-800 p-0.5"></td>
                <td class="border border-gray-800 p-0.5"></td>
                <td class="border border-gray-800 p-0.5"></td>
                <td class="border border-gray-800 p-0.5"></td>
                <td class="border border-gray-800 p-0.5"></td>
                <td class="border border-gray-800 p-0.5"></td>
                <td class="border border-gray-800 p-0.5"></td>
                <td class="border border-gray-800 p-0.5"></td>
                <td class="border border-gray-800 p-0.5"></td>
                <td class="border border-gray-800 p-0.5"></td>
                <td colspan="3" class="border border-gray-800 p-0.5 text-center"></td>
              </tr>
            </tbody>

            <!-- 合计行 -->
            <tfoot>
              <tr class="total-row font-bold">
                <td colspan="13" class="border border-gray-800 p-1 text-sm">
                  合计人民币（大写）{{ totalAmountChinese }}
                </td>
                <td class="border border-gray-800 p-1 text-center text-sm">{{ totalInvoiceCount }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ totalAmountDigits[7] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ totalAmountDigits[6] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ totalAmountDigits[5] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ totalAmountDigits[4] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ totalAmountDigits[3] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ totalAmountDigits[2] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ totalAmountDigits[1] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ totalAmountDigits[0] }}</td>
                <td class="border border-gray-800 p-0.5 text-center text-sm">{{ totalAmountDigits[-1] }}</td>
                <td colspan="3" class="border border-gray-800 p-0.5"></td>
              </tr>
              <!-- 签字栏（在表格内） -->
              <tr class="signature-row-in-table">
                <td colspan="26" class="border-0 p-0">
                  <div class="signature-section-inner flex items-center py-2 text-xs">
                    <div class="flex-1 flex justify-between items-center">
                      <div class="signature-item text-start">
                        <div class="signature-label">总经理</div>
                      </div>

                      <div class="signature-item text-center">
                        <div class="signature-label">区域或部门<br />分管领导</div>
                      </div>
                      <div class="signature-item text-center">
                        <div class="signature-label">财务部<br />审核</div>
                      </div>
                      <div class="signature-item text-center">
                        <div class="signature-label">区域<br />负责人</div>
                      </div>
                      <div class="signature-item text-center">
                        <div class="signature-label">部门<br />负责人</div>
                      </div>
                      <div class="signature-item text-center">
                        <div class="signature-label">报销人</div>
                      </div>
                    <div class="signature-spacer" style="width: 1px;"></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>

          <!-- 附件标识（表格外右侧） -->
          <div
            class="attachment-label flex flex-col justify-center items-center border-2 border-l-0 border-gray-800 px-1 text-xs"
            style="width: 30px;">
            <span>附</span>
            <span>件</span>
            <div class="h-12"></div>
            <span>张</span>
          </div>
        </div>

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

  // 克隆内容并将输入框的值设置为 value 属性
  const clonedContent = printContent.cloneNode(true) as HTMLElement
  const inputs = clonedContent.querySelectorAll('input')
  const originalInputs = printContent.querySelectorAll('input')

  inputs.forEach((input, index) => {
    const originalInput = originalInputs[index] as HTMLInputElement
    input.setAttribute('value', originalInput.value)
  })

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
            size: A4 portrait;
            margin: 10mm;
          }

          @media print {
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
            }

            body {
              transform-origin: top left;
            }

            .print-content {
              width: 100%;
              max-width: 100%;
              transform: scale(1);
              transform-origin: top left;
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
              width: 100%;
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
        ${clonedContent.innerHTML}
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
