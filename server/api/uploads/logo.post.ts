import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '~/utils/constants'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)

    if (!formData) {
      throw createError({
        statusCode: 400,
        message: '没有上传文件'
      })
    }

    let file: File | null = null

    // Parse form data
    for (const part of formData) {
      if (part.name === 'file' && part.filename) {
        file = new File([part.data], part.filename, { type: part.type })
      }
    }

    if (!file) {
      throw createError({
        statusCode: 400,
        message: '文件缺失'
      })
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw createError({
        statusCode: 400,
        message: '不支持的文件类型。允许的类型: PNG, JPG, JPEG'
      })
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      throw createError({
        statusCode: 400,
        message: '文件大小超过限制 (最大 5MB)'
      })
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'logos')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${extension}`
    const filePath = join(uploadDir, fileName)

    // Convert file to buffer and save
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    return {
      data: {
        fileName,
        filePath: `/uploads/logos/${fileName}`,
        size: file.size,
        type: file.type
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '上传图片失败'
    })
  }
})
