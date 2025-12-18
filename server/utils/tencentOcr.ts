/**
 * Tencent Cloud OCR Module using Official SDK
 * Handles invoice recognition using Tencent Cloud OCR SDK
 */

import * as tencentcloud from 'tencentcloud-sdk-nodejs-ocr'

const OcrClient = tencentcloud.ocr.v20181119.Client

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
  textDetections?: Array<{
    detectedText: string
    confidence: number
  }>
  error?: string
  rawResponse?: any
}

/**
 * Create Tencent Cloud OCR Client
 */
function createOcrClient(secretId: string, secretKey: string, region: string = 'ap-guangzhou') {
  const clientConfig = {
    credential: {
      secretId,
      secretKey
    },
    region,
    profile: {
      httpProfile: {
        endpoint: 'ocr.tencentcloudapi.com'
      }
    }
  }

  return new OcrClient(clientConfig)
}

/**
 * Parse invoice information from OCR text detections
 */
function parseInvoiceFromOcr(textDetections: Array<{ DetectedText: string; Confidence: number }>): Partial<TencentInvoiceResult> {
  const result: Partial<TencentInvoiceResult> = {}

  // Combine all text
  const allText = textDetections.map(t => t.DetectedText).join('\n')
  console.log('[TENCENT-OCR] Combined text:', allText.substring(0, 500))

  // Extract invoice number (发票号码)
  const invoiceNumberPatterns = [
    /发票号码[：:]\s*(\d{8,12})/,
    /No[.:]?\s*(\d{8,12})/i,
    /号码[：:]\s*(\d{8,12})/
  ]
  for (const pattern of invoiceNumberPatterns) {
    const match = allText.match(pattern)
    if (match) {
      result.invoiceNumber = match[1]
      console.log('[TENCENT-OCR] Found invoice number:', result.invoiceNumber)
      break
    }
  }

  // Extract invoice code (发票代码)
  const invoiceCodePatterns = [
    /发票代码[：:]\s*(\d{10,12})/,
    /代码[：:]\s*(\d{10,12})/
  ]
  for (const pattern of invoiceCodePatterns) {
    const match = allText.match(pattern)
    if (match) {
      result.invoiceCode = match[1]
      console.log('[TENCENT-OCR] Found invoice code:', result.invoiceCode)
      break
    }
  }

  // Extract total amount (价税合计/合计金额)
  const amountPatterns = [
    /价税合计[：:]\s*[¥￥]?\s*(\d+\.?\d*)/,
    /合计金额[：:]\s*[¥￥]?\s*(\d+\.?\d*)/,
    /金额[：:]\s*[¥￥]?\s*(\d+\.?\d*)/,
    /[¥￥]\s*(\d+\.\d{2})/,
    /(\d+\.\d{2})\s*元/
  ]
  for (const pattern of amountPatterns) {
    const match = allText.match(pattern)
    if (match) {
      const amount = parseFloat(match[1])
      if (amount > 0) {
        result.totalAmount = amount
        console.log('[TENCENT-OCR] Found total amount:', result.totalAmount)
        break
      }
    }
  }

  // Extract tax amount (税额)
  const taxAmountPatterns = [
    /税额[：:]\s*[¥￥]?\s*(\d+\.?\d*)/,
    /税金[：:]\s*[¥￥]?\s*(\d+\.?\d*)/
  ]
  for (const pattern of taxAmountPatterns) {
    const match = allText.match(pattern)
    if (match) {
      result.taxAmount = parseFloat(match[1])
      console.log('[TENCENT-OCR] Found tax amount:', result.taxAmount)
      break
    }
  }

  // Extract tax rate (税率)
  const taxRatePatterns = [
    /税率[：:]\s*(\d+\.?\d*)%/,
    /(\d+)%/
  ]
  for (const pattern of taxRatePatterns) {
    const match = allText.match(pattern)
    if (match) {
      result.taxRate = parseFloat(match[1])
      console.log('[TENCENT-OCR] Found tax rate:', result.taxRate)
      break
    }
  }

  // Extract invoice date (开票日期)
  const datePatterns = [
    /开票日期[：:]\s*(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日号]?/,
    /日期[：:]\s*(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日号]?/,
    /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日号]?/
  ]
  for (const pattern of datePatterns) {
    const match = allText.match(pattern)
    if (match) {
      const year = match[1]
      const month = match[2].padStart(2, '0')
      const day = match[3].padStart(2, '0')
      result.invoiceDate = `${year}-${month}-${day}`
      console.log('[TENCENT-OCR] Found invoice date:', result.invoiceDate)
      break
    }
  }

  // Determine invoice type
  if (allText.includes('增值税专用发票')) {
    result.invoiceType = '增值税专用发票'
  } else if (allText.includes('增值税电子专用发票')) {
    result.invoiceType = '增值税电子专用发票'
  } else if (allText.includes('增值税电子普通发票')) {
    result.invoiceType = '增值税电子普通发票'
  } else if (allText.includes('增值税普通发票')) {
    result.invoiceType = '增值税普通发票'
  } else if (allText.includes('增值税')) {
    result.invoiceType = '增值税普通发票'
  } else {
    result.invoiceType = '其他'
  }
  console.log('[TENCENT-OCR] Determined invoice type:', result.invoiceType)

  // Extract seller name (销售方)
  const sellerPatterns = [
    /销售方[：:]\s*([^\n]+)/,
    /销售方名称[：:]\s*([^\n]+)/,
    /名\s*称[：:]\s*([^\n]+)/
  ]
  for (const pattern of sellerPatterns) {
    const match = allText.match(pattern)
    if (match) {
      result.sellerName = match[1].trim()
      console.log('[TENCENT-OCR] Found seller name:', result.sellerName)
      break
    }
  }

  // Extract buyer name (购买方)
  const buyerPatterns = [
    /购买方[：:]\s*([^\n]+)/,
    /购方[：:]\s*([^\n]+)/,
    /购买方名称[：:]\s*([^\n]+)/
  ]
  for (const pattern of buyerPatterns) {
    const match = allText.match(pattern)
    if (match) {
      result.buyerName = match[1].trim()
      console.log('[TENCENT-OCR] Found buyer name:', result.buyerName)
      break
    }
  }

  return result
}

/**
 * Recognize invoice using Tencent Cloud OCR SDK
 */
export async function recognizeInvoiceWithTencent(
  imageBase64: string,
  secretId: string,
  secretKey: string,
  region: string = 'ap-guangzhou'
): Promise<TencentInvoiceResult> {
  try {
    console.log('[TENCENT-OCR] Starting invoice recognition with SDK')

    const client = createOcrClient(secretId, secretKey, region)

    // Call GeneralBasicOCR API
    const params = {
      ImageBase64: imageBase64,
      LanguageType: 'zh'
    }

    console.log('[TENCENT-OCR] Calling GeneralBasicOCR API...')
    const response = await client.GeneralBasicOCR(params)

    console.log('[TENCENT-OCR] API call successful')
    console.log('[TENCENT-OCR] ===== FULL RESPONSE =====')
    console.log(JSON.stringify(response, null, 2))
    console.log('[TENCENT-OCR] ===== END RESPONSE =====')

    const textDetections = response.TextDetections || []

    if (textDetections.length === 0) {
      console.warn('[TENCENT-OCR] No text detected')
      return {
        success: false,
        error: 'No text detected in image',
        rawResponse: response
      }
    }

    console.log(`[TENCENT-OCR] Detected ${textDetections.length} text blocks`)
    console.log('[TENCENT-OCR] ===== TEXT DETECTIONS =====')
    textDetections.forEach((t: any, index: number) => {
      console.log(`[${index + 1}] ${t.DetectedText} (confidence: ${t.Confidence})`)
    })
    console.log('[TENCENT-OCR] ===== END TEXT DETECTIONS =====')

    // Parse invoice information
    const invoiceInfo = parseInvoiceFromOcr(textDetections)

    return {
      success: true,
      ...invoiceInfo,
      textDetections: textDetections.map((t: any) => ({
        detectedText: t.DetectedText,
        confidence: t.Confidence
      })),
      rawResponse: response
    }

  } catch (error: any) {
    console.error('[TENCENT-OCR] Error:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Convert PDF buffer to image buffer (first page only)
 */
async function convertPdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('[TENCENT-OCR] Converting PDF to image...')

    // Use pdf-to-img to convert PDF to PNG
    const { pdf } = await import('pdf-to-img')
    const document = await pdf(pdfBuffer, { scale: 2.0 })

    console.log(`[TENCENT-OCR] PDF has ${document.length} page(s)`)

    // Get first page using getPage method
    const firstPage = await document.getPage(1)

    console.log('[TENCENT-OCR] ✓ PDF converted to image successfully')
    return firstPage

  } catch (error: any) {
    console.error('[TENCENT-OCR] ✗ PDF conversion failed:', error.message)
    throw new Error(`PDF conversion failed: ${error.message}`)
  }
}

/**
 * Recognize invoice from buffer using Tencent Cloud OCR SDK
 */
export async function recognizeInvoiceBuffer(
  buffer: Buffer,
  fileType: string = 'image/jpeg'
): Promise<TencentInvoiceResult> {
  try {
    console.log('[TENCENT-OCR] Starting invoice recognition from buffer')
    console.log(`[TENCENT-OCR] File type: ${fileType}, Buffer size: ${buffer.length} bytes`)

    // Get credentials from environment
    const secretId = process.env.TENCENT_SECRET_ID
    const secretKey = process.env.TENCENT_SECRET_KEY
    const region = process.env.TENCENT_REGION || 'ap-guangzhou'

    if (!secretId || !secretKey) {
      console.error('[TENCENT-OCR] Missing Tencent Cloud credentials')
      return {
        success: false,
        error: 'Missing Tencent Cloud credentials (TENCENT_SECRET_ID or TENCENT_SECRET_KEY)'
      }
    }

    // Convert PDF to image if needed
    let imageBuffer = buffer
    if (fileType === 'application/pdf') {
      try {
        imageBuffer = await convertPdfToImage(buffer)
      } catch (error: any) {
        console.error('[TENCENT-OCR] PDF conversion failed:', error.message)
        return {
          success: false,
          error: `PDF conversion failed: ${error.message}`
        }
      }
    }

    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64')

    // Call Tencent OCR
    const result = await recognizeInvoiceWithTencent(base64Image, secretId, secretKey, region)

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
