/**
 * PDF Dimensions Utility
 * Utilities for getting real PDF dimensions from embedded PDF viewers
 */

/**
 * PDF dimensions result
 */
export interface PdfDimensions {
  width: number
  height: number
}

/**
 * Get real PDF dimensions from an embedded PDF viewer
 * This function attempts to access the PDF viewer's internal sizer element
 * through Shadow DOM to get the actual rendered dimensions
 *
 * @param iframeElement - The iframe element containing the PDF viewer
 * @returns Promise resolving to PDF dimensions or null if not found
 */
export async function getPdfDimensionsFromIframe(
  iframeElement: HTMLIFrameElement
): Promise<PdfDimensions | null> {
  try {
    // Wait a bit for the PDF to load
    await new Promise(resolve => setTimeout(resolve, 500))

    const contentDocument = iframeElement.contentDocument
    if (!contentDocument) {
      console.warn('[PdfDimensions] Cannot access iframe content document')
      return null
    }

    // Try to find the viewer element
    const viewer = contentDocument.querySelector('#viewer')
    if (!viewer) {
      console.warn('[PdfDimensions] Viewer element not found')
      return null
    }

    // Check if viewer has shadow root
    const viewerShadowRoot = (viewer as any).shadowRoot
    if (!viewerShadowRoot) {
      console.warn('[PdfDimensions] Viewer shadow root not found')
      return null
    }

    // Try to find the plugin element
    const plugin = viewerShadowRoot.querySelector('#plugin')
    if (!plugin) {
      console.warn('[PdfDimensions] Plugin element not found')
      return null
    }

    // Check if plugin has shadow root
    const pluginShadowRoot = (plugin as any).shadowRoot
    if (!pluginShadowRoot) {
      console.warn('[PdfDimensions] Plugin shadow root not found')
      return null
    }

    // Try to find the sizer element
    const sizer = pluginShadowRoot.querySelector('#sizer')
    if (!sizer) {
      console.warn('[PdfDimensions] Sizer element not found')
      return null
    }

    // Get dimensions
    const rect = sizer.getBoundingClientRect()
    const width = rect.width || (sizer as HTMLElement).offsetWidth
    const height = rect.height || (sizer as HTMLElement).offsetHeight

    if (width && height) {
      console.log('[PdfDimensions] Successfully retrieved PDF dimensions:', { width, height })
      return { width, height }
    }

    return null
  } catch (error) {
    console.error('[PdfDimensions] Error getting PDF dimensions:', error)
    return null
  }
}

/**
 * Get PDF dimensions from an object element
 *
 * @param objectElement - The object element containing the PDF
 * @returns Promise resolving to PDF dimensions or null if not found
 */
export async function getPdfDimensionsFromObject(
  objectElement: HTMLObjectElement
): Promise<PdfDimensions | null> {
  try {
    // Wait a bit for the PDF to load
    await new Promise(resolve => setTimeout(resolve, 500))

    const contentDocument = objectElement.contentDocument
    if (!contentDocument) {
      console.warn('[PdfDimensions] Cannot access object content document')
      return null
    }

    // Try to find the viewer element
    const viewer = contentDocument.querySelector('#viewer')
    if (!viewer) {
      console.warn('[PdfDimensions] Viewer element not found')
      return null
    }

    // Check if viewer has shadow root
    const viewerShadowRoot = (viewer as any).shadowRoot
    if (!viewerShadowRoot) {
      console.warn('[PdfDimensions] Viewer shadow root not found')
      return null
    }

    // Try to find the plugin element
    const plugin = viewerShadowRoot.querySelector('#plugin')
    if (!plugin) {
      console.warn('[PdfDimensions] Plugin element not found')
      return null
    }

    // Check if plugin has shadow root
    const pluginShadowRoot = (plugin as any).shadowRoot
    if (!pluginShadowRoot) {
      console.warn('[PdfDimensions] Plugin shadow root not found')
      return null
    }

    // Try to find the sizer element
    const sizer = pluginShadowRoot.querySelector('#sizer')
    if (!sizer) {
      console.warn('[PdfDimensions] Sizer element not found')
      return null
    }

    // Get dimensions
    const rect = sizer.getBoundingClientRect()
    const width = rect.width || (sizer as HTMLElement).offsetWidth
    const height = rect.height || (sizer as HTMLElement).offsetHeight

    if (width && height) {
      console.log('[PdfDimensions] Successfully retrieved PDF dimensions:', { width, height })
      return { width, height }
    }

    return null
  } catch (error) {
    console.error('[PdfDimensions] Error getting PDF dimensions:', error)
    return null
  }
}

/**
 * Wait for PDF to load and get dimensions
 * Retries multiple times with increasing delays
 *
 * @param element - The iframe or object element containing the PDF
 * @param maxRetries - Maximum number of retries (default: 5)
 * @returns Promise resolving to PDF dimensions or null if not found
 */
export async function waitForPdfDimensions(
  element: HTMLIFrameElement | HTMLObjectElement,
  maxRetries: number = 5
): Promise<PdfDimensions | null> {
  const isIframe = element instanceof HTMLIFrameElement
  const getDimensions = isIframe ? getPdfDimensionsFromIframe : getPdfDimensionsFromObject

  for (let i = 0; i < maxRetries; i++) {
    const dimensions = await getDimensions(element as any)
    if (dimensions) {
      return dimensions
    }

    // Wait before retrying (exponential backoff)
    const delay = 500 * Math.pow(1.5, i)
    console.log(`[PdfDimensions] Retry ${i + 1}/${maxRetries} after ${delay}ms`)
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  console.warn('[PdfDimensions] Failed to get PDF dimensions after all retries')
  return null
}
