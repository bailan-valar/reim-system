import prisma from '~/server/utils/prisma'
import { deleteFile, extractFileNameFromPath } from '~/server/utils/fileUpload'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const itemId = getRouterParam(event, 'itemId')

    if (!id || !itemId) {
      throw createError({
        statusCode: 400,
        message: 'ID不能为空'
      })
    }

    // Get expense item to check for invoice file
    const item = await prisma.expenseItem.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      throw createError({
        statusCode: 404,
        message: '费用项目不存在'
      })
    }

    // Delete invoice file if exists
    if (item.invoiceFilePath) {
      try {
        const fileName = extractFileNameFromPath(item.invoiceFilePath)
        await deleteFile(fileName)
      } catch (error) {
        console.error(`Failed to delete file: ${item.invoiceFilePath}`, error)
      }
    }

    // Delete expense item
    await prisma.expenseItem.delete({
      where: { id: itemId }
    })

    // Update reimbursement total amount
    const items = await prisma.expenseItem.findMany({
      where: { reimbursementId: id }
    })
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

    await prisma.reimbursement.update({
      where: { id },
      data: { totalAmount }
    })

    return {
      success: true,
      message: '费用项目已删除'
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '删除费用项目失败'
    })
  }
})
