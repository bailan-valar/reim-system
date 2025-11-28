import prisma from '~/server/utils/prisma'
import { deleteFile, extractFileNameFromPath } from '~/server/utils/fileUpload'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const itemId = getRouterParam(event, 'itemId')
    const invoiceId = getRouterParam(event, 'invoiceId')

    if (!id || !itemId || !invoiceId) {
      throw createError({
        statusCode: 400,
        message: '报销单ID、费用项目ID和发票ID不能为空'
      })
    }

    // 验证发票是否存在
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        expenseItem: true
      }
    })

    if (!invoice) {
      throw createError({
        statusCode: 404,
        message: '发票不存在'
      })
    }

    if (invoice.expenseItemId !== itemId) {
      throw createError({
        statusCode: 400,
        message: '发票不属于该费用项目'
      })
    }

    if (invoice.expenseItem.reimbursementId !== id) {
      throw createError({
        statusCode: 400,
        message: '费用项目不属于该报销单'
      })
    }

    // 删除文件
    try {
      const fileName = extractFileNameFromPath(invoice.filePath)
      await deleteFile(fileName)
    } catch (error) {
      console.error('[DELETE-INVOICE] Error deleting file:', error)
      // 继续删除数据库记录，即使文件删除失败
    }

    // 删除数据库记录
    await prisma.invoice.delete({
      where: { id: invoiceId }
    })

    return {
      success: true
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '删除发票失败'
    })
  }
})
