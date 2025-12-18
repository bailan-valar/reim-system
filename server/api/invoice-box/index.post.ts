import prisma from '~/server/utils/prisma'
import { saveFile } from '~/server/utils/fileUpload'
import { recognizeInvoiceBuffer } from '~/server/utils/tencentOcr'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)

    if (!formData) {
      throw createError({
        statusCode: 400,
        message: '没有上传文件'
      })
    }

    let file: File | null = null
    let invoiceNumber: string | null = null
    let invoiceType: string | null = null
    let totalAmount: number | null = null
    let taxRate: number | null = null
    let taxAmount: number | null = null
    let invoiceDate: string | null = null

    // Parse form data
    for (const part of formData) {
      if (part.name === 'file' && part.filename) {
        file = new File([part.data], part.filename, { type: part.type })
      } else if (part.name === 'invoiceNumber') {
        invoiceNumber = part.data.toString()
      } else if (part.name === 'invoiceType') {
        invoiceType = part.data.toString()
      } else if (part.name === 'totalAmount') {
        totalAmount = parseFloat(part.data.toString())
      } else if (part.name === 'taxRate') {
        taxRate = parseFloat(part.data.toString())
      } else if (part.name === 'taxAmount') {
        taxAmount = parseFloat(part.data.toString())
      } else if (part.name === 'invoiceDate') {
        invoiceDate = part.data.toString()
      }
    }

    if (!file) {
      throw createError({
        statusCode: 400,
        message: '文件缺失'
      })
    }

    // Save file
    const uploadedFile = await saveFile(file, 'invoice-box')

    // Try OCR recognition if invoice data not provided
    let ocrData = null

    if (!invoiceNumber || !totalAmount || !invoiceDate) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())

        // Use Tencent Cloud OCR for invoice recognition
        console.log('[INVOICE-BOX] Attempting Tencent OCR recognition...')
        ocrData = await recognizeInvoiceBuffer(buffer, file.type)

        if (!ocrData.success) {
          console.log('[INVOICE-BOX] Tencent OCR failed:', ocrData.error)
        }
      } catch (error) {
        console.error('[INVOICE-BOX] OCR recognition failed:', error)
      }
    }

    // Use OCR data as fallback
    const finalInvoiceNumber = invoiceNumber || ocrData?.invoiceNumber || `INV-${Date.now()}`
    const finalTotalAmount = totalAmount || ocrData?.totalAmount || 0
    const finalInvoiceDate = invoiceDate || ocrData?.invoiceDate || new Date().toISOString()
    const finalInvoiceType = invoiceType || ocrData?.invoiceType || '其他'
    const finalTaxRate = taxRate || ocrData?.taxRate || null
    const finalTaxAmount = taxAmount || ocrData?.taxAmount || null

    // Check if invoice number already exists
    const existingInvoice = await prisma.invoiceBox.findUnique({
      where: { invoiceNumber: finalInvoiceNumber }
    })

    if (existingInvoice) {
      throw createError({
        statusCode: 400,
        message: '发票号码已存在'
      })
    }

    // Create invoice box entry
    const invoice = await prisma.invoiceBox.create({
      data: {
        invoiceNumber: finalInvoiceNumber,
        invoiceType: finalInvoiceType,
        totalAmount: finalTotalAmount,
        taxRate: finalTaxRate,
        taxAmount: finalTaxAmount,
        invoiceDate: new Date(finalInvoiceDate),
        fileName: uploadedFile.fileName,
        filePath: uploadedFile.filePath,
        status: '未使用'
      }
    })

    return {
      data: invoice
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '创建发票失败'
    })
  }
})
