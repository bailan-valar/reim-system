import { recognizeInvoiceBuffer } from '~/server/utils/tencentOcr'

/**
 * Invoice recognition preview endpoint
 * Returns OCR results without saving to database
 */
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

    // Parse form data
    for (const part of formData) {
      if (part.name === 'file' && part.filename) {
        file = new File([part.data], part.filename, { type: part.type })
        break
      }
    }

    if (!file) {
      throw createError({
        statusCode: 400,
        message: '文件缺失'
      })
    }

    console.log('[INVOICE-RECOGNIZE] Starting OCR recognition for preview')
    console.log(`[INVOICE-RECOGNIZE] File: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`)

    const buffer = Buffer.from(await file.arrayBuffer())

    // Use Tencent Cloud OCR
    let result = null
    try {
      console.log('[INVOICE-RECOGNIZE] Attempting Tencent OCR...')
      const tencentResult = await recognizeInvoiceBuffer(buffer, file.type)

      if (tencentResult.success) {
        console.log('[INVOICE-RECOGNIZE] ✓ Tencent OCR successful')
        result = {
          invoiceNumber: tencentResult.invoiceNumber,
          invoiceCode: tencentResult.invoiceCode,
          invoiceType: tencentResult.invoiceType,
          totalAmount: tencentResult.totalAmount,
          taxRate: tencentResult.taxRate,
          taxAmount: tencentResult.taxAmount,
          invoiceDate: tencentResult.invoiceDate,
          sellerName: tencentResult.sellerName,
          buyerName: tencentResult.buyerName,
          remark: tencentResult.remark
        }
      } else {
        console.log('[INVOICE-RECOGNIZE] Tencent OCR failed:', tencentResult.error)
      }
    } catch (error: any) {
      console.error('[INVOICE-RECOGNIZE] OCR failed:', error.message)
    }

    if (!result) {
      return {
        success: false,
        message: 'OCR识别失败，请手动填写发票信息'
      }
    }

    // Clean up result - remove undefined values
    const cleanResult = Object.fromEntries(
      Object.entries(result).filter(([_, v]) => v !== undefined && v !== null)
    )

    console.log('[INVOICE-RECOGNIZE] ✓ Recognition complete:', cleanResult)

    return {
      success: true,
      data: cleanResult
    }

  } catch (error: any) {
    console.error('[INVOICE-RECOGNIZE] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '识别失败'
    })
  }
})
