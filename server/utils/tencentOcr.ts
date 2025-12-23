/**
 * Tencent Cloud OCR Module using Official SDK
 * Handles invoice recognition using RecognizeGeneralInvoice API (通用票据识别-高级版)
 * Reference: https://cloud.tencent.com/document/product/866/90802
 */

import * as tencentcloud from 'tencentcloud-sdk-nodejs-ocr'

const OcrClient = tencentcloud.ocr.v20181119.Client
type OcrClientType = InstanceType<typeof OcrClient>

/**
 * Invoice Recognition Result
 */
export interface TencentInvoiceResult {
  success: boolean
  invoiceNumber?: string
  invoiceCode?: string
  invoiceType?: string
  totalAmount?: number
  taxRate?: number
  taxAmount?: number
  invoiceDate?: string
  sellerName?: string
  buyerName?: string
  remark?: string
  expenseCategory?: string  // 费用项目名称（从Name字段识别）
  textDetections?: Array<{
    detectedText: string
    confidence: number
  }>
  error?: string
  rawResponse?: any
}

/**
 * Create Tencent Cloud OCR Client
 * 密钥信息从环境变量读取，需要提前在环境变量中设置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY
 * 使用环境变量方式可以避免密钥硬编码在代码中，提高安全性
 */
function createOcrClient(region: string = ''): OcrClientType {
  const secretId = process.env.TENCENT_SECRET_ID
  const secretKey = process.env.TENCENT_SECRET_KEY

  if (!secretId || !secretKey) {
    throw new Error('Missing Tencent Cloud credentials: TENCENT_SECRET_ID or TENCENT_SECRET_KEY not set in environment variables')
  }

  const clientConfig = {
    credential: {
      secretId,
      secretKey
    },
    region, // 空字符串表示不指定地域
    profile: {
      httpProfile: {
        endpoint: 'ocr.tencentcloudapi.com'
      }
    }
  }

  return new OcrClient(clientConfig)
}

/**
 * Convert Chinese date format to YYYY-MM-DD
 * Example: "2025年12月18日" -> "2025-12-18"
 */
function convertChineseDateToStandard(chineseDate: string): string {
  if (!chineseDate) return chineseDate

  // Match pattern: YYYY年MM月DD日
  const match = chineseDate.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (match) {
    const [, year, month, day] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // If already in standard format or other format, return as is
  return chineseDate
}

/**
 * Parse tax rate from string (handles percentage format)
 * Example: "6%" -> 6, "0.06" -> 6
 */
function parseTaxRate(taxRateStr: string): number {
  if (!taxRateStr) return 0

  // Remove % sign if present
  const cleanStr = taxRateStr.replace('%', '').trim()
  const rate = parseFloat(cleanStr)

  // If the rate is less than 1, assume it's in decimal format (0.06 -> 6%)
  if (rate < 1 && rate > 0) {
    return rate * 100
  }

  return rate
}

/**
 * Parse invoice information from RecognizeGeneralInvoice response
 */
function parseGeneralInvoiceResponse(response: any): Partial<TencentInvoiceResult> {
  const result: Partial<TencentInvoiceResult> = {}

  // RecognizeGeneralInvoice returns structured invoice data
  const mixedInvoiceItems = response.MixedInvoiceItems || []

  if (mixedInvoiceItems.length === 0) {
    return result
  }

  // Get the first invoice item (usually there's only one per image)
  const invoiceItem = mixedInvoiceItems[0]

  // Extract invoice type and subtype
  if (invoiceItem.Type) {
    // Map SubTypeDescription to standard invoice type names
    const subTypeDesc = invoiceItem.SubTypeDescription
    if (subTypeDesc === '电子发票(普通发票)') {
      result.invoiceType = '增值税电子普通发票'
    } else if (subTypeDesc === '电子发票(专用发票)') {
      result.invoiceType = '增值税电子专用发票'
    } else if (subTypeDesc === '电子发票(铁路电子客票)') {
      // 铁路电子客票归类为增值税电子普通发票
      result.invoiceType = '增值税电子普通发票'
    } else if (subTypeDesc === '增值税电子普通发票(通行费)') {
      // 通行费发票归类为增值税电子普通发票
      result.invoiceType = '增值税电子普通发票'
    } else {
      result.invoiceType = subTypeDesc || invoiceItem.TypeDescription || invoiceItem.Type
    }
    console.log('[TENCENT-OCR] Invoice type:', result.invoiceType, '(SubType:', subTypeDesc, ')')
  }

  // Extract structured fields from SingleInvoiceInfos
  const singleInvoiceInfos = invoiceItem.SingleInvoiceInfos

  if (!singleInvoiceInfos) {
    console.warn('[TENCENT-OCR] No SingleInvoiceInfos found')
    return result
  }

  // Find the first non-null invoice info from all possible types
  const invoiceInfo =
    singleInvoiceInfos.VatSpecialInvoice ||
    singleInvoiceInfos.VatCommonInvoice ||
    singleInvoiceInfos.VatElectronicCommonInvoice ||
    singleInvoiceInfos.VatElectronicSpecialInvoice ||
    singleInvoiceInfos.VatElectronicInvoiceFull ||
    singleInvoiceInfos.VatElectronicSpecialInvoiceFull ||
    singleInvoiceInfos.VatElectronicInvoiceToll ||
    singleInvoiceInfos.ElectronicTrainTicketFull ||
    singleInvoiceInfos.ElectronicFlightTicketFull ||
    singleInvoiceInfos.TaxiTicket ||
    singleInvoiceInfos.TrainTicket ||
    singleInvoiceInfos.QuotaInvoice ||
    singleInvoiceInfos.TollInvoice ||
    singleInvoiceInfos.BusInvoice ||
    singleInvoiceInfos.ShippingInvoice ||
    singleInvoiceInfos.OnlineTaxiItinerary ||
    singleInvoiceInfos.MotorVehicleSaleInvoice ||
    singleInvoiceInfos.UsedCarPurchaseInvoice ||
    singleInvoiceInfos.MachinePrintedInvoice ||
    singleInvoiceInfos.OtherInvoice

  if (!invoiceInfo) {
    console.warn('[TENCENT-OCR] No invoice info found in SingleInvoiceInfos')
    return result
  }

  console.log('[TENCENT-OCR] Found invoice info:', Object.keys(invoiceInfo))

  // Invoice number (different field names for different invoice types)
  if (invoiceInfo.Number) {
    result.invoiceNumber = invoiceInfo.Number
    console.log('[TENCENT-OCR] Invoice number:', result.invoiceNumber)
  } else if (invoiceInfo.InvoiceNumber) {
    result.invoiceNumber = invoiceInfo.InvoiceNumber
    console.log('[TENCENT-OCR] Invoice number:', result.invoiceNumber)
  } else if (invoiceInfo.ElectronicTicketNum) {
    result.invoiceNumber = invoiceInfo.ElectronicTicketNum
    console.log('[TENCENT-OCR] Electronic ticket number:', result.invoiceNumber)
  }

  // Invoice code
  if (invoiceInfo.Code) {
    result.invoiceCode = invoiceInfo.Code
    console.log('[TENCENT-OCR] Invoice code:', result.invoiceCode)
  } else if (invoiceInfo.InvoiceCode) {
    result.invoiceCode = invoiceInfo.InvoiceCode
    console.log('[TENCENT-OCR] Invoice code:', result.invoiceCode)
  }

  // Invoice date - convert Chinese format to YYYY-MM-DD
  if (invoiceInfo.Date) {
    result.invoiceDate = convertChineseDateToStandard(invoiceInfo.Date)
    console.log('[TENCENT-OCR] Invoice date:', result.invoiceDate, '(original:', invoiceInfo.Date, ')')
  } else if (invoiceInfo.DateGetOn) {
    result.invoiceDate = convertChineseDateToStandard(invoiceInfo.DateGetOn)
    console.log('[TENCENT-OCR] Invoice date (DateGetOn):', result.invoiceDate, '(original:', invoiceInfo.DateGetOn, ')')
  }

  // Total amount (价税合计 or 票价)
  if (invoiceInfo.Total) {
    result.totalAmount = parseFloat(invoiceInfo.Total)
    console.log('[TENCENT-OCR] Total amount:', result.totalAmount)
  } else if (invoiceInfo.TotalAmount) {
    result.totalAmount = parseFloat(invoiceInfo.TotalAmount)
    console.log('[TENCENT-OCR] Total amount:', result.totalAmount)
  } else if (invoiceInfo.Fare) {
    result.totalAmount = parseFloat(invoiceInfo.Fare)
    console.log('[TENCENT-OCR] Total amount (Fare):', result.totalAmount)
  } else if (invoiceInfo.Price) {
    result.totalAmount = parseFloat(invoiceInfo.Price)
    console.log('[TENCENT-OCR] Total amount (Price):', result.totalAmount)
  }

  // Tax amount - handle empty string as 0
  if (invoiceInfo.Tax) {
    const taxValue = invoiceInfo.Tax.trim()
    if (taxValue === '' || taxValue === '0' || taxValue === '0.00') {
      result.taxAmount = 0
      console.log('[TENCENT-OCR] Tax amount: 0 (empty or zero)')
    } else {
      result.taxAmount = parseFloat(taxValue)
      console.log('[TENCENT-OCR] Tax amount:', result.taxAmount)
    }
  } else if (invoiceInfo.TaxAmount) {
    const taxValue = invoiceInfo.TaxAmount.trim()
    if (taxValue === '' || taxValue === '0' || taxValue === '0.00') {
      result.taxAmount = 0
      console.log('[TENCENT-OCR] Tax amount: 0 (empty or zero)')
    } else {
      result.taxAmount = parseFloat(taxValue)
      console.log('[TENCENT-OCR] Tax amount:', result.taxAmount)
    }
  }

  // Tax rate - extract from items if not available at top level, handle empty string as 0
  if (invoiceInfo.TaxRate) {
    const taxRateValue = invoiceInfo.TaxRate.trim()
    if (taxRateValue === '' || taxRateValue === '0' || taxRateValue === '0%') {
      result.taxRate = 0
      console.log('[TENCENT-OCR] Tax rate: 0 (empty or zero)')
    } else {
      result.taxRate = parseTaxRate(taxRateValue)
      console.log('[TENCENT-OCR] Tax rate:', result.taxRate, '(from TaxRate field)')
    }
  } else if (invoiceInfo.VatInvoiceItemInfos && invoiceInfo.VatInvoiceItemInfos.length > 0) {
    // Extract from first item for toll invoices
    const firstItem = invoiceInfo.VatInvoiceItemInfos[0]
    if (firstItem.TaxRate) {
      const taxRateValue = firstItem.TaxRate.trim()
      if (taxRateValue === '' || taxRateValue === '0' || taxRateValue === '0%') {
        result.taxRate = 0
        console.log('[TENCENT-OCR] Tax rate: 0 (empty or zero from toll items)')
      } else {
        result.taxRate = parseTaxRate(taxRateValue)
        console.log('[TENCENT-OCR] Tax rate:', result.taxRate, '(from VatInvoiceItemInfos[0].TaxRate:', firstItem.TaxRate, ')')
      }
    }
  } else if (invoiceInfo.VatElectronicItems && invoiceInfo.VatElectronicItems.length > 0) {
    // Extract from first item for electronic invoices
    const firstItem = invoiceInfo.VatElectronicItems[0]
    if (firstItem.TaxRate) {
      const taxRateValue = firstItem.TaxRate.trim()
      if (taxRateValue === '' || taxRateValue === '0' || taxRateValue === '0%') {
        result.taxRate = 0
        console.log('[TENCENT-OCR] Tax rate: 0 (empty or zero from items)')
      } else {
        result.taxRate = parseTaxRate(taxRateValue)
        console.log('[TENCENT-OCR] Tax rate:', result.taxRate, '(from VatElectronicItems[0].TaxRate:', firstItem.TaxRate, ')')
      }
    }
  }

  // Seller name (or service provider)
  if (invoiceInfo.SellerName) {
    result.sellerName = invoiceInfo.SellerName
    console.log('[TENCENT-OCR] Seller name:', result.sellerName)
  } else if (invoiceInfo.Seller) {
    result.sellerName = invoiceInfo.Seller
    console.log('[TENCENT-OCR] Seller name:', result.sellerName)
  }

  // Buyer name (or passenger name)
  if (invoiceInfo.BuyerName) {
    result.buyerName = invoiceInfo.BuyerName
    console.log('[TENCENT-OCR] Buyer name:', result.buyerName)
  } else if (invoiceInfo.Purchaser) {
    result.buyerName = invoiceInfo.Purchaser
    console.log('[TENCENT-OCR] Buyer name:', result.buyerName)
  } else if (invoiceInfo.Buyer) {
    result.buyerName = invoiceInfo.Buyer
    console.log('[TENCENT-OCR] Buyer name:', result.buyerName)
  } else if (invoiceInfo.UserName) {
    result.buyerName = invoiceInfo.UserName
    console.log('[TENCENT-OCR] Buyer name (UserName):', result.buyerName)
  }

  // Extract expense category from Name field (Priority 1: top-level Name field)
  if (invoiceInfo.Name && invoiceInfo.Name.trim() !== '') {
    result.expenseCategory = invoiceInfo.Name
    console.log('[TENCENT-OCR] Expense category (from Name field):', result.expenseCategory)
  }
  // Priority 2: Extract from VatInvoiceItemInfos[0].Name for toll invoices
  else if (invoiceInfo.VatInvoiceItemInfos && invoiceInfo.VatInvoiceItemInfos.length > 0) {
    const firstItem = invoiceInfo.VatInvoiceItemInfos[0]
    if (firstItem.Name && firstItem.Name.trim() !== '') {
      result.expenseCategory = firstItem.Name
      console.log('[TENCENT-OCR] Expense category (from VatInvoiceItemInfos[0].Name):', result.expenseCategory)
    }
  }
  // Priority 3: Extract from VatElectronicItems[0].Name for electronic invoices
  else if (invoiceInfo.VatElectronicItems && invoiceInfo.VatElectronicItems.length > 0) {
    const firstItem = invoiceInfo.VatElectronicItems[0]
    if (firstItem.Name && firstItem.Name.trim() !== '') {
      result.expenseCategory = firstItem.Name
      console.log('[TENCENT-OCR] Expense category (from VatElectronicItems[0].Name):', result.expenseCategory)
    }
  }

  // Generate remark for specific invoice types
  // Priority 1: Use Name field if available (for all invoice types)
  if (invoiceInfo.Name && invoiceInfo.Name.trim() !== '') {
    result.remark = invoiceInfo.Name
    console.log('[TENCENT-OCR] Remark (from Name field):', result.remark)
  }
  // Priority 2: For train tickets: DateGetOn + " " + TimeGetOn + " " + TrainNumber + " " + StationGetOn + "->" + StationGetOff + " " + Seat
  else if (invoiceInfo.DateGetOn && invoiceInfo.StationGetOn && invoiceInfo.StationGetOff) {
    const remarkParts = []
      remarkParts.push("火车票：")

    // 日期和时间
    if (invoiceInfo.DateGetOn) {
      remarkParts.push(invoiceInfo.DateGetOn)
    }
    if (invoiceInfo.TimeGetOn) {
      remarkParts.push(invoiceInfo.TimeGetOn)
    }

    // 车次
    if (invoiceInfo.TrainNumber) {
      remarkParts.push(invoiceInfo.TrainNumber)
    }

    // 行程
    remarkParts.push(`${invoiceInfo.StationGetOn}->${invoiceInfo.StationGetOff}`)

    // 座位
    if (invoiceInfo.Seat) {
      remarkParts.push(invoiceInfo.Seat)
    }

    result.remark = remarkParts.join(' ')
    console.log('[TENCENT-OCR] Remark (Train):', result.remark)
  }

  // Priority 3: For flight tickets: DateGetOn + " " + FlightNumber + " " + StationGetOn + "->" + StationGetOff
  else if (invoiceInfo.FlightNumber && invoiceInfo.StationGetOn && invoiceInfo.StationGetOff) {
    const remarkParts = []

    if (invoiceInfo.DateGetOn) {
      remarkParts.push(invoiceInfo.DateGetOn)
    }
    if (invoiceInfo.FlightNumber) {
      remarkParts.push(invoiceInfo.FlightNumber)
    }

    remarkParts.push(`${invoiceInfo.StationGetOn}->${invoiceInfo.StationGetOff}`)

    result.remark = remarkParts.join(' ')
    console.log('[TENCENT-OCR] Remark (Flight):', result.remark)
  }

  // Priority 4: For toll invoices: extract from VatInvoiceItemInfos
  else if (invoiceInfo.VatInvoiceItemInfos && invoiceInfo.VatInvoiceItemInfos.length > 0) {
    const firstItem = invoiceInfo.VatInvoiceItemInfos[0]
    const remarkParts = []

    // 通行费标识
    remarkParts.push("通行费：")

    // 通行日期
    if (firstItem.DateStart && firstItem.DateEnd) {
      if (firstItem.DateStart === firstItem.DateEnd) {
        // 同一天
        remarkParts.push(firstItem.DateStart)
      } else {
        // 跨天
        remarkParts.push(`${firstItem.DateStart}-${firstItem.DateEnd}`)
      }
    }

    // 车牌号
    if (firstItem.LicensePlate) {
      remarkParts.push(firstItem.LicensePlate)
    }

    // 车辆类型
    if (firstItem.VehicleType) {
      remarkParts.push(firstItem.VehicleType)
    }

    // 费用项目名称
    if (firstItem.Name) {
      remarkParts.push(firstItem.Name)
    }

    result.remark = remarkParts.join(' ')
    console.log('[TENCENT-OCR] Remark (Toll):', result.remark)
  }

  // Priority 5: For taxi tickets: Date + " " + Start + "->" + End
  else if (invoiceInfo.Date && invoiceInfo.Start && invoiceInfo.End) {
    result.remark = `${invoiceInfo.Date} ${invoiceInfo.Start}->${invoiceInfo.End}`
    console.log('[TENCENT-OCR] Remark (Taxi):', result.remark)
  }

  // Priority 5: For electronic invoices: use Remark field or extract from VatElectronicItems
  else if (invoiceInfo.Remark) {
    result.remark = invoiceInfo.Remark
    console.log('[TENCENT-OCR] Remark (from Remark field):', result.remark)
  } else if (invoiceInfo.VatElectronicItems && invoiceInfo.VatElectronicItems.length > 0) {
    // Extract item names from VatElectronicItems and join them
    const itemNames = invoiceInfo.VatElectronicItems
      .map((item: any) => item.Name)
      .filter((name: string) => name && name.trim() !== '')

    if (itemNames.length > 0) {
      result.remark = itemNames.join('; ')
      console.log('[TENCENT-OCR] Remark (from VatElectronicItems):', result.remark)
    }
  }

  return result
}

/**
 * Recognize invoice using Tencent Cloud OCR SDK (General Invoice Recognition - Advanced)
 *
 * @param imageBase64 - Base64 encoded image or PDF (can include data URI prefix like "data:application/pdf;base64,")
 * @param enablePdf - Enable PDF recognition (default: true)
 * @param enableOther - Enable other invoice types recognition (default: true)
 * @param types - Specific invoice types to recognize (empty array means all types)
 * @returns Promise<TencentInvoiceResult>
 */
export async function recognizeInvoiceWithTencent(
  imageBase64: string,
  enablePdf: boolean = true,
  enableOther: boolean = true,
  types: number[] = []
): Promise<TencentInvoiceResult> {
  try {
    console.log('[TENCENT-OCR] Starting invoice recognition with SDK')

    // Create client (region is empty string for default)
    const client = createOcrClient('ap-guangzhou')

    // Remove data URI prefix if present
    // Example: "data:application/pdf;base64,JVBERi0x..." -> "JVBERi0x..."
    let cleanBase64 = imageBase64
    if (imageBase64.includes(',')) {
      const parts = imageBase64.split(',')
      if (parts.length === 2 && parts[0].startsWith('data:')) {
        cleanBase64 = parts[1]
        console.log('[TENCENT-OCR] Removed data URI prefix:', parts[0])
      }
    }

    // Call RecognizeGeneralInvoice API (通用票据识别-高级版)
    const params = {
      ImageBase64: cleanBase64,
      EnablePdf: enablePdf,      // 是否开启PDF识别
      EnableOther: enableOther,  // 是否开启其他票据识别
      Types: types               // 要识别的票据类型列表，空数组表示识别所有类型
    }

    console.log('[TENCENT-OCR] Calling RecognizeGeneralInvoice API (Advanced)...')
    console.log('[TENCENT-OCR] Parameters:', {
      ImageBase64Length: cleanBase64.length,
      EnablePdf: enablePdf,
      EnableOther: enableOther,
      Types: types
    })

    const response = await client.RecognizeGeneralInvoice(params)

    console.log('[TENCENT-OCR] API call successful')
    console.log('[TENCENT-OCR] ===== FULL RESPONSE =====')
    console.log(JSON.stringify(response, null, 2))
    console.log('[TENCENT-OCR] ===== END RESPONSE =====')

    const mixedInvoiceItems = response.MixedInvoiceItems || []

    if (mixedInvoiceItems.length === 0) {
      console.warn('[TENCENT-OCR] No invoice detected')
      return {
        success: false,
        error: 'No invoice detected in image',
        rawResponse: response
      }
    }

    console.log(`[TENCENT-OCR] Detected ${mixedInvoiceItems.length} invoice(s)`)

    // Parse structured invoice information
    const invoiceInfo = parseGeneralInvoiceResponse(response)

    // Also extract text detections if available for reference
    const textDetections: Array<{ detectedText: string; confidence: number }> = []
    const firstItem = mixedInvoiceItems[0]
    const singleInvoiceInfos = firstItem.SingleInvoiceInfos

    if (singleInvoiceInfos) {
      // Find the first non-null invoice info
      const info =
        singleInvoiceInfos.VatSpecialInvoice ||
        singleInvoiceInfos.VatCommonInvoice ||
        singleInvoiceInfos.VatElectronicCommonInvoice ||
        singleInvoiceInfos.VatElectronicSpecialInvoice ||
        singleInvoiceInfos.VatElectronicInvoiceFull ||
        singleInvoiceInfos.VatElectronicSpecialInvoiceFull ||
        singleInvoiceInfos.VatElectronicInvoiceToll ||
        singleInvoiceInfos.ElectronicTrainTicketFull ||
        singleInvoiceInfos.ElectronicFlightTicketFull ||
        singleInvoiceInfos.TaxiTicket ||
        singleInvoiceInfos.TrainTicket ||
        singleInvoiceInfos.QuotaInvoice ||
        singleInvoiceInfos.TollInvoice ||
        singleInvoiceInfos.BusInvoice ||
        singleInvoiceInfos.ShippingInvoice ||
        singleInvoiceInfos.OnlineTaxiItinerary ||
        singleInvoiceInfos.MotorVehicleSaleInvoice ||
        singleInvoiceInfos.UsedCarPurchaseInvoice ||
        singleInvoiceInfos.MachinePrintedInvoice ||
        singleInvoiceInfos.OtherInvoice

      if (info) {
        // Collect all text fields for reference
        Object.entries(info).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            textDetections.push({
              detectedText: `${key}: ${value}`,
              confidence: 100
            })
          }
        })
      }
    }

    return {
      success: true,
      ...invoiceInfo,
      textDetections,
      rawResponse: response
    }

  } catch (error: any) {
    console.error('[TENCENT-OCR] Error:', error.message)
    console.error('[TENCENT-OCR] Error details:', error)

    // Extract more detailed error information
    let errorMessage = error.message
    if (error.code) {
      errorMessage = `[${error.code}] ${error.message}`
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Recognize invoice from buffer using Tencent Cloud OCR SDK
 *
 * @param buffer - File buffer (image or PDF)
 * @param fileType - MIME type of the file (e.g., 'image/jpeg', 'application/pdf')
 * @returns Promise<TencentInvoiceResult>
 */
export async function recognizeInvoiceBuffer(
  buffer: Buffer,
  fileType: string = 'image/jpeg'
): Promise<TencentInvoiceResult> {
  try {
    console.log('[TENCENT-OCR] Starting invoice recognition from buffer')
    console.log(`[TENCENT-OCR] File type: ${fileType}, Buffer size: ${buffer.length} bytes`)

    // Determine if it's a PDF or OFD
    const isPdf = fileType === 'application/pdf' || fileType.includes('pdf')
    const isOfd = fileType === 'application/ofd' || fileType === 'application/x-ofd' || fileType.includes('ofd')

    // Convert buffer to base64
    const base64Data = buffer.toString('base64')
    console.log('[TENCENT-OCR] Converted buffer to base64')

    // Add data URI prefix for better compatibility
    const dataUri = isPdf
      ? `data:application/pdf;base64,${base64Data}`
      : isOfd
      ? `data:application/ofd;base64,${base64Data}`
      : `data:${fileType};base64,${base64Data}`

    console.log('[TENCENT-OCR] Created data URI with prefix:', dataUri.substring(0, 50) + '...')

    // Call Tencent OCR with appropriate settings
    const result = await recognizeInvoiceWithTencent(
      dataUri,
      true,  // EnablePdf
      true,  // EnableOther
      []     // Types (empty = all types)
    )

    if (result.success) {
      console.log('[TENCENT-OCR] ✓ Invoice recognition successful')
    } else {
      console.error('[TENCENT-OCR] ✗ Invoice recognition failed:', result.error)
    }

    return result

  } catch (error: any) {
    console.error('[TENCENT-OCR] ✗ Unexpected error:', error)
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    }
  }
}

/**
 * Recognize invoice from file path
 *
 * @param filePath - Path to the invoice file
 * @returns Promise<TencentInvoiceResult>
 */
export async function recognizeInvoiceFromFile(filePath: string): Promise<TencentInvoiceResult> {
  try {
    const fs = await import('fs')
    const path = await import('path')

    console.log('[TENCENT-OCR] Reading file:', filePath)

    // Read file
    const buffer = fs.readFileSync(filePath)

    // Determine file type from extension
    const ext = path.extname(filePath).toLowerCase()
    let fileType = 'image/jpeg'

    if (ext === '.pdf') {
      fileType = 'application/pdf'
    } else if (ext === '.ofd') {
      fileType = 'application/ofd'
    } else if (ext === '.png') {
      fileType = 'image/png'
    } else if (ext === '.jpg' || ext === '.jpeg') {
      fileType = 'image/jpeg'
    }

    return await recognizeInvoiceBuffer(buffer, fileType)

  } catch (error: any) {
    console.error('[TENCENT-OCR] ✗ Error reading file:', error)
    return {
      success: false,
      error: `Error reading file: ${error.message}`
    }
  }
}
