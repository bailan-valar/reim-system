export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  statusCode: number
  message: string
  error?: any
}

export interface UploadResponse {
  fileName: string
  filePath: string
  itemId: string
}

export interface BulkInvoiceUploadResponse {
  success: number
  failed: number
  results: Array<{
    invoice: any
    fileName: string
  }>
  errors: Array<{
    fileName: string
    error: string
  }>
}
