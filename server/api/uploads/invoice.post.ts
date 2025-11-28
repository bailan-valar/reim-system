import prisma from '~/server/utils/prisma'
import { saveFile } from '~/server/utils/fileUpload'

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
    let itemId: string | null = null

    // Parse form data
    for (const part of formData) {
      if (part.name === 'file' && part.filename) {
        file = new File([part.data], part.filename, { type: part.type })
      } else if (part.name === 'itemId') {
        itemId = part.data.toString()
      }
    }

    if (!file || !itemId) {
      throw createError({
        statusCode: 400,
        message: '文件或费用项目ID缺失'
      })
    }

    // Check if expense item exists
    const item = await prisma.expenseItem.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      throw createError({
        statusCode: 404,
        message: '费用项目不存在'
      })
    }

    // Save file
    const uploadedFile = await saveFile(file, itemId)

    // Update expense item with file info
    const updatedItem = await prisma.expenseItem.update({
      where: { id: itemId },
      data: {
        invoiceFileName: uploadedFile.fileName,
        invoiceFilePath: uploadedFile.filePath,
        hasInvoice: true
      }
    })

    return {
      data: {
        fileName: uploadedFile.fileName,
        filePath: uploadedFile.filePath,
        itemId: updatedItem.id
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '上传发票失败'
    })
  }
})
