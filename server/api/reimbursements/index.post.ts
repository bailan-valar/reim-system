import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { title, description, type, status, startDate, endDate, companyId } = body

    if (!title) {
      throw createError({
        statusCode: 400,
        message: '标题不能为空'
      })
    }

    // Validate date range
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (start > end) {
        throw createError({
          statusCode: 400,
          message: '开始日期不能晚于结束日期'
        })
      }
    }

    // Validate company exists if provided
    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId }
      })
      if (!company) {
        throw createError({
          statusCode: 400,
          message: '所选公司不存在'
        })
      }
    }

    const reimbursement = await prisma.reimbursement.create({
      data: {
        title,
        description: description || null,
        type: type || '现金报销',
        status: status || '待整理',
        totalAmount: 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        companyId: companyId || null
      },
      include: {
        company: true
      }
    })

    return {
      data: reimbursement
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '创建报销单失败'
    })
  }
})
