import prisma from '~/server/utils/prisma'
import { saveFile } from '~/server/utils/fileUpload'
import { parseInvoice } from '~/server/utils/invoiceParser'

export default defineEventHandler(async (event) => {
  try {
    console.log(`[CREATE-FROM-INVOICES] Starting reimbursement creation from invoices`)

    // 1. Parse multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      console.error(`[CREATE-FROM-INVOICES] No data uploaded`)
      throw createError({
        statusCode: 400,
        message: '没有上传数据'
      })
    }

    // 2. Extract and validate metadata
    let title = ''
    let description = ''
    let companyId = ''

    for (const part of formData) {
      if (part.name === 'title') title = part.data.toString()
      if (part.name === 'description') description = part.data.toString()
      if (part.name === 'companyId') companyId = part.data.toString()
    }

    console.log(`[CREATE-FROM-INVOICES] Title: ${title}`)
    console.log(`[CREATE-FROM-INVOICES] Description: ${description || '(none)'}`)
    console.log(`[CREATE-FROM-INVOICES] CompanyId: ${companyId || '(none)'}`)

    // Validate title (required)
    if (!title || title.trim() === '') {
      console.error(`[CREATE-FROM-INVOICES] Title is missing`)
      throw createError({
        statusCode: 400,
        message: '标题不能为空'
      })
    }

    // Validate company exists if provided
    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId }
      })

      if (!company) {
        console.error(`[CREATE-FROM-INVOICES] Company not found: ${companyId}`)
        throw createError({
          statusCode: 404,
          message: '所属公司不存在'
        })
      }
    }

    const fileCount = formData.filter(part => part.name === 'files' && part.filename).length
    console.log(`[CREATE-FROM-INVOICES] Received ${fileCount} file(s) to process`)

    // 3. Process all PDF files
    const results = []
    const errors = []

    for (const part of formData) {
      if (part.name === 'files' && part.filename) {
        console.log(`\n[CREATE-FROM-INVOICES] ========================================`)
        console.log(`[CREATE-FROM-INVOICES] Processing file: ${part.filename} (${part.data.length} bytes)`)

        try {
          // Accept both PDF and OFD files
          const isValidType = part.filename.toLowerCase().endsWith('.pdf') ||
                              part.filename.toLowerCase().endsWith('.ofd')
          if (!isValidType) {
            console.warn(`[CREATE-FROM-INVOICES] ✗ File rejected: ${part.filename} - not a PDF or OFD file`)
            errors.push({
              fileName: part.filename,
              error: '仅支持PDF和OFD文件'
            })
            continue
          }

          // Parse invoice data using unified parser
          const invoiceData = await parseInvoice(Buffer.from(part.data), part.type || 'application/pdf')

          if (!invoiceData) {
            console.warn(`[CREATE-FROM-INVOICES] ✗ File processing failed: ${part.filename} - unable to recognize invoice information`)
            errors.push({
              fileName: part.filename,
              error: '无法识别发票信息'
            })
            continue
          }

          console.log(`[CREATE-FROM-INVOICES] Invoice data parsed successfully:`, JSON.stringify({
            amount: invoiceData.amount,
            date: invoiceData.date.toISOString().split('T')[0],
            description: invoiceData.description,
            category: invoiceData.category
          }))

          results.push({
            fileName: part.filename,
            invoiceData,
            fileData: part.data
          })

          console.log(`[CREATE-FROM-INVOICES] ✓ File processed successfully: ${part.filename}`)
        } catch (error: any) {
          console.error(`[CREATE-FROM-INVOICES] ✗ Error processing file ${part.filename}:`, error)
          if (error instanceof Error) {
            console.error(`[CREATE-FROM-INVOICES] Error stack:`, error.stack)
          }
          errors.push({
            fileName: part.filename,
            error: error.message || '处理文件失败'
          })
        }
      }
    }

    console.log(`\n[CREATE-FROM-INVOICES] ========================================`)
    console.log(`[CREATE-FROM-INVOICES] Processing complete: ${results.length} succeeded, ${errors.length} failed`)

    // 4. Check if at least one success
    if (results.length === 0) {
      console.error(`[CREATE-FROM-INVOICES] All files failed to process`)
      throw createError({
        statusCode: 400,
        message: '所有发票识别失败，请检查文件格式'
      })
    }

    // 5. Calculate date range from invoice dates
    const dates = results.map(r => r.invoiceData.date)
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())))

    console.log(`[CREATE-FROM-INVOICES] Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)

    // 6. Create reimbursement
    const reimbursement = await prisma.reimbursement.create({
      data: {
        title: title.trim(),
        description: description.trim() || null,
        startDate,
        endDate,
        companyId: companyId || null,
        status: '待整理',
        totalAmount: 0
      }
    })

    console.log(`[CREATE-FROM-INVOICES] Created reimbursement: ${reimbursement.id} - ${reimbursement.title}`)

    // 7. Create expense items and save files
    const createdItems = []

    for (const result of results) {
      try {
        // Create expense item
        const item = await prisma.expenseItem.create({
          data: {
            reimbursementId: reimbursement.id,
            amount: result.invoiceData.amount,
            date: result.invoiceData.date,
            description: result.invoiceData.description,
            category: result.invoiceData.category,
            hasInvoice: false
          }
        })

        console.log(`[CREATE-FROM-INVOICES] Created expense item: ${item.id}`)

        // Save the invoice file
        const fileType = result.fileName.toLowerCase().endsWith('.ofd') ? 'application/ofd' : 'application/pdf'
        const file = new File([result.fileData], result.fileName, { type: fileType })
        const uploadedFile = await saveFile(file, item.id)
        console.log(`[CREATE-FROM-INVOICES] Saved invoice file: ${uploadedFile.filePath}`)

        // Update expense item with file info
        const updatedItem = await prisma.expenseItem.update({
          where: { id: item.id },
          data: {
            invoiceFileName: uploadedFile.fileName,
            invoiceFilePath: uploadedFile.filePath,
            hasInvoice: true
          }
        })

        console.log(`[CREATE-FROM-INVOICES] Updated expense item with file info`)

        createdItems.push({
          fileName: result.fileName,
          expenseItem: updatedItem,
          invoiceData: {
            amount: result.invoiceData.amount,
            date: result.invoiceData.date,
            description: result.invoiceData.description,
            category: result.invoiceData.category
          }
        })
      } catch (error: any) {
        console.error(`[CREATE-FROM-INVOICES] Error creating expense item for ${result.fileName}:`, error)
        // Add to errors but continue processing other files
        errors.push({
          fileName: result.fileName,
          error: error.message || '创建费用项失败'
        })
      }
    }

    // 8. Update reimbursement total amount
    const totalAmount = createdItems.reduce((sum, item) => sum + item.expenseItem.amount, 0)
    console.log(`[CREATE-FROM-INVOICES] Updating reimbursement total amount: ${totalAmount}`)

    const updatedReimbursement = await prisma.reimbursement.update({
      where: { id: reimbursement.id },
      data: { totalAmount }
    })

    console.log(`[CREATE-FROM-INVOICES] Reimbursement creation completed successfully`)
    console.log(`[CREATE-FROM-INVOICES] Final stats: ${createdItems.length} items created, ${errors.length} errors`)

    // 9. Return response
    return {
      data: {
        reimbursement: updatedReimbursement,
        results: {
          success: createdItems.length,
          failed: errors.length,
          items: createdItems,
          errors
        }
      }
    }
  } catch (error: any) {
    console.error(`[CREATE-FROM-INVOICES] Fatal error:`, error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '创建报销单失败'
    })
  }
})
