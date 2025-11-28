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
