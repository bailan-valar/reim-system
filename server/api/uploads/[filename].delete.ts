import prisma from '~/server/utils/prisma'
import { deleteFile } from '~/server/utils/fileUpload'

export default defineEventHandler(async (event) => {
  try {
    const filename = getRouterParam(event, 'filename')
    const query = getQuery(event)
    const itemId = query.itemId as string

    if (!filename || !itemId) {
      throw createError({
        statusCode: 400,
        message: '文件名或费用项目ID缺失'
      })
    }

    // Update expense item
    await prisma.expenseItem.update({
      where: { id: itemId },
      data: {
        invoiceFileName: null,
        invoiceFilePath: null,
        hasInvoice: false
      }
    })

    // Delete file
    await deleteFile(filename)

    return {
      success: true,
      message: '发票已删除'
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '删除发票失败'
    })
  }
})
