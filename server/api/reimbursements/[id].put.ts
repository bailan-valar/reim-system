import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { title, description, status, startDate, endDate, companyId } = body

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '报销单ID不能为空'
      })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status

    // Handle date range updates
    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null
    }

    // Validate date range if both are being set
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate > updateData.endDate) {
        throw createError({
          statusCode: 400,
          message: '开始日期不能晚于结束日期'
        })
      }
    }

    // Handle company update
    if (companyId !== undefined) {
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
      updateData.companyId = companyId || null
    }

    const reimbursement = await prisma.reimbursement.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        company: true
      }
    })

    return {
      data: reimbursement
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '更新报销单失败'
    })
  }
})
