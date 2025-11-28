import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const itemId = getRouterParam(event, 'itemId')
    const body = await readBody(event)
    const { amount, date, description, category } = body

    if (!id || !itemId) {
      throw createError({
        statusCode: 400,
        message: 'ID不能为空'
      })
    }

    const updateData: any = {}
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (date !== undefined) updateData.date = new Date(date)
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category

    // Update expense item
    const item = await prisma.expenseItem.update({
      where: { id: itemId },
      data: updateData
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
      message: error.message || '更新费用项目失败'
    })
  }
})
