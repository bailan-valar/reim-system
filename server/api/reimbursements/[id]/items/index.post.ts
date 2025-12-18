import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { amount, date, description, category, hasInvoice } = body

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '报销单ID不能为空'
      })
    }

    if (!amount || !date || !category) {
      throw createError({
        statusCode: 400,
        message: '金额、日期和类别不能为空'
      })
    }

    // Create expense item
    const item = await prisma.expenseItem.create({
      data: {
        reimbursementId: id,
        amount: parseFloat(amount),
        date: new Date(date),
        description: description || null,
        category,
        hasInvoice: hasInvoice || false
      }
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
      data: item
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '创建费用项目失败'
    })
  }
})
