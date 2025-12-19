<template>
  <div>
    <!-- 公司名称 -->
    <div class="company-header flex items-center justify-between text-xl font-bold mb-1">
      <!-- 公司 Logo -->
      <img v-if="companyLogo && includePrintLogo" :src="companyLogo" alt="公司Logo" class="company-logo" />
      <input v-model="editableData.companyName" type="text"
        class="flex-1 text-center border-b border-gray-300 focus:border-primary-500 outline-none" />
      <div v-if="companyLogo && includePrintLogo" class="company-logo-placeholder" style="width: 120px; height: 60px;">
      </div>
    </div>

    <!-- 报销日期和标题 -->
    <div class="title-section mb-1 relative">
      <div class="text-sm absolute left-0 bottom-0">
        报销日期：<input v-model="editableData.reimbursementDate" type="text"
          class="border-b border-gray-300 focus:border-primary-500 outline-none w-32" />
      </div>
      <div class="main-title text-2xl font-bold tracking-widest text-center w-full">出差旅费报销单</div>
    </div>

    <!-- 表格和附件区域的容器 -->
    <div class="table-with-attachment flex">
      <!-- 主表格 -->
      <table class="travel-table flex-1 border-collapse border-2 border-gray-800" style="table-layout: fixed; width: 100%;">
        <!-- 定义列宽 -->
        <colgroup>
          <col style="width: 2%;">  <!-- 月 -->
          <col style="width: 2%;">  <!-- 日 -->
          <col style="width: 2%;">  <!-- 时 -->
          <col style="width: 8%;">  <!-- 出发地点 -->
          <col style="width: 2%;">  <!-- 月 -->
          <col style="width: 2%;">  <!-- 日 -->
          <col style="width: 2%;">  <!-- 时 -->
          <col style="width: 8%;">  <!-- 到达地点 -->
          <col style="width: 5%;">  <!-- 交通工具 -->
          <col style="width: 4%;">  <!-- 单据张数 -->
          <col style="width: 9%;">  <!-- 车船费 -->
          <col style="width: 2%;">  <!-- 伙食天 -->
          <col style="width: 6%;">  <!-- 伙食元/天 -->
          <col style="width: 7%;">  <!-- 伙食金额 -->
          <col style="width: 2%;">  <!-- 交通天 -->
          <col style="width: 6%;">  <!-- 交通元/天 -->
          <col style="width: 9%;">  <!-- 交通金额 -->
          <col style="width: 5%;">  <!-- 其他项目 -->
          <col style="width: 4%;">  <!-- 其他单据 -->
          <col style="width: 9%;">  <!-- 其他金额 -->
        </colgroup>
        <!-- 表头 -->
        <thead>
          <!-- 基本信息行 -->
          <tr class="info-row-in-table">
            <td colspan="3" class="border border-gray-800 p-1 text-xs bg-gray-50">部门</td>
            <td colspan="5" class="border border-gray-800 p-1 text-xs">
              <input v-model="editableData.department" type="text" class="w-full outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-1 text-xs bg-gray-50">出差人</td>
            <td colspan="4" class="border border-gray-800 p-1 text-xs">
              <input v-model="editableData.traveler" type="text" class="w-full outline-none text-xs" />
            </td>
            <td  colspan="2" class="border border-gray-800 p-1 text-xs bg-gray-50">出差事由</td>
            <td colspan="5" class="border border-gray-800 p-1 text-xs">
              <input v-model="editableData.travelReason" type="text" class="w-full outline-none text-xs" />
            </td>
          </tr>

          <tr>
            <th colspan="4" class="border border-gray-800 p-1 bg-gray-50 text-xs">出发</th>
            <th colspan="4" class="border border-gray-800 p-1 bg-gray-50 text-xs">到达</th>
            <th colspan="1" rowspan="2" class="border border-gray-800 p-0.5 bg-gray-50 text-xs">交通工具</th>
            <th colspan="1" rowspan="2" class="border border-gray-800 p-0.5 bg-gray-50 text-xs">单据张数</th>
            <th colspan="1" rowspan="2" class="border border-gray-800 p-0.5 bg-gray-50 text-xs">车船费</th>
            <th colspan="3" class="border border-gray-800 p-1 bg-gray-50 text-xs">伙食补贴</th>
            <th colspan="3" class="border border-gray-800 p-1 bg-gray-50 text-xs">交通补贴</th>
            <th colspan="3" rowspan="1" class="border border-gray-800 p-1 bg-gray-50 text-xs">其他费用</th>
          </tr>
          <tr>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">月</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">日</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">时</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">地点</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">月</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">日</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">时</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">地点</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">天</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">元/天</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">金额</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">天</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">元/天</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">金额</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">项目</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">单据</th>
            <th class="border border-gray-800 p-0.5 bg-gray-50 text-xs">金额</th>
          </tr>
        </thead>

        <!-- 明细行 -->
        <tbody>
          <tr v-for="(item, index) in editableData.items" :key="index" class="detail-row" style="height: 32px;">
            <!-- 出发：月、日、时、地点 -->
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.departureMonth" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.departureDay" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.departureTime" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.departurePlace" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <!-- 到达：月、日、时、地点 -->
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.arrivalMonth" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.arrivalDay" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.arrivalTime" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.arrivalPlace" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <!-- 交通 -->
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.transportation" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.invoiceCount" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.transportFee" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <!-- 伙食补贴 -->
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.mealDays" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.mealRatePerDay" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.mealAmount" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <!-- 交通补贴 -->
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.transportDays" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.transportRatePerDay" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.transportAmount" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <!-- 其他费用 -->
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.otherProject" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.otherInvoiceCount" type="text" class="w-full text-center outline-none text-xs" />
            </td>
            <td class="border border-gray-800 p-0.5 text-center text-xs">
              <input v-model="item.otherAmount" type="text" class="w-full text-center outline-none text-xs" />
            </td>
          </tr>

          <!-- 空行 -->
          <tr v-for="i in emptyRowCount" :key="`empty-${i}`" class="detail-row" style="height: 32px;">
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
          </tr>
        </tbody>

        <!-- 合计行 -->
        <tfoot>
          <tr class="total-row">
            <td colspan="10" class="border border-gray-800 p-1 text-xs">合计</td>
            <td class="border border-gray-800 p-1 text-center text-xs">{{ totalTransportFee }}</td>
            <td colspan="2" class="border border-gray-800 p-1 text-xs"></td>
            <td class="border border-gray-800 p-1 text-center text-xs">{{ totalMealAmount }}</td>
            <td colspan="2" class="border border-gray-800 p-1 text-xs"></td>
            <td class="border border-gray-800 p-1 text-center text-xs">{{ totalTransportAmount }}</td>
            <td class="border border-gray-800 p-1 text-xs"></td>
            <td class="border border-gray-800 p-1 text-center text-xs">{{ totalOtherInvoiceCount }}</td>
            <td class="border border-gray-800 p-1 text-center text-xs">{{ totalOtherAmount }}</td>
          </tr>

          <!-- 报销总额行 -->
          <tr class="summary-row">
            <td colspan="2" rowspan="2" class="border border-gray-800 p-1 text-xs text-center">报销<br/>总额</td>
            <td colspan="2" rowspan="2" class="border border-gray-800 p-1 text-xs text-center">人民币<br></br>（大写）</td>
            <td colspan="9" rowspan="2" class="border border-gray-800 p-1 text-xs">
              <div class="flex justify-between items-center">
                <span>{{ totalAmountChinese }}</span>
                <span class="text-xs">¥{{ totalAmount.toFixed(2) }}</span>
              </div>
            </td>
            <td colspan="2" rowspan="2" class="border border-gray-800 p-1 text-xs text-center">预支<br/>旅费</td>
            <td colspan="2" rowspan="2" class="border border-gray-800 p-1 text-xs text-center">
              <div class="text-center">
                <span >月</span>
                <span class="ml-5">日</span>
              </div>
            </td>
            <td colspan="3" class="border border-gray-800 p-1 text-xs text-start">补领不足：</td>
          </tr>
          <tr class="summary-row">
            <td colspan="3" class="border border-gray-800 p-1 text-xs text-start">归还多余：</td>
          </tr>

          <!-- 签字栏（在表格内） -->
          <tr class="signature-row-in-table">
            <td colspan="20" class="border-0 p-0">
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

    </div>
  </div>
</template>

<script setup lang="ts">
import type { Reimbursement } from '~/types/reimbursement'
import { formatDate } from '~/utils/formatters'

interface Props {
  reimbursement: Reimbursement
  companyLogo?: string | null
  includePrintLogo?: boolean
}

interface EditableTravelItem {
  departureMonth: string
  departureDay: string
  departureTime: string
  departurePlace: string
  arrivalMonth: string
  arrivalDay: string
  arrivalTime: string
  arrivalPlace: string
  transportation: string
  invoiceCount: string
  transportFee: string
  mealDays: string
  mealRatePerDay: string
  mealAmount: string
  transportDays: string
  transportRatePerDay: string
  transportAmount: string
  otherProject: string
  otherInvoiceCount: string
  otherAmount: string
}

interface EditableData {
  companyName: string
  department: string
  traveler: string
  travelReason: string
  reimbursementDate: string
  items: EditableTravelItem[]
}

const props = defineProps<Props>()

// 初始化可编辑数据
const editableData = ref<EditableData>({
  companyName: props.reimbursement.company?.name || '绿晶环境服务集团有限公司',
  department: '信息部',
  traveler: '王晨佳',
  travelReason: props.reimbursement.title || '',
  reimbursementDate: formatDate(new Date()),
  items: []
})

// 初始化明细项
const initializeItems = () => {
  const items = props.reimbursement.items || []

  // 分离车船费和其他费用
  const transportItems = items.filter(item => item.category === '飞机' || item.category === '火车')
  const otherItems = items.filter(item => item.category !== '飞机' && item.category !== '火车')

  // 车船费按日期分组
  const transportByDate = new Map<string, typeof items>()
  transportItems.forEach(item => {
    const date = new Date(item.date)
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    if (!transportByDate.has(dateKey)) {
      transportByDate.set(dateKey, [])
    }
    transportByDate.get(dateKey)!.push(item)
  })

  // 其他费用按类型分组
  const otherByCategory = new Map<string, typeof items>()
  otherItems.forEach(item => {
    const categoryKey = item.category === '其他' ? (item.description || '其他') : item.category
    if (!otherByCategory.has(categoryKey)) {
      otherByCategory.set(categoryKey, [])
    }
    otherByCategory.get(categoryKey)!.push(item)
  })

  // 生成车船费行数据
  const transportRows = Array.from(transportByDate.values()).map(dateItems => {
    const firstItem = dateItems[0]
    const date = new Date(firstItem.date)
    const month = String(date.getMonth() + 1)
    const day = String(date.getDate())
    const hours = String(date.getHours()).padStart(2, '0')

    const totalTransportFee = dateItems.reduce((sum, item) => sum + item.amount, 0)
    const totalTransportInvoices = dateItems.reduce((sum, item) => sum + (item.invoiceBoxes?.length || 0), 0)
    const transportTypes = dateItems.map(item => item.category).join('/')

    return {
      departureMonth: month,
      departureDay: day,
      departureTime: hours,
      departurePlace: firstItem.departure || '',
      arrivalMonth: month,
      arrivalDay: day,
      arrivalTime: hours,
      arrivalPlace: firstItem.arrival || '',
      transportation: transportTypes,
      invoiceCount: String(totalTransportInvoices),
      transportFee: totalTransportFee.toFixed(2),
      mealDays: '',
      mealRatePerDay: '',
      mealAmount: '',
      transportDays: '',
      transportRatePerDay: '',
      transportAmount: '',
      otherProject: '',
      otherInvoiceCount: '',
      otherAmount: ''
    }
  })

  // 生成其他费用行数据
  const otherRows = Array.from(otherByCategory.entries()).map(([categoryName, categoryItems]) => {
    const totalOtherAmount = categoryItems.reduce((sum, item) => sum + item.amount, 0)
    const totalOtherInvoices = categoryItems.reduce((sum, item) => sum + (item.invoiceBoxes?.length || 0), 0)

    return {
      departureMonth: '',
      departureDay: '',
      departureTime: '',
      departurePlace: '',
      arrivalMonth: '',
      arrivalDay: '',
      arrivalTime: '',
      arrivalPlace: '',
      transportation: '',
      invoiceCount: '',
      transportFee: '',
      mealDays: '',
      mealRatePerDay: '',
      mealAmount: '',
      transportDays: '',
      transportRatePerDay: '',
      transportAmount: '',
      otherProject: categoryName,
      otherInvoiceCount: String(totalOtherInvoices),
      otherAmount: totalOtherAmount.toFixed(2)
    }
  })

  // 合并行：按行索引合并车船费和其他费用
  const maxRows = Math.max(transportRows.length, otherRows.length)
  const rows: EditableTravelItem[] = []

  for (let i = 0; i < maxRows; i++) {
    const transportRow = transportRows[i]
    const otherRow = otherRows[i]

    if (transportRow && otherRow) {
      // 两者都存在，合并到同一行
      rows.push({
        ...transportRow,
        otherProject: otherRow.otherProject,
        otherInvoiceCount: otherRow.otherInvoiceCount,
        otherAmount: otherRow.otherAmount
      })
    } else if (transportRow) {
      // 只有车船费
      rows.push(transportRow)
    } else if (otherRow) {
      // 只有其他费用
      rows.push(otherRow)
    }
  }

  editableData.value.items = rows
}

// 计算属性
const emptyRowCount = computed(() => {
  return Math.max(0, 5 - editableData.value.items.length)
})

const totalTransportFee = computed(() => {
  return editableData.value.items.reduce((sum, item) => {
    return sum + (parseFloat(item.transportFee) || 0)
  }, 0).toFixed(2)
})

const totalMealAmount = computed(() => {
  return editableData.value.items.reduce((sum, item) => {
    return sum + (parseFloat(item.mealAmount) || 0)
  }, 0).toFixed(2)
})

const totalTransportAmount = computed(() => {
  return editableData.value.items.reduce((sum, item) => {
    return sum + (parseFloat(item.transportAmount) || 0)
  }, 0).toFixed(2)
})

const totalOtherInvoiceCount = computed(() => {
  return editableData.value.items.reduce((sum, item) => {
    return sum + (parseInt(item.otherInvoiceCount) || 0)
  }, 0)
})

const totalOtherAmount = computed(() => {
  return editableData.value.items.reduce((sum, item) => {
    return sum + (parseFloat(item.otherAmount) || 0)
  }, 0).toFixed(2)
})

const totalAmount = computed(() => {
  return parseFloat(totalTransportFee.value) +
    parseFloat(totalMealAmount.value) +
    parseFloat(totalTransportAmount.value) +
    parseFloat(totalOtherAmount.value)
})

const totalAmountChinese = computed(() => {
  return convertToChinese(totalAmount.value)
})

// 工具函数
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

// 初始化
onMounted(() => {
  initializeItems()
})

// 监听 props 变化
watch(() => props.reimbursement, () => {
  initializeItems()
}, { deep: true })
</script>

<style scoped>
.travel-table input {
  background: transparent;
  padding: 1px;
  word-break: break-all;
  overflow-wrap: break-word;
  white-space: normal;
  line-height: 1.2;
  min-height: 100%;
}

.travel-table input:focus {
  background: #fef3c7;
}

/* 防止打印时内容被裁剪 */
.travel-table td,
.travel-table th {
  word-break: break-all;
  overflow-wrap: break-word;
  white-space: normal;
  overflow: visible;
}

/* 地点列特殊处理 - 允许更多换行 */
.travel-table td:nth-child(4),
.travel-table td:nth-child(8) {
  font-size: 10px;
  line-height: 1.1;
}

/* 车船费、金额列 - 确保数字不被截断 */
.travel-table td:nth-child(11),
.travel-table td:nth-child(14),
.travel-table td:nth-child(17),
.travel-table td:nth-child(20) {
  font-size: 10px;
  padding: 0.5px !important;
}

/* 打印时的特殊处理 */
@media print {
  .travel-table {
  }

  .travel-table input {
    word-break: break-all;
    overflow-wrap: break-word;
    white-space: normal;
    overflow: visible;
    line-height: 1.1 !important;
    padding: 0 !important;
  }

  .travel-table td,
  .travel-table th {
    overflow: visible !important;
    white-space: normal !important;
    padding: 1px !important;
    word-break: break-all;
    overflow-wrap: break-word;
  }

  /* 表头字体缩小 */
  .travel-table th {
    line-height: 1.1 !important;
  }

  /* 月、日、时、天列宽度缩小 */
  .travel-table th:nth-child(1),
  .travel-table th:nth-child(2),
  .travel-table th:nth-child(3),
  .travel-table th:nth-child(5),
  .travel-table th:nth-child(6),
  .travel-table th:nth-child(7),
  .travel-table th:nth-child(9),
  .travel-table th:nth-child(12),
  .travel-table td:nth-child(1),
  .travel-table td:nth-child(2),
  .travel-table td:nth-child(3),
  .travel-table td:nth-child(5),
  .travel-table td:nth-child(6),
  .travel-table td:nth-child(7),
  .travel-table td:nth-child(9),
  .travel-table td:nth-child(12) {
    width: 18px !important;
    max-width: 18px !important;
  }

  /* 单据列宽度缩小 */
  .travel-table th:nth-child(10),
  .travel-table th:nth-child(16),
  .travel-table td:nth-child(10),
  .travel-table td:nth-child(16) {
    width: 18px !important;
    max-width: 18px !important;
  }

  /* 所有行保持固定高度，但单元格内容可以换行 */
  .detail-row {
    height: 32px !important;
  }

  /* 单元格内容垂直居中 */
  .detail-row td {
    vertical-align: middle !important;
  }

  /* 地点列打印时更小字体 */
  .travel-table td:nth-child(4),
  .travel-table td:nth-child(8) {
    line-height: 1.0 !important;
  }

  /* 车船费、金额列打印时优化 */
  .travel-table td:nth-child(11),
  .travel-table td:nth-child(14),
  .travel-table td:nth-child(17),
  .travel-table td:nth-child(20) {
    padding: 0 !important;
  }

  /* 交通工具列 */
  .travel-table td:nth-child(9) {
    line-height: 1.0 !important;
  }

  /* 项目列 */
  .travel-table td:nth-child(18) {
    line-height: 1.0 !important;
  }

  /* 合计行字体 */
  .total-row td {
  }

  /* 报销总额行 */
  .summary-row td {
  }

  /* 签字栏 */
  .signature-row-in-table td {
  }

  /* 基本信息行（部门、出差人、出差事由） */
  .info-row-in-table td {
  }

  .info-row-in-table input {
  }
}

/* 公司 Logo 样式 */
.company-logo {
  height: 60px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
  margin-right: 8px;
}
</style>
