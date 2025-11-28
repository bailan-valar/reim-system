import prisma from '~/server/utils/prisma'
import { saveFile } from '~/server/utils/fileUpload'
import { parseInvoice } from '~/server/utils/invoiceParser'

export default defineEventHandler(async (event) => {
  try {
    const reimbursementId = getRouterParam(event, 'id')
    console.log(`[BULK-UPLOAD] Starting bulk invoice upload for reimbursement: ${reimbursementId}`)

    if (!reimbursementId) {
      throw createError({
        statusCode: 400,
        message: '报销单ID缺失'
      })
    }

    // Check if reimbursement exists
    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id: reimbursementId }
    })

    if (!reimbursement) {
      console.error(`[BULK-UPLOAD] Reimbursement not found: ${reimbursementId}`)
      throw createError({
        statusCode: 404,
        message: '报销单不存在'
      })
    }

    console.log(`[BULK-UPLOAD] Reimbursement found: ${reimbursement.title}`)

    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      console.error(`[BULK-UPLOAD] No files uploaded`)
      throw createError({
        statusCode: 400,
        message: '没有上传文件'
      })
    }

    const fileCount = formData.filter(part => part.name === 'files' && part.filename).length
    console.log(`[BULK-UPLOAD] Received ${fileCount} file(s) to process`)

    const results = []
    const errors = []

    // Process each uploaded file
    for (const part of formData) {
      if (part.name === 'files' && part.filename) {
        console.log(`\n[BULK-UPLOAD] ========================================`)
        console.log(`[BULK-UPLOAD] Processing file: ${part.filename} (${part.data.length} bytes)`)

        try {
          const file = new File([part.data], part.filename, { type: part.type })

          // Accept both PDF and OFD files
          const isValidType = part.filename.toLowerCase().endsWith('.pdf') ||
                              part.filename.toLowerCase().endsWith('.ofd')
          if (!isValidType) {
            console.warn(`[BULK-UPLOAD] ✗ File rejected: ${part.filename} - not a PDF or OFD file`)
            errors.push({
              fileName: part.filename,
              error: '仅支持PDF和OFD文件'
            })
            continue
          }

          // Determine file type from filename extension
          let fileType = part.type || 'application/pdf'
          if (part.filename.toLowerCase().endsWith('.ofd')) {
            fileType = 'application/ofd'
            console.log(`[BULK-UPLOAD] Detected OFD file, setting type to: ${fileType}`)
          } else if (part.filename.toLowerCase().endsWith('.pdf')) {
            fileType = 'application/pdf'
            console.log(`[BULK-UPLOAD] Detected PDF file, setting type to: ${fileType}`)
          }
          console.log(`[BULK-UPLOAD] File type for parsing: ${fileType}`)

          // Parse invoice data using unified parser
          const invoiceData = await parseInvoice(Buffer.from(part.data), fileType)

          if (!invoiceData) {
            console.warn(`[BULK-UPLOAD] ✗ File processing failed: ${part.filename} - unable to recognize invoice information`)
            errors.push({
              fileName: part.filename,
              error: '无法识别发票信息'
            })
            continue
          }

          console.log(`[BULK-UPLOAD] Invoice data parsed successfully:`, JSON.stringify({
            amount: invoiceData.amount,
            date: invoiceData.date.toISOString().split('T')[0],
            description: invoiceData.description,
            category: invoiceData.category
          }))

          // Create expense item
          const expenseItem = await prisma.expenseItem.create({
            data: {
              reimbursementId,
              amount: invoiceData.amount,
              date: invoiceData.date,
              description: invoiceData.description,
              category: invoiceData.category,
              hasInvoice: false // Will be updated after file save
            }
          })

          console.log(`[BULK-UPLOAD] Created expense item: ${expenseItem.id}`)

          // Save the invoice file
          const uploadedFile = await saveFile(file, expenseItem.id)
          console.log(`[BULK-UPLOAD] Saved invoice file: ${uploadedFile.filePath}`)

          // Update expense item with file info
          const updatedItem = await prisma.expenseItem.update({
            where: { id: expenseItem.id },
            data: {
              invoiceFileName: uploadedFile.fileName,
              invoiceFilePath: uploadedFile.filePath,
              hasInvoice: true
            }
          })

          console.log(`[BULK-UPLOAD] Updated expense item with file info`)
          console.log(`[BULK-UPLOAD] ✓ File processed successfully: ${part.filename}`)

          results.push({
            fileName: part.filename,
            expenseItem: updatedItem,
            invoiceData: {
              amount: invoiceData.amount,
              date: invoiceData.date,
              description: invoiceData.description,
              category: invoiceData.category
            }
          })
        } catch (error: any) {
          console.error(`[BULK-UPLOAD] ✗ Error processing file ${part.filename}:`, error)
          if (error instanceof Error) {
            console.error(`[BULK-UPLOAD] Error stack:`, error.stack)
          }
          errors.push({
            fileName: part.filename,
            error: error.message || '处理文件失败'
          })
        }
      }
    }

    console.log(`\n[BULK-UPLOAD] ========================================`)
    console.log(`[BULK-UPLOAD] Processing complete: ${results.length} succeeded, ${errors.length} failed`)

    // Update reimbursement total amount
    const items = await prisma.expenseItem.findMany({
      where: { reimbursementId }
    })

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
    console.log(`[BULK-UPLOAD] Updating reimbursement total amount: ${totalAmount}`)

    await prisma.reimbursement.update({
      where: { id: reimbursementId },
      data: { totalAmount }
    })

    console.log(`[BULK-UPLOAD] Bulk upload completed successfully`)

    return {
      data: {
        success: results.length,
        failed: errors.length,
        results,
        errors
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '批量上传发票失败'
    })
  }
})
