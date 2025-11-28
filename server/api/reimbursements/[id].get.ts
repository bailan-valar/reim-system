import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '报销单ID不能为空'
      })
    }

    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: {
            date: 'desc'
          }
        },
        company: true
      }
    })

    if (!reimbursement) {
      throw createError({
        statusCode: 404,
        message: '报销单不存在'
      })
    }

    return {
      data: reimbursement
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '获取报销单详情失败'
    })
  }
})
