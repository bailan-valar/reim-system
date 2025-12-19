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

    // 检查公司是否存在
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { reimbursements: true }
        }
      }
    })

    if (!company) {
      throw createError({
        statusCode: 404,
        message: '公司不存在'
      })
    }

    // 如果有关联报销单，将它们的 companyId 设为 null
    if (company._count.reimbursements > 0) {
      await prisma.reimbursement.updateMany({
        where: { companyId: id },
        data: { companyId: null }
      })
    }

    // 删除公司
    await prisma.company.delete({
      where: { id }
    })

    return {
      success: true,
      message: '公司已删除'
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '删除公司失败'
    })
  }
})
