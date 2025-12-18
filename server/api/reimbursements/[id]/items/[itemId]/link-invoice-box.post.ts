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

    // 验证报销单和费用项目是否存在
    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id }
    })

    if (!reimbursement) {
      throw createError({
        statusCode: 404,
        message: '报销单不存在'
      })
    }

    const expenseItem = await prisma.expenseItem.findUnique({
      where: { id: itemId }
    })

    if (!expenseItem) {
      throw createError({
        statusCode: 404,
        message: '费用项目不存在'
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

    // 检查发票是否已被使用
    if (invoiceBox.status === '已使用' && invoiceBox.usedInItemId !== itemId) {
      throw createError({
        statusCode: 400,
        message: '该发票已被其他费用项目使用'
      })
    }

    // 更新发票箱状态
    await prisma.invoiceBox.update({
      where: { id: invoiceBoxId },
      data: {
        status: '已使用',
        usedInItemId: itemId
      }
    })

    // 更新费用项目的hasInvoice标记
    await prisma.expenseItem.update({
      where: { id: itemId },
      data: { hasInvoice: true }
    })

    return {
      data: invoiceBox
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '关联发票失败'
    })
  }
})
