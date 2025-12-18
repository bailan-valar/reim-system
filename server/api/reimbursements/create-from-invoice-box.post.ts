import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    console.log(`[CREATE-FROM-INVOICE-BOX] Starting reimbursement creation from invoice box`)

    // 1. Parse request body
    const body = await readBody(event)
    const { title, description, companyId, invoiceBoxIds } = body

    console.log(`[CREATE-FROM-INVOICE-BOX] Title: ${title}`)
    console.log(`[CREATE-FROM-INVOICE-BOX] Description: ${description || '(none)'}`)
    console.log(`[CREATE-FROM-INVOICE-BOX] CompanyId: ${companyId || '(none)'}`)
    console.log(`[CREATE-FROM-INVOICE-BOX] Invoice Box IDs: ${invoiceBoxIds?.length || 0}`)

    // 2. Validate required fields
    if (!title || title.trim() === '') {
      console.error(`[CREATE-FROM-INVOICE-BOX] Title is missing`)
      throw createError({
        statusCode: 400,
        message: '标题不能为空'
      })
    }

    if (!invoiceBoxIds || !Array.isArray(invoiceBoxIds) || invoiceBoxIds.length === 0) {
      console.error(`[CREATE-FROM-INVOICE-BOX] No invoice box IDs provided`)
      throw createError({
        statusCode: 400,
        message: '请至少选择一张发票'
      })
    }

    // 3. Validate company exists if provided
    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId }
      })

      if (!company) {
        console.error(`[CREATE-FROM-INVOICE-BOX] Company not found: ${companyId}`)
        throw createError({
          statusCode: 404,
          message: '所属公司不存在'
        })
      }
    }

    // 4. Fetch invoice box records
    const invoiceBoxRecords = await prisma.invoiceBox.findMany({
      where: {
        id: { in: invoiceBoxIds },
        status: '未使用'
      }
    })

    console.log(`[CREATE-FROM-INVOICE-BOX] Found ${invoiceBoxRecords.length} available invoices`)

    if (invoiceBoxRecords.length === 0) {
      console.error(`[CREATE-FROM-INVOICE-BOX] No available invoices found`)
      throw createError({
        statusCode: 400,
        message: '所选发票不可用或已被使用'
      })
    }

    // 5. Calculate date range from invoice dates
    const dates = invoiceBoxRecords.map(inv => new Date(inv.invoiceDate))
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())))

    console.log(`[CREATE-FROM-INVOICE-BOX] Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)

    // 6. Create reimbursement
    const reimbursement = await prisma.reimbursement.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        startDate,
        endDate,
        companyId: companyId || null,
        status: '待整理',
        totalAmount: 0
      }
    })

    console.log(`[CREATE-FROM-INVOICE-BOX] Created reimbursement: ${reimbursement.id} - ${reimbursement.title}`)

    // 7. Create expense items from invoice box records
    const createdItems = []
    let totalAmount = 0

    for (const invoice of invoiceBoxRecords) {
      try {
        // Determine category based on invoice type or use default
        const category = invoice.invoiceType.includes('专用') ? '办公用品' : '其他'

        // Create expense item
        const item = await prisma.expenseItem.create({
          data: {
            reimbursementId: reimbursement.id,
            amount: invoice.totalAmount,
            date: new Date(invoice.invoiceDate),
            description: invoice.buyerName || invoice.invoiceType,
            category: category,
            hasInvoice: true,
            invoiceFileName: invoice.fileName,
            invoiceFilePath: invoice.filePath
          }
        })

        console.log(`[CREATE-FROM-INVOICE-BOX] Created expense item: ${item.id} - ¥${item.amount}`)

        // Update invoice box status to '已使用'
        await prisma.invoiceBox.update({
          where: { id: invoice.id },
          data: {
            status: '已使用',
            usedAt: new Date()
          }
        })

        console.log(`[CREATE-FROM-INVOICE-BOX] Updated invoice box ${invoice.id} status to '已使用'`)

        totalAmount += invoice.totalAmount
        createdItems.push({
          expenseItem: item,
          invoice: invoice
        })
      } catch (error: any) {
        console.error(`[CREATE-FROM-INVOICE-BOX] Error creating expense item for invoice ${invoice.id}:`, error)
        // Continue processing other invoices even if one fails
      }
    }

    // 8. Update reimbursement total amount
    console.log(`[CREATE-FROM-INVOICE-BOX] Updating reimbursement total amount: ${totalAmount}`)

    const updatedReimbursement = await prisma.reimbursement.update({
      where: { id: reimbursement.id },
      data: { totalAmount }
    })

    console.log(`[CREATE-FROM-INVOICE-BOX] Reimbursement creation completed successfully`)
    console.log(`[CREATE-FROM-INVOICE-BOX] Final stats: ${createdItems.length} items created, total amount: ¥${totalAmount}`)

    // 9. Return response
    return {
      data: {
        reimbursement: updatedReimbursement,
        items: createdItems
      }
    }
  } catch (error: any) {
    console.error(`[CREATE-FROM-INVOICE-BOX] Fatal error:`, error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '创建报销单失败'
    })
  }
})
