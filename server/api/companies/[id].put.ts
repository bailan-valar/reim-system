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

    const body = await readBody(event)
    const { name, logoUrl } = body

    // 验证公司是否存在
    const existingCompany = await prisma.company.findUnique({
      where: { id }
    })

    if (!existingCompany) {
      throw createError({
        statusCode: 404,
        message: '公司不存在'
      })
    }

    // 如果更新名称，检查名称唯一性
    if (name && name.trim() !== existingCompany.name) {
      const duplicateName = await prisma.company.findUnique({
        where: { name: name.trim() }
      })

      if (duplicateName) {
        throw createError({
          statusCode: 400,
          message: '公司名称已存在'
        })
      }
    }

    // 验证名称不能为空
    if (name !== undefined && (!name || !name.trim())) {
      throw createError({
        statusCode: 400,
        message: '公司名称不能为空'
      })
    }

    // 更新公司信息
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl || null })
      }
    })

    return {
      data: updatedCompany
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '更新公司失败'
    })
  }
})
