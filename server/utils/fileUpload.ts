import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '~/utils/constants'

export interface UploadedFile {
  fileName: string
  filePath: string
  size: number
  type: string
}

export async function validateFile(file: File): Promise<void> {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(`不支持的文件类型。允许的类型: PDF, PNG, JPG, JPEG`)
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件大小超过限制 (最大 10MB)`)
  }
}

export async function saveFile(file: File, itemId: string): Promise<UploadedFile> {
  // Validate file
  await validateFile(file)

  // Create upload directory if it doesn't exist
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'invoices')
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
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

  return {
    fileName,
    filePath: `/uploads/invoices/${fileName}`,
    size: file.size,
    type: file.type
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
