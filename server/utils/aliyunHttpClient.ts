import { buildRequestParams } from './aliyunAuth'

/**
 * Aliyun HTTP Client Module
 * Handles direct HTTP requests to Aliyun RPC APIs
 */

/**
 * Aliyun API Error
 */
export interface AliyunApiError extends Error {
  code: string
  requestId?: string
  httpStatus?: number
  retryable: boolean
}

/**
 * RPC Request Configuration
 */
export interface RpcRequestConfig {
  endpoint: string
  action: string
  accessKeyId: string
  accessKeySecret: string
  body?: Buffer
  timeout?: number
  additionalParams?: Record<string, any>
}

/**
 * Check if an error is retryable
 *
 * @param error - Error object
 * @returns True if error should trigger retry
 */
export function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true
  }

  // HTTP 5xx errors are retryable
  if (error.httpStatus >= 500 && error.httpStatus < 600) {
    return true
  }

  // Throttling errors are retryable
  if (error.code && (error.code.includes('Throttling') || error.code.includes('QpsLimit'))) {
    return true
  }

  // All other errors are not retryable
  return false
}

/**
 * Parse HTTP response from Aliyun API
 *
 * @param response - Fetch Response object
 * @returns Parsed response data
 * @throws AliyunApiError if response indicates an error
 */
export async function parseResponse(response: Response): Promise<any> {
  const text = await response.text()

  // Try to parse as JSON
  let data: any
  try {
    data = JSON.parse(text)
  } catch (error) {
    const err = new Error(`Failed to parse response: ${text}`) as AliyunApiError
    err.code = 'ParseError'
    err.httpStatus = response.status
    err.retryable = false
    throw err
  }

  // Check for API errors
  // Aliyun API returns error in the response body even with 200 status
  if (data.Code && data.Code !== '200') {
    const err = new Error(data.Message || 'Unknown API error') as AliyunApiError
    err.code = data.Code
    err.requestId = data.RequestId
    err.httpStatus = response.status
    err.retryable = isRetryableError(err)
    throw err
  }

  // Check HTTP status
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}: ${response.statusText}`) as AliyunApiError
    err.code = `HTTP_${response.status}`
    err.httpStatus = response.status
    err.retryable = isRetryableError(err)
    throw err
  }

  return data
}

/**
 * Make RPC request to Aliyun API
 *
 * @param config - Request configuration
 * @returns API response data
 * @throws AliyunApiError on failure
 */
export async function makeRpcRequest(config: RpcRequestConfig): Promise<any> {
  const {
    endpoint,
    action,
    accessKeyId,
    accessKeySecret,
    body,
    timeout = 10000,
    additionalParams = {}
  } = config

  // Build request parameters with signature
  const params = buildRequestParams(action, accessKeyId, accessKeySecret, additionalParams)

  // Build URL with query parameters
  const queryString = new URLSearchParams(params).toString()
  const url = `${endpoint}?${queryString}`

  console.log(`[ALIYUN-HTTP] Making ${action} request to ${endpoint}`)

  // Make HTTP request
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/json'
      },
      body: body,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // Parse and return response
    const data = await parseResponse(response)
    console.log(`[ALIYUN-HTTP] ${action} request successful`)
    return data

  } catch (error: any) {
    clearTimeout(timeoutId)

    // Handle abort/timeout
    if (error.name === 'AbortError') {
      const err = new Error(`Request timeout after ${timeout}ms`) as AliyunApiError
      err.code = 'RequestTimeout'
      err.retryable = true
      throw err
    }

    // Re-throw if already an AliyunApiError
    if (error.code) {
      throw error
    }

    // Wrap other errors
    const err = new Error(`Request failed: ${error.message}`) as AliyunApiError
    err.code = error.code || 'NetworkError'
    err.retryable = true
    throw err
  }
}

/**
 * Make RPC request with retry logic
 *
 * @param config - Request configuration
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @returns API response data
 * @throws AliyunApiError on failure after all retries
 */
export async function makeRpcRequestWithRetry(
  config: RpcRequestConfig,
  maxRetries: number = 2
): Promise<any> {
  let lastError: AliyunApiError | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[ALIYUN-HTTP] Attempt ${attempt}/${maxRetries}`)
      const result = await makeRpcRequest(config)
      return result

    } catch (error: any) {
      lastError = error
      console.error(`[ALIYUN-HTTP] Attempt ${attempt} failed:`, error.message)

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        console.error(`[ALIYUN-HTTP] Error is not retryable, aborting`)
        throw error
      }

      // Don't wait after last attempt
      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s
        const waitTime = Math.pow(2, attempt) * 1000
        console.log(`[ALIYUN-HTTP] Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  // All retries failed
  console.error(`[ALIYUN-HTTP] All ${maxRetries} retry attempts failed`)
  throw lastError
}

/**
 * Call RecognizeGeneralStructure API
 *
 * @param buffer - Image/document buffer
 * @param accessKeyId - Aliyun AccessKeyId
 * @param accessKeySecret - Aliyun AccessKeySecret
 * @param endpoint - API endpoint (default: ocr-api.cn-hangzhou.aliyuncs.com)
 * @returns API response data
 */
export async function recognizeGeneralStructure(
  buffer: Buffer,
  accessKeyId: string,
  accessKeySecret: string,
  endpoint: string = 'https://ocr-api.cn-hangzhou.aliyuncs.com'
): Promise<any> {
  return makeRpcRequestWithRetry({
    endpoint,
    action: 'RecognizeGeneralStructure',
    accessKeyId,
    accessKeySecret,
    body: buffer,
    timeout: 10000
  })
}
