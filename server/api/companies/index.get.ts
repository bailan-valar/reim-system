import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { sortBy = 'name', order = 'asc' } = query

    const companies = await prisma.company.findMany({
      orderBy: {
        [sortBy as string]: order
      }
    })

    return {
      data: companies
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '获取公司列表失败'
    })
  }
})
