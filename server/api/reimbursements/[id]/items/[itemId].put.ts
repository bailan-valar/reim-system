import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const itemId = getRouterParam(event, 'itemId')
    const body = await readBody(event)
    const { amount, date, description, category, hasInvoice, departure, arrival } = body

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
    if (hasInvoice !== undefined) updateData.hasInvoice = hasInvoice
    if (departure !== undefined) updateData.departure = departure || null
    if (arrival !== undefined) updateData.arrival = arrival || null

    // Validate departure and arrival for train/plane categories
    const finalCategory = category !== undefined ? category : (await prisma.expenseItem.findUnique({ where: { id: itemId } }))?.category
    if (finalCategory === '火车' || finalCategory === '飞机') {
      const finalDeparture = departure !== undefined ? departure : (await prisma.expenseItem.findUnique({ where: { id: itemId } }))?.departure
      const finalArrival = arrival !== undefined ? arrival : (await prisma.expenseItem.findUnique({ where: { id: itemId } }))?.arrival
      if (!finalDeparture || !finalArrival) {
        throw createError({
          statusCode: 400,
          message: '火车和飞机类型必须填写出发地和到达地'
        })
      }
    }

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
