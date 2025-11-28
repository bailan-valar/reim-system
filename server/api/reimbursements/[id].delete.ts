import prisma from '~/server/utils/prisma'
import { deleteFile, extractFileNameFromPath } from '~/server/utils/fileUpload'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '报销单ID不能为空'
      })
    }

    // Get all expense items with invoice files
    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id },
      include: {
        items: true
      }
    })

    if (!reimbursement) {
      throw createError({
        statusCode: 404,
        message: '报销单不存在'
      })
    }

    // Delete all invoice files
    for (const item of reimbursement.items) {
      if (item.invoiceFilePath) {
        try {
          const fileName = extractFileNameFromPath(item.invoiceFilePath)
          await deleteFile(fileName)
        } catch (error) {
          console.error(`Failed to delete file: ${item.invoiceFilePath}`, error)
        }
      }
    }

    // Delete reimbursement (cascade will delete items)
    await prisma.reimbursement.delete({
      where: { id }
    })

    return {
      success: true,
      message: '报销单已删除'
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '删除报销单失败'
    })
  }
})
