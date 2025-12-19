import prisma from '~/server/utils/prisma'
import { saveFile } from '~/server/utils/fileUpload'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const itemId = getRouterParam(event, 'itemId')

    if (!id || !itemId) {
      throw createError({
        statusCode: 400,
        message: '报销单ID和费用项目ID不能为空'
      })
    }

    // 验证费用项目是否存在
    const expenseItem = await prisma.expenseItem.findUnique({
      where: { id: itemId }
    })

    if (!expenseItem) {
      throw createError({
        statusCode: 404,
        message: '费用项目不存在'
      })
    }

    if (expenseItem.reimbursementId !== id) {
      throw createError({
        statusCode: 400,
        message: '费用项目不属于该报销单'
      })
    }

    // 获取上传的文件
    const formData = await readFormData(event)
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      throw createError({
        statusCode: 400,
        message: '请选择要上传的文件'
      })
    }

    const results: any[] = []
    const errors: any[] = []
    let successCount = 0
    let failedCount = 0

    // 并行处理所有文件
    await Promise.all(
      files.map(async (file) => {
        try {
          // 保存文件并解析发票信息
          const uploadedFile = await saveFile(file, itemId)

          // 创建 Invoice 记录
          const invoice = await prisma.invoice.create({
            data: {
              expenseItemId: itemId,
              fileName: uploadedFile.fileName,
              filePath: uploadedFile.filePath,
              amount: uploadedFile.invoiceData?.amount || 0,
              date: uploadedFile.invoiceData?.date || new Date(),
              description: uploadedFile.invoiceData?.description || file.name,
              expenseCategory: uploadedFile.invoiceData?.expenseCategory || null
            }
          })

          results.push({
            invoice,
            fileName: file.name
          })
          successCount++
        } catch (error: any) {
          console.error(`[BULK-UPLOAD] Error uploading ${file.name}:`, error)
          errors.push({
            fileName: file.name,
            error: error.message || '上传失败'
          })
          failedCount++
        }
      })
    )

    return {
      data: {
        success: successCount,
        failed: failedCount,
        results,
        errors
      }
    }
  } catch (error: any) {
    console.error('[BULK-UPLOAD] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '批量上传发票失败'
    })
  }
})
