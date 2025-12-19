/**
 * PDF to Image Renderer using PDF.js
 * Converts PDF files to high-quality images suitable for printing
 */

import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
// The worker URL needs to be set to use PDF.js in the browser
const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL
}

/**
 * Configuration for PDF rendering
 */
export interface PdfRenderOptions {
  /** Target DPI for rendering (default: 300 for high-quality printing) */
  dpi?: number
  /** Scale factor (calculated from DPI if not provided) */
  scale?: number
  /** Maximum width in pixels (optional, for memory management) */
  maxWidth?: number
  /** Maximum height in pixels (optional, for memory management) */
  maxHeight?: number
  /** Image format (default: 'image/png') */
  format?: 'image/png' | 'image/jpeg'
  /** JPEG quality (0-1, only for JPEG format) */
  quality?: number
}

/**
 * Result of PDF rendering
 */
export interface PdfRenderResult {
  /** Base64 data URL of the rendered image */
  dataUrl: string
  /** Width of the rendered image in pixels */
  width: number
  /** Height of the rendered image in pixels */
  height: number
  /** Page number that was rendered */
  pageNumber: number
  /** Total number of pages in the PDF */
  totalPages: number
}

/**
 * Error types for better error handling
 */
export class PdfRenderError extends Error {
  constructor(
    message: string,
    public code: 'LOAD_FAILED' | 'RENDER_FAILED' | 'INVALID_PAGE' | 'MEMORY_ERROR',
    public originalError?: Error
  ) {
    super(message)
    this.name = 'PdfRenderError'
  }
}

/**
 * Renders a single page of a PDF to a high-quality image
 *
 * @param pdfUrl - URL or path to the PDF file
 * @param pageNumber - Page number to render (1-indexed)
 * @param options - Rendering options
 * @returns Promise resolving to render result with data URL
 *
 * @example
 * ```typescript
 * const result = await renderPdfPageToImage('/uploads/invoice.pdf', 1, { dpi: 300 })
 * console.log(result.dataUrl) // "data:image/png;base64,..."
 * ```
 */
export async function renderPdfPageToImage(
  pdfUrl: string,
  pageNumber: number = 1,
  options: PdfRenderOptions = {}
): Promise<PdfRenderResult> {
  const {
    dpi = 300,
    scale: customScale,
    maxWidth = 4096,
    maxHeight = 4096,
    format = 'image/png',
    quality = 0.95
  } = options

  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(pdfUrl)
    const pdf = await loadingTask.promise

    // Validate page number
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new PdfRenderError(
        `Invalid page number: ${pageNumber}. PDF has ${pdf.numPages} pages.`,
        'INVALID_PAGE'
      )
    }

    // Get the specific page
    const page = await pdf.getPage(pageNumber)

    // Calculate scale based on DPI
    // PDF.js uses 72 DPI as base, so scale = targetDPI / 72
    const scale = customScale ?? (dpi / 72)

    // Get viewport with calculated scale
    const viewport = page.getViewport({ scale })

    // Check if dimensions exceed limits
    let finalScale = scale
    if (viewport.width > maxWidth || viewport.height > maxHeight) {
      const widthScale = maxWidth / viewport.width
      const heightScale = maxHeight / viewport.height
      finalScale = scale * Math.min(widthScale, heightScale)
      console.warn(
        `[PdfRenderer] Dimensions exceed limits. Adjusting scale from ${scale} to ${finalScale}`
      )
    }

    // Get final viewport
    const finalViewport = page.getViewport({ scale: finalScale })

    // Create canvas for rendering
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', {
      alpha: false, // Disable alpha for better performance
      willReadFrequently: false
    })

    if (!context) {
      throw new PdfRenderError(
        'Failed to get canvas 2D context',
        'RENDER_FAILED'
      )
    }

    // Set canvas dimensions
    canvas.width = finalViewport.width
    canvas.height = finalViewport.height

    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: finalViewport,
      // Enable high-quality rendering
      intent: 'print' as const,
      // Improve text rendering
      enableWebGL: false,
      renderInteractiveForms: false
    }

    await page.render(renderContext).promise

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL(format, quality)

    // Clean up
    page.cleanup()

    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      pageNumber,
      totalPages: pdf.numPages
    }
  } catch (error) {
    if (error instanceof PdfRenderError) {
      throw error
    }

    // Determine error type
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('fetch') || errorMessage.includes('load')) {
      throw new PdfRenderError(
        `Failed to load PDF: ${errorMessage}`,
        'LOAD_FAILED',
        error instanceof Error ? error : undefined
      )
    }

    if (errorMessage.includes('memory') || errorMessage.includes('allocation')) {
      throw new PdfRenderError(
        `Memory error while rendering PDF: ${errorMessage}`,
        'MEMORY_ERROR',
        error instanceof Error ? error : undefined
      )
    }

    throw new PdfRenderError(
      `Failed to render PDF: ${errorMessage}`,
      'RENDER_FAILED',
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Renders all pages of a PDF to high-quality images
 *
 * @param pdfUrl - URL or path to the PDF file
 * @param options - Rendering options
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to array of render results
 *
 * @example
 * ```typescript
 * const results = await renderPdfToImages('/uploads/invoice.pdf',
 *   { dpi: 300 },
 *   (current, total) => console.log(`Rendering ${current}/${total}`)
 * )
 * ```
 */
export async function renderPdfToImages(
  pdfUrl: string,
  options: PdfRenderOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<PdfRenderResult[]> {
  try {
    // First, load PDF to get page count
    const loadingTask = pdfjsLib.getDocument(pdfUrl)
    const pdf = await loadingTask.promise
    const totalPages = pdf.numPages

    // Render all pages
    const results: PdfRenderResult[] = []

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const result = await renderPdfPageToImage(pdfUrl, pageNum, options)
      results.push(result)

      // Call progress callback
      if (onProgress) {
        onProgress(pageNum, totalPages)
      }
    }

    return results
  } catch (error) {
    if (error instanceof PdfRenderError) {
      throw error
    }

    throw new PdfRenderError(
      `Failed to render PDF pages: ${error instanceof Error ? error.message : String(error)}`,
      'RENDER_FAILED',
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Batch render multiple PDFs with progress tracking
 * Useful for rendering multiple invoice PDFs
 *
 * @param pdfUrls - Array of PDF URLs to render
 * @param options - Rendering options
 * @param onProgress - Optional callback for overall progress
 * @returns Promise resolving to map of URL to render results
 */
export async function batchRenderPdfs(
  pdfUrls: string[],
  options: PdfRenderOptions = {},
  onProgress?: (completed: number, total: number, currentUrl: string) => void
): Promise<Map<string, PdfRenderResult[]>> {
  const results = new Map<string, PdfRenderResult[]>()
  const total = pdfUrls.length

  for (let i = 0; i < pdfUrls.length; i++) {
    const url = pdfUrls[i]

    try {
      const pdfResults = await renderPdfToImages(url, options)
      results.set(url, pdfResults)

      if (onProgress) {
        onProgress(i + 1, total, url)
      }
    } catch (error) {
      console.error(`[PdfRenderer] Failed to render ${url}:`, error)
      // Store empty array for failed PDFs
      results.set(url, [])
    }
  }

  return results
}
