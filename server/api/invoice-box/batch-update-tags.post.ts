import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { invoiceIds, tags, mode } = body

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: '请选择要更新的发票'
      })
    }

    if (!tags || typeof tags !== 'string') {
      throw createError({
        statusCode: 400,
        message: '请提供标签内容'
      })
    }

    if (!mode || !['add', 'replace'].includes(mode)) {
      throw createError({
        statusCode: 400,
        message: '请提供有效的更新模式（add 或 replace）'
      })
    }

    // 解析新标签
    const newTags = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    if (newTags.length === 0) {
      throw createError({
        statusCode: 400,
        message: '标签不能为空'
      })
    }

    // 获取所有要更新的发票
    const invoices = await prisma.invoiceBox.findMany({
      where: {
        id: { in: invoiceIds },
        status: '未使用' // 只能更新未使用的发票
      }
    })

    if (invoices.length === 0) {
      throw createError({
        statusCode: 400,
        message: '没有找到可更新的发票（只能更新未使用的发票）'
      })
    }

    // 批量更新标签
    const updatePromises = invoices.map(invoice => {
      let finalTags: string[]

      if (mode === 'replace') {
        // 替换模式：直接使用新标签
        finalTags = newTags
      } else {
        // 添加模式：合并现有标签和新标签
        const existingTags = invoice.tags
          ? invoice.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
          : []

        // 使用 Set 去重
        const tagSet = new Set([...existingTags, ...newTags])
        finalTags = Array.from(tagSet)
      }

      return prisma.invoiceBox.update({
        where: { id: invoice.id },
        data: { tags: finalTags.join(',') }
      })
    })

    await Promise.all(updatePromises)

    return {
      success: true,
      message: `成功更新 ${invoices.length} 张发票的标签`,
      updatedCount: invoices.length
    }
  } catch (error: any) {
    console.error('Failed to batch update tags:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '批量更新标签失败'
    })
  }
})
