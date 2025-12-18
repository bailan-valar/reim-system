import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '发票ID缺失'
      })
    }

    const invoice = await prisma.invoiceBox.findUnique({
      where: { id }
    })

    if (!invoice) {
      throw createError({
        statusCode: 404,
        message: '发票不存在'
      })
    }

    return {
      data: invoice
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '获取发票详情失败'
    })
  }
})
