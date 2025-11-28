import Ocr20191230, * as $Ocr20191230 from '@alicloud/ocr20191230'
import * as $OpenApi from '@alicloud/openapi-client'
import * as $Util from '@alicloud/tea-util'

/**
 * Aliyun OCR Client Configuration
 */
interface AliyunOcrConfig {
  accessKeyId: string
  accessKeySecret: string
  endpoint?: string
}

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
 * Create Aliyun OCR Client
 */
function createOcrClient(config: AliyunOcrConfig): Ocr20191230 {
  const openApiConfig = new $OpenApi.Config({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    endpoint: config.endpoint || 'ocr.cn-shanghai.aliyuncs.com'
  })

  return new Ocr20191230(openApiConfig)
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
    const endpoint = process.env.ALIYUN_OCR_ENDPOINT

    if (!accessKeyId || !accessKeySecret) {
      console.error('[ALIYUN-OCR] Missing Aliyun credentials in environment variables')
      return {
        success: false,
        text: '',
        error: 'Missing Aliyun credentials (ALIYUN_ACCESS_KEY_ID or ALIYUN_ACCESS_KEY_SECRET)'
      }
    }

    // Create OCR client
    const client = createOcrClient({
      accessKeyId,
      accessKeySecret,
      endpoint
    })

    // Convert buffer to base64
    const base64Image = buffer.toString('base64')
    console.log(`[ALIYUN-OCR] Converted to base64, length: ${base64Image.length}`)

    // Prepare request
    const request = new $Ocr20191230.RecognizeGeneralRequest({
      body: Buffer.from(base64Image, 'base64')
    })

    const runtime = new $Util.RuntimeOptions({
      readTimeout: 10000, // 10 seconds timeout
      connectTimeout: 5000 // 5 seconds connection timeout
    })

    console.log('[ALIYUN-OCR] Calling RecognizeGeneral API...')

    // Call OCR API with retry logic
    let lastError: Error | null = null
    const maxRetries = 2

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[ALIYUN-OCR] Attempt ${attempt}/${maxRetries}`)

        const response = await client.recognizeGeneralWithOptions(request, runtime)
        console.log('[ALIYUN-OCR] API call successful')

        // Extract text from response
        const data = response.body.data
        if (!data) {
          console.warn('[ALIYUN-OCR] No data in response')
          return {
            success: false,
            text: '',
            error: 'No data returned from OCR API',
            rawResponse: response.body
          }
        }

        // Parse OCR results
        let extractedText = ''

        // Check if response has content field (text lines)
        if (data.content) {
          extractedText = data.content
          console.log(`[ALIYUN-OCR] Extracted text from content field: ${extractedText.length} characters`)
        } else if (data.prism_wordsInfo) {
          // Alternative: extract from word info array
          const words = JSON.parse(data.prism_wordsInfo)
          extractedText = words.map((word: any) => word.word).join(' ')
          console.log(`[ALIYUN-OCR] Extracted text from prism_wordsInfo: ${extractedText.length} characters`)
        }

        if (!extractedText) {
          console.warn('[ALIYUN-OCR] No text extracted from response')
          return {
            success: false,
            text: '',
            error: 'No text content in OCR response',
            rawResponse: response.body
          }
        }

        console.log(`[ALIYUN-OCR] ✓ Recognition successful, extracted ${extractedText.length} characters`)
        console.log(`[ALIYUN-OCR] Text preview: ${extractedText.substring(0, 200)}...`)

        return {
          success: true,
          text: extractedText,
          rawResponse: response.body
        }

      } catch (error: any) {
        lastError = error
        console.error(`[ALIYUN-OCR] Attempt ${attempt} failed:`, error.message)

        // If not the last attempt, wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000 // 2s, 4s
          console.log(`[ALIYUN-OCR] Waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    // All retries failed
    console.error('[ALIYUN-OCR] ✗ All retry attempts failed')
    return {
      success: false,
      text: '',
      error: `OCR API failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
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
