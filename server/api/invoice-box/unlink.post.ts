import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { invoiceId } = body

    if (!invoiceId) {
      throw createError({
        statusCode: 400,
        message: '发票ID不能为空'
      })
    }

    // 获取发票箱记录
    const invoiceBox = await prisma.invoiceBox.findUnique({
      where: { id: invoiceId },
      include: {
        expenseItem: true
      }
    })

    if (!invoiceBox) {
      throw createError({
        statusCode: 404,
        message: '发票不存在'
      })
    }

    if (invoiceBox.status !== '已使用' || !invoiceBox.usedInItemId) {
      throw createError({
        statusCode: 400,
        message: '该发票未关联任何费用项目'
      })
    }

    const itemId = invoiceBox.usedInItemId

    // 恢复发票箱状态
    await prisma.invoiceBox.update({
      where: { id: invoiceId },
      data: {
        status: '未使用',
        usedInItemId: null
      }
    })

    // 删除关联的Invoice记录（如果存在）
    await prisma.invoice.deleteMany({
      where: {
        expenseItemId: itemId,
        invoiceBoxId: invoiceId
      }
    })

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
      message: '取消关联成功'
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '取消关联失败'
    })
  }
})
