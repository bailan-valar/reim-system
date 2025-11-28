import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { name } = body

    if (!name || !name.trim()) {
      throw createError({
        statusCode: 400,
        message: '公司名称不能为空'
      })
    }

    // Check if company already exists
    const existing = await prisma.company.findUnique({
      where: { name: name.trim() }
    })

    if (existing) {
      // Return existing company instead of error (for inline creation)
      return {
        data: existing
      }
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim()
      }
    })

    return {
      data: company
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '创建公司失败'
    })
  }
})
