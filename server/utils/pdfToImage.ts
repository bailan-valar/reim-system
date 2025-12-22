/**
 * PDF to Image Converter using pdf-to-img
 * Server-side utility for converting PDF files to high-quality images
 */

import { pdf } from 'pdf-to-img'
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'

/**
 * Configuration for PDF to image conversion
 */
export interface PdfToImageOptions {
  /** Scale factor for rendering (default: 2.0 for high quality) */
  scale?: number
  /** Target width in pixels (optional) */
  width?: number
  /** Target height in pixels (optional) */
  height?: number
  /** Output format (default: 'png') */
  format?: 'png' | 'jpeg'
  /** JPEG quality (0-100, only for JPEG format) */
  quality?: number
}

/**
 * Result of PDF to image conversion
 */
export interface PdfToImageResult {
  /** Base64 data URL of the converted image */
  dataUrl: string
  /** Width of the image in pixels */
  width: number
  /** Height of the image in pixels */
  height: number
  /** Page number that was converted */
  pageNumber: number
  /** Total number of pages in the PDF */
  totalPages: number
}

/**
 * Error class for PDF conversion errors
 */
export class PdfConversionError extends Error {
  constructor(
    message: string,
    public code: 'FILE_NOT_FOUND' | 'CONVERSION_FAILED' | 'INVALID_PAGE' | 'MEMORY_ERROR',
    public originalError?: Error
  ) {
    super(message)
    this.name = 'PdfConversionError'
  }
}

/**
 * Get pdfjs-dist paths for CMap and standard fonts
 */
function getPdfjsPaths() {
  try {
    // In Nuxt/Node.js environment, we need to resolve the pdfjs-dist package
    const pdfjsDistPath = dirname(fileURLToPath(import.meta.resolve('pdfjs-dist/package.json')))
    return {
      cMapUrl: join(pdfjsDistPath, 'cmaps') + '/',
      standardFontDataUrl: join(pdfjsDistPath, 'standard_fonts') + '/'
    }
  } catch (error) {
    console.warn('[PdfToImage] Could not resolve pdfjs-dist paths, using defaults')
    return {
      cMapUrl: './node_modules/pdfjs-dist/cmaps/',
      standardFontDataUrl: './node_modules/pdfjs-dist/standard_fonts/'
    }
  }
}

/**
 * Convert a single page of a PDF to a base64 image
 *
 * @param pdfPath - Absolute path to the PDF file
 * @param pageNumber - Page number to convert (1-indexed)
 * @param options - Conversion options
 * @returns Promise resolving to conversion result with base64 data URL
 */
export async function convertPdfPageToImage(
  pdfPath: string,
  pageNumber: number = 1,
  options: PdfToImageOptions = {}
): Promise<PdfToImageResult> {
  const {
    scale = 2.0,
    width,
    height,
    format = 'png'
  } = options

  // Check if file exists
  if (!existsSync(pdfPath)) {
    throw new PdfConversionError(
      `PDF file not found: ${pdfPath}`,
      'FILE_NOT_FOUND'
    )
  }

  console.log(`[PdfToImage] Converting PDF page ${pageNumber}: ${pdfPath}`)

  try {
    // Get pdfjs paths for Chinese character support
    const pdfjsPaths = getPdfjsPaths()

    // Configure conversion options
    const convertOptions: any = {
      scale,
      docInitParams: {
        cMapUrl: pdfjsPaths.cMapUrl,
        cMapPacked: true,
        standardFontDataUrl: pdfjsPaths.standardFontDataUrl
      }
    }

    if (width) convertOptions.width = width
    if (height) convertOptions.height = height

    // Convert PDF to images
    const document = await pdf(pdfPath, convertOptions)

    let currentPage = 0
    let totalPages = 0
    let targetImageBuffer: Buffer | null = null

    // Iterate through pages to find the target page
    for await (const image of document) {
      currentPage++
      totalPages = currentPage // Update total as we go

      if (currentPage === pageNumber) {
        targetImageBuffer = image
        // Continue iterating to get total page count
      }
    }

    // Validate page number
    if (pageNumber < 1 || pageNumber > totalPages) {
      throw new PdfConversionError(
        `Invalid page number: ${pageNumber}. PDF has ${totalPages} pages.`,
        'INVALID_PAGE'
      )
    }

    if (!targetImageBuffer) {
      throw new PdfConversionError(
        `Failed to extract page ${pageNumber}`,
        'CONVERSION_FAILED'
      )
    }

    // Convert buffer to base64 data URL
    const base64 = targetImageBuffer.toString('base64')
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
    const dataUrl = `data:${mimeType};base64,${base64}`

    console.log(`[PdfToImage] Successfully converted page ${pageNumber}/${totalPages}`)

    // Note: We can't easily get exact dimensions without decoding the image
    // For now, return estimated dimensions based on scale
    // A4 at 72 DPI: 595x842 points
    const estimatedWidth = Math.round(595 * scale)
    const estimatedHeight = Math.round(842 * scale)

    return {
      dataUrl,
      width: width || estimatedWidth,
      height: height || estimatedHeight,
      pageNumber,
      totalPages
    }
  } catch (error) {
    if (error instanceof PdfConversionError) {
      throw error
    }

    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('memory') || errorMessage.includes('allocation')) {
      throw new PdfConversionError(
        `Memory error while converting PDF: ${errorMessage}`,
        'MEMORY_ERROR',
        error instanceof Error ? error : undefined
      )
    }

    throw new PdfConversionError(
      `Failed to convert PDF: ${errorMessage}`,
      'CONVERSION_FAILED',
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Convert all pages of a PDF to base64 images
 *
 * @param pdfPath - Absolute path to the PDF file
 * @param options - Conversion options
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to array of conversion results
 */
export async function convertPdfToImages(
  pdfPath: string,
  options: PdfToImageOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<PdfToImageResult[]> {
  const {
    scale = 2.0,
    width,
    height,
    format = 'png'
  } = options

  // Check if file exists
  if (!existsSync(pdfPath)) {
    throw new PdfConversionError(
      `PDF file not found: ${pdfPath}`,
      'FILE_NOT_FOUND'
    )
  }

  console.log(`[PdfToImage] Converting all pages of PDF: ${pdfPath}`)

  try {
    // Get pdfjs paths for Chinese character support
    const pdfjsPaths = getPdfjsPaths()

    // Configure conversion options
    const convertOptions: any = {
      scale,
      docInitParams: {
        cMapUrl: pdfjsPaths.cMapUrl,
        cMapPacked: true,
        standardFontDataUrl: pdfjsPaths.standardFontDataUrl
      }
    }

    if (width) convertOptions.width = width
    if (height) convertOptions.height = height

    // Convert PDF to images
    const document = await pdf(pdfPath, convertOptions)
    const results: PdfToImageResult[] = []

    let currentPage = 0
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'

    // Estimated dimensions based on scale (A4 at 72 DPI: 595x842 points)
    const estimatedWidth = width || Math.round(595 * scale)
    const estimatedHeight = height || Math.round(842 * scale)

    // First pass: collect all images to get total count
    const imageBuffers: Buffer[] = []
    for await (const image of document) {
      imageBuffers.push(image)
      currentPage++
    }

    const totalPages = imageBuffers.length

    // Second pass: convert to data URLs with progress
    for (let i = 0; i < imageBuffers.length; i++) {
      const base64 = imageBuffers[i].toString('base64')
      const dataUrl = `data:${mimeType};base64,${base64}`

      results.push({
        dataUrl,
        width: estimatedWidth,
        height: estimatedHeight,
        pageNumber: i + 1,
        totalPages
      })

      if (onProgress) {
        onProgress(i + 1, totalPages)
      }
    }

    console.log(`[PdfToImage] Successfully converted ${totalPages} pages`)

    return results
  } catch (error) {
    if (error instanceof PdfConversionError) {
      throw error
    }

    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('memory') || errorMessage.includes('allocation')) {
      throw new PdfConversionError(
        `Memory error while converting PDF: ${errorMessage}`,
        'MEMORY_ERROR',
        error instanceof Error ? error : undefined
      )
    }

    throw new PdfConversionError(
      `Failed to convert PDF: ${errorMessage}`,
      'CONVERSION_FAILED',
      error instanceof Error ? error : undefined
    )
  }
}
