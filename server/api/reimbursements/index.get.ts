import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const status = query.status as string | undefined
    const companyId = query.companyId as string | undefined
    const sortBy = (query.sortBy as string) || 'createdAt'
    const order = (query.order as string) || 'desc'

    const where: any = {}
    if (status) where.status = status
    if (companyId) where.companyId = companyId

    const reimbursements = await prisma.reimbursement.findMany({
      where,
      orderBy: {
        [sortBy]: order
      },
      include: {
        items: true,
        company: true
      }
    })

    return {
      data: reimbursements
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || '获取报销单列表失败'
    })
  }
})
