import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const status = query.status as string | undefined

    const where = status ? { status } : {}

    const invoices = await prisma.invoiceBox.findMany({
      where,
      orderBy: {
        invoiceDate: 'desc'
      }
    })

    return {
      data: invoices
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || '获取发票列表失败'
    })
  }
})
