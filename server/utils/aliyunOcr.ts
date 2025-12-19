import { recognizeGeneralStructure } from './aliyunHttpClient'

/**
 * OCR Recognition Result
 */
export interface OcrResult {
  success: boolean
  text: string
  error?: string
  rawResponse?: any
}

/**
 * Recognize invoice from image buffer using Aliyun OCR
 *
 * @param buffer - Image buffer (PNG, JPEG, PDF, or OFD)
 * @param fileType - File MIME type
 * @returns OCR result with extracted text
 */
export async function recognizeInvoice(
  buffer: Buffer,
  fileType: string = 'application/ofd'
): Promise<OcrResult> {
  try {
    console.log('[ALIYUN-OCR] Starting invoice recognition')
    console.log(`[ALIYUN-OCR] File type: ${fileType}, Buffer size: ${buffer.length} bytes`)

    // Get credentials from environment variables
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET
    const endpoint = process.env.ALIYUN_OCR_ENDPOINT || 'https://ocr-api.cn-hangzhou.aliyuncs.com'

    if (!accessKeyId || !accessKeySecret) {
      console.error('[ALIYUN-OCR] Missing Aliyun credentials in environment variables')
      return {
        success: false,
        text: '',
        error: 'Missing Aliyun credentials (ALIYUN_ACCESS_KEY_ID or ALIYUN_ACCESS_KEY_SECRET)'
      }
    }

    console.log('[ALIYUN-OCR] Calling RecognizeGeneralStructure API...')

    // Call OCR API with retry logic
    try {
      const response = await recognizeGeneralStructure(
        buffer,
        accessKeyId,
        accessKeySecret,
        endpoint
      )

      console.log('[ALIYUN-OCR] API call successful')

      // Extract text from response
      const data = response.Data
      if (!data) {
        console.warn('[ALIYUN-OCR] No data in response')
        return {
          success: false,
          text: '',
          error: 'No data returned from OCR API',
          rawResponse: response
        }
      }

      // Parse OCR results from SubImages
      let extractedText = ''

      if (data.SubImages && Array.isArray(data.SubImages)) {
        for (const subImage of data.SubImages) {
          if (subImage.KVInfo) {
            const kvInfo = subImage.KVInfo
            // Extract key-value pairs
            if (kvInfo.Data && Array.isArray(kvInfo.Data)) {
              for (const item of kvInfo.Data) {
                if (item.Key && item.Value) {
                  extractedText += `${item.Key}: ${item.Value}\n`
                }
              }
            }
          }
        }
        console.log(`[ALIYUN-OCR] Extracted text from SubImages: ${extractedText.length} characters`)
      }

      if (!extractedText) {
        console.warn('[ALIYUN-OCR] No text extracted from response')
        return {
          success: false,
          text: '',
          error: 'No text content in OCR response',
          rawResponse: response
        }
      }

      console.log(`[ALIYUN-OCR] ✓ Recognition successful, extracted ${extractedText.length} characters`)
      console.log(`[ALIYUN-OCR] Text preview: ${extractedText.substring(0, 200)}...`)

      return {
        success: true,
        text: extractedText,
        rawResponse: response
      }

    } catch (error: any) {
      console.error('[ALIYUN-OCR] ✗ API call failed:', error.message)
      return {
        success: false,
        text: '',
        error: `OCR API failed: ${error.message}`
      }
    }

  } catch (error: any) {
    console.error('[ALIYUN-OCR] ✗ Unexpected error:', error)
    return {
      success: false,
      text: '',
      error: `Unexpected error: ${error.message}`
    }
  }
}

/**
 * Recognize invoice with specific invoice API (if available)
 * Falls back to general recognition if invoice API is not available
 */
export async function recognizeInvoiceSpecific(
  buffer: Buffer,
  fileType: string = 'application/ofd'
): Promise<OcrResult> {
  // For now, use general recognition
  // TODO: Implement specific invoice recognition API if needed
  return recognizeInvoice(buffer, fileType)
}

/**
 * Invoice Data Structure (matching invoiceParser.ts interface)
 */
export interface InvoiceData {
  amount: number
  date: Date
  description: string
  category: string
  expenseCategory?: string  // 费用项目名称（从Name字段识别）
  rawText: string
}

/**
 * Map invoice type from Aliyun API to expense category
 */
function mapInvoiceTypeToCategory(invoiceType: string): string {
  if (!invoiceType) return '其他'

  const type = invoiceType.toLowerCase()

  // 交通类
  if (type.includes('出租车') || type.includes('taxi') || type.includes('的士')) {
    return '交通'
  }
  if (type.includes('火车票') || type.includes('train') || type.includes('高铁')) {
    return '交通'
  }
  if (type.includes('飞机票') || type.includes('机票') || type.includes('航空')) {
    return '交通'
  }
  if (type.includes('汽油') || type.includes('加油') || type.includes('停车') || type.includes('过路')) {
    return '交通'
  }

  // 餐饮类
  if (type.includes('餐饮') || type.includes('食品') || type.includes('饮料')) {
    return '餐饮'
  }

  // 住宿类
  if (type.includes('住宿') || type.includes('酒店') || type.includes('宾馆') || type.includes('民宿')) {
    return '住宿'
  }

  // 办公类
  if (type.includes('办公') || type.includes('文具') || type.includes('用品')) {
    return '办公'
  }

  return '其他'
}

/**
 * Parse Aliyun OCR response to InvoiceData
 */
function parseAliyunInvoiceResponse(data: any): InvoiceData | null {
  try {
    console.log('[ALIYUN-OCR] Parsing invoice response:', JSON.stringify(data, null, 2))

    // 尝试从不同的字段中提取金额
    let amount = 0
    if (data.TotalAmount) {
      amount = parseFloat(data.TotalAmount)
    } else if (data.Amount) {
      amount = parseFloat(data.Amount)
    } else if (data.SumAmount) {
      amount = parseFloat(data.SumAmount)
    } else if (data.InvoiceAmount) {
      amount = parseFloat(data.InvoiceAmount)
    }

    // 尝试从不同的字段中提取日期
    let date = new Date()
    if (data.InvoiceDate) {
      date = new Date(data.InvoiceDate)
    } else if (data.Date) {
      date = new Date(data.Date)
    } else if (data.IssueDate) {
      date = new Date(data.IssueDate)
    }

    // 如果日期解析失败，使用当前日期
    if (isNaN(date.getTime())) {
      date = new Date()
    }

    // 提取发票类型和描述
    const invoiceType = data.InvoiceType || data.Type || '发票'
    const invoiceCode = data.InvoiceCode || data.Code || ''
    const invoiceNumber = data.InvoiceNumber || data.Number || ''

    // 构建描述
    let description = invoiceType
    if (invoiceCode) {
      description += ` ${invoiceCode.slice(-4)}`
    } else if (invoiceNumber) {
      description += ` ${invoiceNumber.slice(-4)}`
    }

    // 映射类别
    const category = mapInvoiceTypeToCategory(invoiceType)

    console.log('[ALIYUN-OCR] Parsed invoice data:', {
      amount,
      date: date.toISOString().split('T')[0],
      description,
      category
    })

    return {
      amount,
      date,
      description,
      category,
      rawText: JSON.stringify(data)
    }
  } catch (error) {
    console.error('[ALIYUN-OCR] Error parsing invoice response:', error)
    return null
  }
}

/**
 * Recognize mixed invoices using Aliyun OCR API
 * Supports various invoice types: VAT, train tickets, taxi receipts, etc.
 *
 * @param buffer - File buffer (PDF, OFD, or image)
 * @param fileType - File MIME type
 * @returns Structured invoice data or null if recognition fails
 */
export async function recognizeMixedInvoice(
  buffer: Buffer,
  fileType: string = 'application/pdf'
): Promise<InvoiceData | null> {
  try {
    console.log('[ALIYUN-OCR] Starting mixed invoice recognition')
    console.log(`[ALIYUN-OCR] File type: ${fileType}, Buffer size: ${buffer.length} bytes`)

    // Get credentials from environment variables
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET
    const endpoint = process.env.ALIYUN_OCR_ENDPOINT || 'https://ocr-api.cn-hangzhou.aliyuncs.com'

    if (!accessKeyId || !accessKeySecret) {
      console.error('[ALIYUN-OCR] Missing Aliyun credentials in environment variables')
      return null
    }

    console.log('[ALIYUN-OCR] Calling RecognizeGeneralStructure API for invoice recognition...')

    // Call OCR API with retry logic
    try {
      const response = await recognizeGeneralStructure(
        buffer,
        accessKeyId,
        accessKeySecret,
        endpoint
      )

      console.log('[ALIYUN-OCR] API call successful')

      // Extract text from response
      const data = response.Data
      if (!data) {
        console.warn('[ALIYUN-OCR] No data in response')
        return null
      }

      // Extract text content from SubImages
      let extractedText = ''
      if (data.SubImages && Array.isArray(data.SubImages)) {
        for (const subImage of data.SubImages) {
          if (subImage.KVInfo) {
            const kvInfo = subImage.KVInfo
            // Extract key-value pairs
            if (kvInfo.Data && Array.isArray(kvInfo.Data)) {
              for (const item of kvInfo.Data) {
                if (item.Key && item.Value) {
                  extractedText += `${item.Key}: ${item.Value}\n`
                }
              }
            }
          }
        }
        console.log(`[ALIYUN-OCR] Extracted text from SubImages: ${extractedText.length} characters`)
      }

      if (!extractedText) {
        console.warn('[ALIYUN-OCR] No text extracted from response')
        return null
      }

      console.log(`[ALIYUN-OCR] Extracted text preview: ${extractedText.substring(0, 200)}...`)

      // Parse invoice data from extracted text
      const invoiceData = parseInvoiceFromText(extractedText)

      if (invoiceData) {
        console.log('[ALIYUN-OCR] ✓ Invoice recognition successful')
        return invoiceData
      } else {
        console.warn('[ALIYUN-OCR] ⚠ Could not parse invoice data from extracted text')
        return null
      }

    } catch (error: any) {
      console.error('[ALIYUN-OCR] ✗ API call failed:', error.message)
      return null
    }

  } catch (error: any) {
    console.error('[ALIYUN-OCR] ✗ Unexpected error:', error)
    return null
  }
}

/**
 * Parse invoice data from OCR extracted text
 * Uses simple pattern matching to extract amount, date, and type
 */
function parseInvoiceFromText(text: string): InvoiceData | null {
  try {
    console.log('[ALIYUN-OCR] Parsing invoice from text')

    // Extract amount - try multiple patterns
    const amountPatterns = [
      /[¥￥]\s*(\d+\.?\d*)/,
      /金额[：:]\s*(\d+\.?\d*)/,
      /合计[：:]\s*(\d+\.?\d*)/,
      /价税合计[：:]\s*(\d+\.?\d*)/,
      /(\d+\.\d{2})\s*元/
    ]

    let amount = 0
    for (const pattern of amountPatterns) {
      const match = text.match(pattern)
      if (match) {
        amount = parseFloat(match[1])
        if (amount > 0) {
          console.log(`[ALIYUN-OCR] Amount found: ${amount}`)
          break
        }
      }
    }

    // Extract date
    const datePattern = /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日号]?/
    const dateMatch = text.match(datePattern)
    let date = new Date()

    if (dateMatch) {
      const year = parseInt(dateMatch[1])
      const month = parseInt(dateMatch[2])
      const day = parseInt(dateMatch[3])
      date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
      console.log(`[ALIYUN-OCR] Date found: ${date.toISOString().split('T')[0]}`)
    }

    // Extract expense category from Name field
    let expenseCategory: string | undefined
    const namePatterns = [
      /(?:货物或应税劳务、服务)?名称[：:]\s*([^\n\r]+)/,
      /Name[：:]\s*([^\n\r]+)/i,
      /项目名称[：:]\s*([^\n\r]+)/,
      /品名[：:]\s*([^\n\r]+)/
    ]

    for (const pattern of namePatterns) {
      const match = text.match(pattern)
      if (match && match[1] && match[1].trim() !== '') {
        expenseCategory = match[1].trim()
        console.log(`[ALIYUN-OCR] Expense category found: ${expenseCategory}`)
        break
      }
    }

    // Determine invoice type and category
    let description = '发票'
    let category = '其他'

    if (text.includes('出租车') || text.includes('的士') || text.includes('TAXI')) {
      description = '出租车发票'
      category = '交通'
    } else if (text.includes('火车票') || /[GCDZTSPKLY]\d{1,4}/.test(text)) {
      description = '火车票'
      category = '交通'
    } else if (text.includes('增值税')) {
      description = '增值税发票'
      if (text.includes('餐饮')) category = '餐饮'
      else if (text.includes('住宿')) category = '住宿'
      else if (text.includes('办公')) category = '办公'
    } else if (text.includes('普通发票')) {
      description = '普通发票'
      if (text.includes('餐饮')) category = '餐饮'
      else if (text.includes('住宿')) category = '住宿'
      else if (text.includes('办公')) category = '办公'
    }

    if (amount <= 0) {
      console.warn('[ALIYUN-OCR] No valid amount found in text')
      return null
    }

    console.log('[ALIYUN-OCR] ✓ Invoice parsed successfully:', {
      amount,
      date: date.toISOString().split('T')[0],
      description,
      category,
      expenseCategory
    })

    return {
      amount,
      date,
      description,
      category,
      expenseCategory,
      rawText: text
    }
  } catch (error) {
    console.error('[ALIYUN-OCR] Error parsing invoice from text:', error)
    return null
  }
}
