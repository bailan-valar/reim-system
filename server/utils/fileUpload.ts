import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '~/utils/constants'
import { recognizeMixedInvoice, type InvoiceData } from './aliyunOcr'

export interface UploadedFile {
  fileName: string
  filePath: string
  size: number
  type: string
  invoiceData?: InvoiceData | null
}

export async function validateFile(file: File): Promise<void> {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(`不支持的文件类型。允许的类型: PDF, PNG, JPG, JPEG, OFD`)
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件大小超过限制 (最大 10MB)`)
  }
}

export async function saveFile(file: File, itemId: string): Promise<UploadedFile> {
  console.log(`[FILE-UPLOAD] Starting file upload for item ${itemId}`)
  console.log(`[FILE-UPLOAD] File name: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)

  // Validate file
  await validateFile(file)
  console.log(`[FILE-UPLOAD] File validation passed`)

  // Create upload directory if it doesn't exist
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'invoices')
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
    console.log(`[FILE-UPLOAD] Created upload directory: ${uploadDir}`)
  }

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = file.name.split('.').pop()
  const fileName = `${timestamp}-${randomString}-${itemId}.${extension}`
  const filePath = join(uploadDir, fileName)

  // Convert file to buffer and save
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)
  console.log(`[FILE-UPLOAD] File saved to: ${filePath}`)

  // Recognize invoice data using Aliyun OCR
  let invoiceData: InvoiceData | null = null
  try {
    console.log(`[FILE-UPLOAD] Starting invoice recognition using Aliyun OCR...`)
    invoiceData = await recognizeMixedInvoice(buffer, file.type)

    if (invoiceData) {
      console.log(`[FILE-UPLOAD] ✓ Invoice recognition successful:`)
      console.log(`[FILE-UPLOAD]   - Amount: ${invoiceData.amount}`)
      console.log(`[FILE-UPLOAD]   - Date: ${invoiceData.date.toISOString().split('T')[0]}`)
      console.log(`[FILE-UPLOAD]   - Category: ${invoiceData.category}`)
      console.log(`[FILE-UPLOAD]   - Description: ${invoiceData.description}`)
    } else {
      console.warn(`[FILE-UPLOAD] ⚠ Invoice recognition failed - user will need to fill in data manually`)
    }
  } catch (error) {
    console.error(`[FILE-UPLOAD] ✗ Invoice recognition error:`, error)
    // Don't throw error - allow file upload to succeed even if recognition fails
  }

  return {
    fileName,
    filePath: `/uploads/invoices/${fileName}`,
    size: file.size,
    type: file.type,
    invoiceData
  }
}

export async function deleteFile(fileName: string): Promise<void> {
  const filePath = join(process.cwd(), 'public', 'uploads', 'invoices', fileName)

  if (existsSync(filePath)) {
    await unlink(filePath)
  }
}

export function extractFileNameFromPath(filePath: string): string {
  return filePath.split('/').pop() || ''
}
