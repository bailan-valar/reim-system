import prisma from '~/server/utils/prisma'

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

    // 获取所有发票
    const invoices = await prisma.invoice.findMany({
      where: { expenseItemId: itemId },
      orderBy: { uploadedAt: 'desc' }
    })

    return {
      data: invoices
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '获取发票列表失败'
    })
  }
})
