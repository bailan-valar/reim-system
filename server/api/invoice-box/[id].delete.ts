import prisma from '~/server/utils/prisma'
import { deleteFile } from '~/server/utils/fileUpload'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '发票ID缺失'
      })
    }

    // Check if invoice exists
    const invoice = await prisma.invoiceBox.findUnique({
      where: { id }
    })

    if (!invoice) {
      throw createError({
        statusCode: 404,
        message: '发票不存在'
      })
    }

    // Check if invoice is already used
    if (invoice.status === '已使用') {
      throw createError({
        statusCode: 400,
        message: '发票已被使用，无法删除'
      })
    }

    // Delete file
    try {
      const fileName = invoice.filePath.split('/').pop() || ''
      await deleteFile(fileName)
    } catch (error) {
      console.error('Failed to delete file:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete invoice from database
    await prisma.invoiceBox.delete({
      where: { id }
    })

    return {
      message: '发票删除成功'
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '删除发票失败'
    })
  }
})
