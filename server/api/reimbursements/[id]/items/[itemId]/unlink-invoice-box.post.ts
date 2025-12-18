import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const itemId = getRouterParam(event, 'itemId')
    const body = await readBody(event)
    const { invoiceBoxId } = body

    if (!id || !itemId) {
      throw createError({
        statusCode: 400,
        message: 'ID不能为空'
      })
    }

    if (!invoiceBoxId) {
      throw createError({
        statusCode: 400,
        message: '发票箱ID不能为空'
      })
    }

    // 获取发票箱记录
    const invoiceBox = await prisma.invoiceBox.findUnique({
      where: { id: invoiceBoxId }
    })

    if (!invoiceBox) {
      throw createError({
        statusCode: 404,
        message: '发票不存在'
      })
    }

    // 验证发票箱是否关联到该费用项目
    if (invoiceBox.usedInItemId !== itemId) {
      throw createError({
        statusCode: 400,
        message: '该发票未关联到此费用项目'
      })
    }

    // 更新发票箱状态
    await prisma.invoiceBox.update({
      where: { id: invoiceBoxId },
      data: {
        status: '未使用',
        usedInItemId: null
      }
    })

    // 检查费用项目是否还有其他发票
    const remainingInvoiceBoxes = await prisma.invoiceBox.findMany({
      where: { usedInItemId: itemId }
    })

    // 如果没有其他发票，更新hasInvoice标记
    if (remainingInvoiceBoxes.length === 0) {
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
