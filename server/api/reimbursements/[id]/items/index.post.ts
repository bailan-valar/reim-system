import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { amount, date, description, category, hasInvoice, departure, arrival, invoiceBoxIds } = body

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

    // Validate departure and arrival for train/plane categories
    if ((category === '火车' || category === '飞机') && (!departure || !arrival)) {
      throw createError({
        statusCode: 400,
        message: '火车和飞机类型必须填写出发地和到达地'
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
        hasInvoice: hasInvoice || false,
        departure: departure || null,
        arrival: arrival || null
      }
    })

    // Link invoice boxes if provided
    if (invoiceBoxIds && Array.isArray(invoiceBoxIds) && invoiceBoxIds.length > 0) {
      // Update invoice box status to '已使用' and set usedInItemId
      // This will automatically create the relation through the implicit many-to-many
      await prisma.invoiceBox.updateMany({
        where: {
          id: { in: invoiceBoxIds }
        },
        data: {
          status: '已使用',
          usedInItemId: item.id
        }
      })
    }

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
