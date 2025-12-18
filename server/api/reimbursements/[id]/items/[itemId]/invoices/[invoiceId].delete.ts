import prisma from '~/server/utils/prisma'

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

    // 删除发票记录（只删除关联关系）
    await prisma.invoice.delete({
      where: { id: invoiceId }
    })

    // 如果该发票来自发票箱，恢复发票箱状态
    if (invoice.invoiceBoxId) {
      await prisma.invoiceBox.update({
        where: { id: invoice.invoiceBoxId },
        data: {
          status: '未使用',
          usedInItemId: null
        }
      })
    }

    // 检查费用项目是否还有其他发票
    const remainingInvoices = await prisma.invoice.findMany({
      where: { expenseItemId: itemId }
    })

    // 如果没有其他发票，更新hasInvoice标记
    if (remainingInvoices.length === 0) {
      await prisma.expenseItem.update({
        where: { id: itemId },
        data: { hasInvoice: false }
      })
    }

    return {
      success: true,
      message: '删除发票关联成功'
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '删除发票失败'
    })
  }
})
