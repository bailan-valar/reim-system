/**
 * API endpoint for converting PDF files to images
 * POST /api/pdf/convert-to-image
 */

import { convertPdfPageToImage, PdfConversionError } from '~/server/utils/pdfToImage'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { pdfPath, pageNumber = 1, scale = 2.0, width, height } = body

    if (!pdfPath) {
      throw createError({
        statusCode: 400,
        statusMessage: 'PDF path is required'
      })
    }

    console.log(`[API] Converting PDF to image: ${pdfPath}, page ${pageNumber}`)

    // Convert relative path to absolute path
    // Assuming PDF files are stored in the public directory
    const absolutePath = pdfPath.startsWith('/')
      ? join(process.cwd(), 'public', pdfPath)
      : pdfPath

    // Convert PDF page to image
    const result = await convertPdfPageToImage(absolutePath, pageNumber, {
      scale,
      width,
      height,
      format: 'png'
    })

    console.log(`[API] Successfully converted PDF page ${pageNumber}`)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('[API] PDF conversion error:', error)

    if (error instanceof PdfConversionError) {
      const statusCode = error.code === 'FILE_NOT_FOUND' ? 404 : 500

      throw createError({
        statusCode,
        statusMessage: error.message,
        data: {
          code: error.code
        }
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to convert PDF'
    })
  }
})
