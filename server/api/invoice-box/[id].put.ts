import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '发票ID缺失'
      })
    }

    const body = await readBody(event)

    // Check if invoice exists
    const existingInvoice = await prisma.invoiceBox.findUnique({
      where: { id }
    })

    if (!existingInvoice) {
      throw createError({
        statusCode: 404,
        message: '发票不存在'
      })
    }

    // If updating invoice number, check for duplicates
    if (body.invoiceNumber && body.invoiceNumber !== existingInvoice.invoiceNumber) {
      const duplicate = await prisma.invoiceBox.findUnique({
        where: { invoiceNumber: body.invoiceNumber }
      })

      if (duplicate) {
        throw createError({
          statusCode: 400,
          message: '发票号码已存在'
        })
      }
    }

    // Update invoice
    const updatedInvoice = await prisma.invoiceBox.update({
      where: { id },
      data: {
        ...(body.invoiceNumber && { invoiceNumber: body.invoiceNumber }),
        ...(body.invoiceType && { invoiceType: body.invoiceType }),
        ...(body.totalAmount !== undefined && { totalAmount: body.totalAmount }),
        ...(body.taxRate !== undefined && { taxRate: body.taxRate }),
        ...(body.taxAmount !== undefined && { taxAmount: body.taxAmount }),
        ...(body.invoiceDate && { invoiceDate: new Date(body.invoiceDate) }),
        ...(body.buyerName !== undefined && { buyerName: body.buyerName || null }),
        ...(body.remark !== undefined && { remark: body.remark || null }),
        ...(body.tags !== undefined && { tags: body.tags || null }),
        ...(body.status && { status: body.status }),
        ...(body.usedInItemId !== undefined && { usedInItemId: body.usedInItemId })
      }
    })

    return {
      data: updatedInvoice
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '更新发票失败'
    })
  }
})
