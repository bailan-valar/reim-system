import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '公司ID不能为空'
      })
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { reimbursements: true }
        },
        reimbursements: {
          select: {
            id: true,
            title: true,
            type: true,
            totalAmount: true,
            status: true,
            startDate: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!company) {
      throw createError({
        statusCode: 404,
        message: '公司不存在'
      })
    }

    // 计算总金额
    const totalAmount = company.reimbursements.reduce(
      (sum, reimbursement) => sum + reimbursement.totalAmount,
      0
    )

    return {
      data: {
        ...company,
        totalAmount
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '获取公司详情失败'
    })
  }
})
