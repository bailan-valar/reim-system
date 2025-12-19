<template>
  <UiModal v-model="isOpen" title="打印预览" size="xlarge">
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

        <!-- 裁剪分割线 -->
        <div class="cut-line-container mt-8">
          <div class="cut-line">
            <span class="cut-line-text">✂</span>
            <div class="cut-line-dashed"></div>
            <span class="cut-line-text">裁剪线</span>
            <div class="cut-line-dashed"></div>
            <span class="cut-line-text">✂</span>
          </div>
        </div>
      </div>

      <!-- 发票打印选项 -->
      <div v-if="invoiceImages.length > 0" class="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="includePrintInvoices" type="checkbox" class="w-4 h-4 text-primary-600 rounded" />
          <span class="text-sm font-medium text-gray-700">
            同时打印发票（共 {{ invoiceImages.length }} 张）
          </span>
        </label>
      </div>

      <!-- PDF 渲染进度提示 -->
      <div v-if="isRenderingPdfs" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div class="flex items-center gap-3 mb-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <h3 class="text-lg font-semibold text-gray-900">正在转换 PDF...</h3>
          </div>

          <div class="space-y-3">
            <p class="text-sm text-gray-600">
              正在将 PDF 发票转换为高清图片以确保打印质量
            </p>

            <!-- Progress bar -->
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div
                class="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                :style="{ width: `${(renderProgress.current / renderProgress.total) * 100}%` }"
              ></div>
            </div>
            <p class="text-xs text-gray-500 text-center">
              {{ renderProgress.current }} / {{ renderProgress.total }}
            </p>
          </div>
        </div>
      </div>

      <!-- PDF 渲染错误提示 -->
      <div v-if="renderError" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <div class="flex-1">
            <h4 class="text-sm font-medium text-red-800">PDF 转换失败</h4>
            <p class="text-sm text-red-700 mt-1">{{ renderError }}</p>
            <button
              @click="renderError = null"
              class="text-sm text-red-600 hover:text-red-800 mt-2 underline"
            >
              关闭
            </button>
          </div>
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
import { renderPdfPageToImage, PdfRenderError } from '~/utils/pdfRenderer'

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

// 是否打印发票
const includePrintInvoices = ref(true)

// PDF 渲染状态
const isRenderingPdfs = ref(false)
const renderProgress = ref({ current: 0, total: 0 })
const renderError = ref<string | null>(null)

// 渲染缓存
const renderedPdfImages = ref<Map<string, string>>(new Map())

// 初始化明细项
const initializeItems = () => {
  const items = props.reimbursement.items || []
  editableData.value.items = items.map(item => {
    const date = new Date(item.date)
    return {
      month: String(date.getMonth() + 1),
      day: String(date.getDate()),
      description: item.description || getCategoryName(item.category),
      invoiceCount: String(item.invoiceBoxes?.length || 0),
      amount: item.amount,
      amountDigits: getAmountDigits(item.amount)
    }
  })
}

// 获取所有发票文件
const invoiceImages = computed(() => {
  const items = props.reimbursement.items || []
  const images: Array<{ url: string; itemId: string; invoiceId: string; fileName: string; isPdf: boolean }> = []

  items.forEach(item => {
    if (item.invoiceBoxes && item.invoiceBoxes.length > 0) {
      item.invoiceBoxes.forEach(invoice => {
        const isPdf = invoice.fileName.toLowerCase().endsWith('.pdf')
        images.push({
          url: invoice.filePath,
          itemId: item.id,
          invoiceId: invoice.id,
          fileName: invoice.fileName,
          isPdf
        })
      })
    }
  })

  return images
})

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

/**
 * Pre-render all PDF invoices to high-quality images
 * This function is called before printing to convert PDFs to images
 */
const renderPdfInvoices = async (): Promise<Map<string, string>> => {
  console.log('[PrintPreview] Starting PDF rendering process')

  const pdfInvoices = invoiceImages.value.filter(inv => inv.isPdf)

  if (pdfInvoices.length === 0) {
    console.log('[PrintPreview] No PDFs to render')
    return new Map()
  }

  isRenderingPdfs.value = true
  renderProgress.value = { current: 0, total: pdfInvoices.length }
  renderError.value = null

  const imageCache = new Map<string, string>()

  try {
    for (let i = 0; i < pdfInvoices.length; i++) {
      const invoice = pdfInvoices[i]
      console.log(`[PrintPreview] Rendering PDF ${i + 1}/${pdfInvoices.length}: ${invoice.fileName}`)

      try {
        // Check if already cached
        if (renderedPdfImages.value.has(invoice.url)) {
          console.log(`[PrintPreview] Using cached image for ${invoice.fileName}`)
          imageCache.set(invoice.url, renderedPdfImages.value.get(invoice.url)!)
          renderProgress.value.current = i + 1
          continue
        }

        // Render PDF to image at 300 DPI
        const result = await renderPdfPageToImage(invoice.url, 1, {
          dpi: 300,
          format: 'image/png',
          maxWidth: 3508, // A4 width at 300 DPI (210mm)
          maxHeight: 4961  // A4 height at 300 DPI (297mm)
        })

        console.log(`[PrintPreview] Successfully rendered ${invoice.fileName}: ${result.width}x${result.height}px`)

        // Cache the result
        imageCache.set(invoice.url, result.dataUrl)
        renderedPdfImages.value.set(invoice.url, result.dataUrl)

        renderProgress.value.current = i + 1
      } catch (error) {
        console.error(`[PrintPreview] Failed to render ${invoice.fileName}:`, error)
        if (error instanceof PdfRenderError) {
          // Handle specific error types
          if (error.code === 'LOAD_FAILED') {
            throw new Error(`无法加载 PDF 文件: ${invoice.fileName}`)
          } else if (error.code === 'MEMORY_ERROR') {
            throw new Error(`PDF 文件过大，内存不足: ${invoice.fileName}`)
          }
        }

        throw new Error(`渲染 PDF 失败: ${invoice.fileName}`)
      }
    }

    console.log('[PrintPreview] All PDFs rendered successfully')
    return imageCache
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error('[PrintPreview] PDF rendering failed:', errorMessage)
    renderError.value = errorMessage
    throw error
  } finally {
    isRenderingPdfs.value = false
  }
}

const handlePrint = async () => {
  console.log('[PrintPreview] 开始打印流程')

  // 打印指定区域（包括报销单和发票）
  const printContent = document.getElementById('print-content')
  if (!printContent) {
    console.error('[PrintPreview] 未找到打印内容元素')
    return
  }
  console.log('[PrintPreview] 找到打印内容元素')

  // 渲染 PDFs 到图片（如果需要）
  let pdfImageCache: Map<string, string> | null = null
  if (includePrintInvoices.value && invoiceImages.value.some(inv => inv.isPdf)) {
    try {
      console.log('[PrintPreview] 预渲染 PDFs 为图片')
      pdfImageCache = await renderPdfInvoices()
      console.log('[PrintPreview] PDF 渲染完成')
    } catch (error) {
      console.error('[PrintPreview] PDF 渲染失败:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      const shouldContinue = confirm(
        `PDF 转换失败: ${errorMsg}\n\n` +
        `是否继续使用原始 PDF 打印？\n` +
        `（注意：原始 PDF 打印质量可能不如转换后的图片）`
      )

      if (!shouldContinue) {
        return // 取消打印
      }
      // 继续使用原始 iframe 方式作为降级方案
    }
  }

  // 关闭模态框以移除遮罩层，避免干扰打印对话框
  console.log('[PrintPreview] 关闭模态框')
  isOpen.value = false

  // 直接打开新窗口进行打印
  // A4纸张尺寸: 210mm x 297mm
  // 使用更高的DPI (150dpi) 来提高打印质量: 210mm * 150/25.4 ≈ 1240px, 297mm * 150/25.4 ≈ 1754px
  console.log('[PrintPreview] 打开新窗口')
  const printWindow = window.open('', '_blank', 'width=1240,height=1754')
  if (!printWindow) {
    console.error('[PrintPreview] 无法打开打印窗口，可能被浏览器阻止')
    alert('无法打开打印窗口，请检查浏览器是否阻止了弹出窗口')
    return
  }
  console.log('[PrintPreview] 新窗口已打开')

  // 克隆报销单内容并将输入框的值设置为 value 属性
  console.log('[PrintPreview] 克隆打印内容')
  const clonedContent = printContent.cloneNode(true) as HTMLElement
  const inputs = clonedContent.querySelectorAll('input')
  const originalInputs = printContent.querySelectorAll('input')

  inputs.forEach((input, index) => {
    const originalInput = originalInputs[index] as HTMLInputElement
    input.setAttribute('value', originalInput.value)
  })
  console.log('[PrintPreview] 已处理输入框内容')

  // 根据用户选择决定是否包含发票内容
  let invoiceHtml = ''
  if (includePrintInvoices.value && invoiceImages.value.length > 0) {
    console.log(`[PrintPreview] 包含 ${invoiceImages.value.length} 张发票`)

    // 生成发票 HTML - 统一使用 img 标签
    const invoiceItems = invoiceImages.value.map((invoice, index) => {
      // 如果是 PDF 且已渲染，使用渲染后的图片
      const imageUrl = invoice.isPdf && pdfImageCache?.has(invoice.url)
        ? pdfImageCache.get(invoice.url)!
        : invoice.url

      return `
        <div class="invoice-item">
          <img src="${imageUrl}" alt="发票 ${index + 1}" class="invoice-image" />
        </div>
      `
    }).join('')

    invoiceHtml = `
      <div class="page-break"></div>
      <div class="invoice-print-section">
        <div class="invoice-grid">
          ${invoiceItems}
        </div>
      </div>
    `
  }

  // 获取当前页面的所有样式表
  console.log('[PrintPreview] 获取页面样式')
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n')
      } catch (e) {
        // 跨域样式表可能无法访问
        console.warn('[PrintPreview] 无法访问某些样式表（跨域）', e)
        return ''
      }
    })
    .join('\n')
  console.log('[PrintPreview] 样式获取完成')

  const htmlContent = `
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

          @page :first {
            margin: 10mm;
          }

          @page invoice {
            size: A4 portrait;
            margin: 0;
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

            /* 提高图片打印质量 */
            img {
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
              image-rendering: high-quality;
              -ms-interpolation-mode: bicubic;
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

            /* 发票打印样式 */
            .invoice-print-section {
              page-break-before: always;
              page: invoice;
              padding: 0 !important;
              width: 100%;
              max-width: 100%;
              box-sizing: border-box;
            }

            .page-break {
              display: none;
            }

            .invoice-grid {
              display: flex;
              flex-direction: column;
              width: 100%;
              gap: 0;
              padding: 0;
              box-sizing: border-box;
            }

            .invoice-item {
              display: block;
              overflow: hidden;
              page-break-inside: avoid;
              padding: 0;
              margin: 0;
              width: 100%;
              height: calc(50vh - 2px);
              box-sizing: border-box;
              border-top: 1px dashed #d1d5db;
            }

            .invoice-item:first-child {
              border-top: none;
              height: calc(50vh - 3px);
            }

            /* 发票图片宽度占满，高度自适应 */
            .invoice-image {
              width: 100%;
              height: auto;
              max-width: 100%;
              display: block;
              object-fit: contain;
              object-position: top center;
              /* 使用高质量的图片渲染，避免模糊 */
              image-rendering: -webkit-optimize-contrast;
              image-rendering: high-quality;
              -ms-interpolation-mode: bicubic;
              /* 防止图片被过度压缩 */
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }

          /* 屏幕显示样式 */
          @media screen {
            body {
              padding: 20px;
              background: #f5f5f5;
              overflow-x: hidden;
            }

            .print-content {
              max-width: 210mm;
              margin: 0 auto;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }

            .invoice-print-section {
              max-width: 210mm;
              margin: 0 auto;
              overflow: hidden;
            }

            .page-break {
              height: 2px;
              background: #e5e7eb;
              margin: 20px 0;
            }

            .invoice-grid {
              display: flex;
              flex-direction: column;
              gap: 0;
              overflow: hidden;
            }

            .invoice-item {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 0;
              background: white;
              min-height: 600px;
              max-height: 600px;
              overflow: hidden;
              position: relative;
            }

            .invoice-image {
              max-width: 100%;
              max-height: 100%;
              width: auto;
              height: auto;
              object-fit: contain;
              display: block;
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
        ${invoiceHtml}
      </body>
    </html>
  `

  console.log('[PrintPreview] 写入HTML内容到新窗口')
  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  console.log('[PrintPreview] HTML内容写入完成')

  // 等待文档加载完成后执行打印脚本
  printWindow.addEventListener('load', () => {
    console.log('[PrintPreview] 打印窗口加载完成，开始执行打印逻辑')

    const iframes = printWindow.document.querySelectorAll('iframe')
    const images = printWindow.document.querySelectorAll('img')

    console.log('[PrintPreview] 检测到内容:', {
      iframes: iframes.length,
      images: images.length
    })

    const doPrint = () => {
      console.log('[PrintPreview] 准备调用打印对话框')
      try {
        console.log('[PrintPreview] 聚焦打印窗口')
        printWindow.focus()

        // 使用 requestAnimationFrame 确保渲染完成
        printWindow.requestAnimationFrame(() => {
          console.log('[PrintPreview] requestAnimationFrame 回调执行')

          // 再次确保窗口获得焦点
          printWindow.focus()

          // 延迟一小段时间确保浏览器准备好
          setTimeout(() => {
            console.log('[PrintPreview] 调用 printWindow.print()')

            // 检查打印功能是否可用
            if (typeof printWindow.print === 'function') {
              printWindow.print()
              console.log('[PrintPreview] printWindow.print() 调用完成')

              // 监听打印对话框关闭事件
              printWindow.addEventListener('afterprint', () => {
                console.log('[PrintPreview] 打印对话框已关闭')
                printWindow.close()
              })

              // 备用：如果用户取消打印，也要关闭窗口
              setTimeout(() => {
                if (!printWindow.closed) {
                  console.log('[PrintPreview] 超时关闭打印窗口')
                  printWindow.close()
                }
              }, 60000) // 60秒后自动关闭
            } else {
              console.error('[PrintPreview] print() 函数不可用')
              alert('打印功能不可用，请手动使用浏览器的打印功能（Ctrl+P）')
            }
          }, 100)
        })
      } catch (e: any) {
        console.error('[PrintPreview] 打印失败:', e)
        alert('打印失败: ' + (e.message || '未知错误'))
        // 出错时也要关闭窗口
        printWindow.close()
      }
    }

    if (images.length > 0) {
      // 有图片，等待图片加载
      console.log('[PrintPreview] 检测到图片，等待图片加载')
      let loadedCount = 0
      const totalImages = images.length

      const checkLoaded = () => {
        loadedCount++
        console.log('[PrintPreview] 图片加载进度:', loadedCount + '/' + totalImages)
        if (loadedCount >= totalImages) {
          console.log('[PrintPreview] 所有图片加载完成，等待500ms后打印')
          setTimeout(() => {
            console.log('[PrintPreview] 图片等待时间结束，开始打印')
            doPrint()
          }, 500)
        }
      }

      images.forEach((img) => {
        if (img.complete) {
          console.log('[PrintPreview] 图片已加载:', img.src)
          checkLoaded()
        } else {
          console.log('[PrintPreview] 等待图片加载:', img.src)
          img.addEventListener('load', () => {
            console.log('[PrintPreview] 图片加载成功:', img.src)
            checkLoaded()
          })
          img.addEventListener('error', () => {
            console.error('[PrintPreview] 图片加载失败:', img.src)
            checkLoaded()
          })
        }
      })
    } else {
      // 没有图片或 PDF
      console.log('[PrintPreview] 无图片或PDF，等待500ms后打印')
      setTimeout(() => {
        console.log('[PrintPreview] 等待时间结束，开始打印')
        doPrint()
      }, 500)
    }
  })
}

// 监听弹框打开，初始化数据
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initializeItems()
  } else {
    // 清理渲染状态
    renderError.value = null
    renderProgress.value = { current: 0, total: 0 }
    // 保留缓存以提升性能，如需清理可取消注释下一行
    // renderedPdfImages.value.clear()
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

/* 裁剪线样式 */
.cut-line-container {
  width: 100%;
  padding: 1rem 0;
}

.cut-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
}

.cut-line-text {
  color: #9ca3af;
  font-size: 0.875rem;
  white-space: nowrap;
}

.cut-line-dashed {
  flex: 1;
  height: 1px;
  border-top: 2px dashed #d1d5db;
}

/* 发票打印区域样式 */
.invoice-print-section {
  background: white;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.page-break {
  height: 2px;
  background: #e5e7eb;
  margin: 1.5rem 0;
}

.invoice-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.invoice-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0;
  background: #f9fafb;
  min-height: 600px;
  overflow: hidden;
}

.invoice-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  padding: 1.5rem;
}

.invoice-pdf {
  width: 100%;
  height: 600px;
  border: none;
}
</style>
