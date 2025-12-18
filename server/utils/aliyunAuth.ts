import crypto from 'crypto'

/**
 * Aliyun RPC API Authentication Module
 * Implements Signature Version 1.0 for Aliyun API requests
 */

/**
 * Generate a unique nonce for each request
 * @returns UUID string without hyphens
 */
export function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

/**
 * Get current timestamp in ISO8601 format
 * @returns ISO8601 timestamp (e.g., 2024-01-01T12:00:00Z)
 */
export function getTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Percent-encode string according to RFC 3986
 * This is required for Aliyun API signature calculation
 *
 * @param str - String to encode
 * @returns Percent-encoded string
 */
export function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
}

/**
 * Sort parameters alphabetically and build canonical query string
 *
 * @param params - Request parameters
 * @returns Canonical query string (key1=value1&key2=value2...)
 */
export function buildCanonicalQueryString(params: Record<string, any>): string {
  // Sort keys alphabetically
  const sortedKeys = Object.keys(params).sort()

  // Build canonical query string with percent-encoded keys and values
  return sortedKeys
    .map(key => `${percentEncode(key)}=${percentEncode(String(params[key]))}`)
    .join('&')
}

/**
 * Calculate signature for Aliyun RPC API request
 * Uses HMAC-SHA1 algorithm with AccessKeySecret
 *
 * @param method - HTTP method (GET or POST)
 * @param params - All request parameters (including common params)
 * @param accessKeySecret - Aliyun AccessKeySecret
 * @returns Base64-encoded signature
 */
export function calculateSignature(
  method: string,
  params: Record<string, any>,
  accessKeySecret: string
): string {
  // 1. Build canonical query string
  const canonicalQuery = buildCanonicalQueryString(params)

  // 2. Build string to sign
  // Format: METHOD&percentEncode("/")&percentEncode(canonicalQuery)
  const stringToSign = `${method}&${percentEncode('/')}&${percentEncode(canonicalQuery)}`

  // 3. Calculate HMAC-SHA1 signature
  // Key is AccessKeySecret + "&"
  const hmac = crypto.createHmac('sha1', `${accessKeySecret}&`)
  hmac.update(stringToSign)

  // 4. Return base64-encoded signature
  return hmac.digest('base64')
}

/**
 * Build common parameters required for all Aliyun RPC API requests
 *
 * @param accessKeyId - Aliyun AccessKeyId
 * @returns Common parameters object
 */
export function buildCommonParams(accessKeyId: string): Record<string, string> {
  return {
    Format: 'JSON',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: generateNonce(),
    SignatureVersion: '1.0',
    Timestamp: getTimestamp(),
    AccessKeyId: accessKeyId,
    Version: '2021-07-07'
  }
}

/**
 * Build complete request parameters with signature
 *
 * @param action - API action name (e.g., 'RecognizeGeneralStructure')
 * @param accessKeyId - Aliyun AccessKeyId
 * @param accessKeySecret - Aliyun AccessKeySecret
 * @param additionalParams - Additional API-specific parameters
 * @returns Complete parameters object with signature
 */
export function buildRequestParams(
  action: string,
  accessKeyId: string,
  accessKeySecret: string,
  additionalParams: Record<string, any> = {}
): Record<string, string> {
  // Build all parameters (common + action + additional)
  const params = {
    ...buildCommonParams(accessKeyId),
    Action: action,
    ...additionalParams
  }

  // Calculate signature
  const signature = calculateSignature('POST', params, accessKeySecret)

  // Add signature to parameters
  return {
    ...params,
    Signature: signature
  }
}
