import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import JSZip from 'jszip'
import { parseString } from 'xml2js'
import { recognizeInvoice } from './aliyunOcr.ts'

// Configure PDF.js worker for Node.js environment
// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
// pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`
pdfjsLib.GlobalWorkerOptions.workerSrc = `../../../pdfjs-dist/build/pdf.worker.mjs`

export interface InvoiceData {
  amount: number
  date: Date
  description: string
  category: string
  rawText: string
}

/**
 * Convert Chinese uppercase number to Arabic number
 * e.g., "肆仟捌佰贰拾贰" -> 4822
 */
function convertChineseNumberToArabic(chineseNum: string): number {
  const chineseDigits: { [key: string]: number } = {
    '零': 0, '壹': 1, '贰': 2, '叁': 3, '肆': 4,
    '伍': 5, '陆': 6, '柒': 7, '捌': 8, '玖': 9
  }

  const chineseUnits: { [key: string]: number } = {
    '拾': 10, '佰': 100, '仟': 1000, '万': 10000, '亿': 100000000
  }

  let result = 0
  let temp = 0
  let unit = 1

  for (let i = chineseNum.length - 1; i >= 0; i--) {
    const char = chineseNum[i]

    if (char in chineseDigits) {
      temp = chineseDigits[char] * unit
      result += temp
    } else if (char in chineseUnits) {
      unit = chineseUnits[char]
      if (unit >= 10000) {
        result = result * unit
        unit = 1
      }
    }
  }

  return result
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = new Uint8Array(buffer)
    const pdf = await pdfjsLib.getDocument({ data }).promise

    let fullText = ''

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n'
    }

    return fullText
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('PDF解析失败')
  }
}

/**
 * Detect if OFD file uses vector graphics layout (Type 3)
 * Type 3 files have many PathObjects and few/no TextObjects
 */
function detectVectorGraphicsLayout(parsed: any): boolean {
  try {
    // Navigate to: ofd:Page → ofd:Content → ofd:Layer
    const page = parsed['ofd:Page']
    if (!page) return false

    const content = page['ofd:Content']
    if (!content || !Array.isArray(content) || content.length === 0) return false

    const layer = content[0]['ofd:Layer']
    if (!layer || !Array.isArray(layer) || layer.length === 0) return false

    const layerData = layer[0]

    // Check for PageBlock with PathObjects
    const pageBlock = layerData['ofd:PageBlock']
    if (pageBlock && Array.isArray(pageBlock) && pageBlock.length > 0) {
      const pathObjects = pageBlock[0]['ofd:PathObject']
      const pathCount = pathObjects ? (Array.isArray(pathObjects) ? pathObjects.length : 1) : 0

      // Check TextObject count
      const textObjects = layerData['ofd:TextObject']
      const textCount = textObjects ? (Array.isArray(textObjects) ? textObjects.length : 1) : 0

      console.log(`[OFD-DETECT] PathObject count: ${pathCount}, TextObject count: ${textCount}`)

      // Type 3: Many PathObjects (>100) and few/no TextObjects (<5)
      if (pathCount > 100 && textCount < 5) {
        console.log('[OFD-DETECT] Detected Type 3 (Vector Graphics) layout')
        return true
      }
    }

    console.log('[OFD-DETECT] Detected Type 1/2 (Text-based) layout')
    return false
  } catch (error) {
    console.warn('[OFD-DETECT] Error detecting layout type:', error)
    return false
  }
}

/**
 * Extract text from Type 3 OFD (Vector Graphics) using Aliyun OCR
 */
async function extractType3VectorGraphics(buffer: Buffer): Promise<string> {
  console.log('[OFD-TYPE3] Starting Type 3 (Vector Graphics) extraction using OCR')

  try {
    // Call Aliyun OCR API
    const ocrResult = await recognizeInvoice(buffer, 'application/ofd')

    if (ocrResult.success && ocrResult.text) {
      console.log(`[OFD-TYPE3] ✓ OCR successful, extracted ${ocrResult.text.length} characters`)
      return ocrResult.text
    } else {
      console.error(`[OFD-TYPE3] ✗ OCR failed: ${ocrResult.error}`)
      throw new Error(`OCR识别失败: ${ocrResult.error}`)
    }
  } catch (error: any) {
    console.error('[OFD-TYPE3] ✗ OCR extraction error:', error)
    throw new Error(`OCR识别失败: ${error.message}`)
  }
}

/**
 * Extract text from OFD file
 * OFD files are ZIP archives containing XML files
 * Supports Type 1 (Direct Text), Type 2 (Glyph Mapping), and Type 3 (Vector Graphics)
 */
export async function extractTextFromOFD(buffer: Buffer): Promise<string> {
  try {
    console.log('[OFD-EXTRACT] Starting OFD text extraction')

    // Load OFD file as ZIP archive
    const zip = await JSZip.loadAsync(buffer)
    console.log(`[OFD-EXTRACT] OFD archive loaded, files: ${Object.keys(zip.files).join(', ')}`)

    // Find main Content.xml to detect layout type
    const contentXmlPath = Object.keys(zip.files).find(name =>
      name.includes('Content.xml') && !name.startsWith('__MACOSX')
    )

    if (contentXmlPath) {
      console.log(`[OFD-EXTRACT] Found Content.xml: ${contentXmlPath}`)

      try {
        const xmlContent = await zip.files[contentXmlPath].async('string')

        // Parse XML to detect layout type
        const parsed = await new Promise<any>((resolve, reject) => {
          parseString(xmlContent, (err, result) => {
            if (err) reject(err)
            else resolve(result)
          })
        })

        // Detect if this is Type 3 (Vector Graphics)
        const isVectorGraphics = detectVectorGraphicsLayout(parsed)

        if (isVectorGraphics) {
          console.log('[OFD-EXTRACT] Using OCR for Type 3 (Vector Graphics) layout')
          return await extractType3VectorGraphics(buffer)
        }
      } catch (error) {
        console.warn('[OFD-EXTRACT] Failed to detect layout type, falling back to generic extraction:', error)
      }
    }

    // For Type 1 and Type 2, use existing generic extraction
    console.log('[OFD-EXTRACT] Using generic text extraction for Type 1/2 layout')

    let fullText = ''

    // OFD files contain XML files with text content
    // Common paths: Doc_0/Pages/Page_0/Content.xml, Doc_0/Document.xml
    const xmlFiles = Object.keys(zip.files).filter(name =>
      name.endsWith('.xml') && !name.startsWith('__MACOSX')
    )

    console.log(`[OFD-EXTRACT] Found ${xmlFiles.length} XML files: ${xmlFiles.join(', ')}`)

    // Extract text from all XML files
    for (const xmlFile of xmlFiles) {
      try {
        const xmlContent = await zip.files[xmlFile].async('string')

        // Parse XML and extract text content
        const text = await new Promise<string>((resolve, reject) => {
          parseString(xmlContent, (err, result) => {
            if (err) {
              reject(err)
              return
            }

            // Extract text from XML structure
            // OFD text is typically in TextObject or TextCode elements
            const extractedText = extractTextFromXML(result)
            resolve(extractedText)
          })
        })

        if (text) {
          fullText += text + ' '
          console.log(`[OFD-EXTRACT] Extracted ${text.length} characters from ${xmlFile}`)
        }
      } catch (error) {
        console.warn(`[OFD-EXTRACT] Failed to parse ${xmlFile}:`, error)
      }
    }

    console.log(`[OFD-EXTRACT] Total extracted text length: ${fullText.length} characters`)
    return fullText.trim()
  } catch (error) {
    console.error('[OFD-EXTRACT] OFD parsing error:', error)
    throw new Error('OFD解析失败')
  }
}

/**
 * Recursively extract text from XML object
 */
function extractTextFromXML(obj: any): string {
  let text = ''

  if (typeof obj === 'string') {
    return obj
  }

  if (typeof obj === 'object' && obj !== null) {
    // Check for text content in common OFD elements
    if (obj.TextCode) {
      text += extractTextFromXML(obj.TextCode) + ' '
    }
    if (obj.TextObject) {
      text += extractTextFromXML(obj.TextObject) + ' '
    }
    if (obj._) {
      // Filter out pure numeric IDs and coordinates (likely OFD internal data)
      const value = obj._.toString().trim()
      // Only include if it's not a pure number or coordinate-like pattern
      if (value && !/^\d+(\.\d+)?$/.test(value)) {
        text += value + ' '
      }
    }

    // Recursively process all properties
    for (const key in obj) {
      if (key !== '_' && key !== '$') {
        // Skip certain OFD internal elements that contain IDs/coordinates
        const skipKeys = ['ID', 'Boundary', 'CTM', 'DrawParam', 'Font', 'Size', 'FillColor', 'StrokeColor']
        if (skipKeys.includes(key)) {
          continue
        }

        if (Array.isArray(obj[key])) {
          for (const item of obj[key]) {
            text += extractTextFromXML(item) + ' '
          }
        } else {
          text += extractTextFromXML(obj[key]) + ' '
        }
      }
    }
  }

  return text
}

/**
 * Parse train ticket information from text
 */
function parseTrainTicket(text: string): InvoiceData | null {
  console.log('[TRAIN-PARSER] Attempting to parse as train ticket')

  // Train ticket patterns - more flexible amount pattern
  const amountPattern = /[¥￥]?\s*(\d+\.?\d*)\s*元?/
  const amountStrictPattern = /:\s*(\d+\.\d{2})\s+\d{10}\*{4}\d{4}/  // Pattern for train ticket: ": 674.00 3301841997****2813"
  const datePattern = /(\d{4})[年\-\/\s]+(\d{1,2})[月\-\/\s]+(\d{1,2})[日号]?/
  const trainPattern = /[GCDZTSPKLY]\d{1,4}/
  const stationPattern = /([A-Z][a-z]+(?:[A-Z][a-z]+)*)/g  // Pattern for station names

  // Try strict pattern first (for train tickets)
  let amountMatch = text.match(amountStrictPattern)
  let amountValue = null

  if (amountMatch) {
    amountValue = amountMatch[1]
    console.log(`[TRAIN-PARSER] Amount match found (strict pattern): ${amountMatch[0]}`)
  } else {
    // Fall back to flexible pattern
    amountMatch = text.match(amountPattern)
    if (amountMatch && parseFloat(amountMatch[1]) > 0) {
      amountValue = amountMatch[1]
      console.log(`[TRAIN-PARSER] Amount match found (flexible pattern): ${amountMatch[0]}`)
    }
  }

  const dateMatch = text.match(datePattern)
  const trainMatch = text.match(trainPattern)

  // Log regex match results
  if (!amountValue) {
    console.log(`[TRAIN-PARSER] ✗ Train ticket parser failed: no amount match found`)
    console.log(`[TRAIN-PARSER] Tried patterns: 1) :\\s*(\\d+\\.\\d{2})\\s+\\d{16}  2) [¥￥]?\\s*(\\d+\\.?\\d*)\\s*元?`)
    return null
  }

  if (dateMatch) {
    console.log(`[TRAIN-PARSER] Date match found: ${dateMatch[0]}`)
  } else {
    console.log(`[TRAIN-PARSER] Date match not found (using current date as fallback)`)
  }

  if (trainMatch) {
    console.log(`[TRAIN-PARSER] Train number match found: ${trainMatch[0]}`)
  } else {
    console.log(`[TRAIN-PARSER] Train number match not found`)
  }

  // Extract stations
  const stations = text.match(stationPattern) || []
  console.log(`[TRAIN-PARSER] Found potential stations: ${stations.join(', ')}`)

  let departureStation = ''
  let arrivalStation = ''

  if (stations.length >= 2) {
    // Find stations around the train number position
    const trainIndex = trainMatch ? text.indexOf(trainMatch[0]) : -1

    if (trainIndex > 0) {
      // Look for station before train number
      const beforeTrain = text.substring(0, trainIndex)

      // Find last capitalized word before train number
      const beforeStations = beforeTrain.match(stationPattern) || []
      if (beforeStations.length > 0) {
        departureStation = beforeStations[beforeStations.length - 1]
      }

      // Find last capitalized word in text (arrival station)
      if (stations.length > 0) {
        arrivalStation = stations[stations.length - 1]
      }
    }
  }

  console.log(`[TRAIN-PARSER] Departure station: ${departureStation || 'N/A'}`)
  console.log(`[TRAIN-PARSER] Arrival station: ${arrivalStation || 'N/A'}`)

  const amount = parseFloat(amountValue)
  let date = new Date()

  if (dateMatch) {
    const year = parseInt(dateMatch[1])
    const month = parseInt(dateMatch[2])
    const day = parseInt(dateMatch[3])
    // Use UTC to avoid timezone issues
    date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  }

  const trainNumber = trainMatch ? trainMatch[0] : ''
  let description = '火车票'

  if (trainNumber) {
    description += ` ${trainNumber}`
  }

  if (departureStation && arrivalStation) {
    description += ` (${departureStation} -> ${arrivalStation})`
  }

  console.log(`[TRAIN-PARSER] ✓ Train ticket recognized: amount=${amount}, date=${date.toISOString().split('T')[0]}, train=${trainNumber || 'N/A'}, route=${departureStation || 'N/A'} -> ${arrivalStation || 'N/A'}, description="${description}"`)

  return {
    amount,
    date,
    description,
    category: '交通',
    rawText: text
  }
}

/**
 * Parse taxi receipt information from text
 */
function parseTaxiReceipt(text: string): InvoiceData | null {
  console.log('[TAXI-PARSER] Attempting to parse as taxi receipt')

  const keywords = ['出租车', '的士', '计程车', 'TAXI', 'taxi']
  const hasKeyword = keywords.some(keyword => text.includes(keyword))

  if (!hasKeyword) {
    console.log(`[TAXI-PARSER] ✗ Taxi receipt parser failed: no keywords found (looking for: ${keywords.join(', ')})`)
    return null
  }

  const foundKeyword = keywords.find(keyword => text.includes(keyword))
  console.log(`[TAXI-PARSER] Keyword detected: "${foundKeyword}"`)

  const amountPattern = /[¥￥]?\s*(\d+\.?\d*)\s*元/
  const datePattern = /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日号]?/

  const amountMatch = text.match(amountPattern)
  const dateMatch = text.match(datePattern)

  if (!amountMatch) {
    console.log(`[TAXI-PARSER] ✗ Taxi receipt parser failed: no amount match found (pattern: [¥￥]?\\s*(\\d+\\.?\\d*)\\s*元)`)
    return null
  }

  console.log(`[TAXI-PARSER] Amount match found: ${amountMatch[0]}`)

  if (dateMatch) {
    console.log(`[TAXI-PARSER] Date match found: ${dateMatch[0]}`)
  } else {
    console.log(`[TAXI-PARSER] Date match not found (using current date as fallback)`)
  }

  const amount = parseFloat(amountMatch[1])
  let date = new Date()

  if (dateMatch) {
    const year = parseInt(dateMatch[1])
    const month = parseInt(dateMatch[2])
    const day = parseInt(dateMatch[3])
    // Use UTC to avoid timezone issues
    date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  }

  console.log(`[TAXI-PARSER] ✓ Taxi receipt recognized: amount=${amount}, date=${date.toISOString().split('T')[0]}, description="出租车费"`)

  return {
    amount,
    date,
    description: '出租车费',
    category: '交通',
    rawText: text
  }
}

/**
 * Parse VAT invoice information from text
 */
function parseVATInvoice(text: string): InvoiceData | null {
  console.log('[VAT-PARSER] Attempting to parse as VAT invoice')

  const keywords = ['增值税', '发票', '价税合计', '金额']
  const hasKeyword = keywords.some(keyword => text.includes(keyword))

  if (!hasKeyword) {
    console.log(`[VAT-PARSER] ✗ VAT invoice parser failed: no keywords found (looking for: ${keywords.join(', ')})`)
    return null
  }

  const foundKeywords = keywords.filter(keyword => text.includes(keyword))
  console.log(`[VAT-PARSER] Keywords detected: ${foundKeywords.join(', ')}`)

  // Try to find total amount (价税合计)
  const totalPattern = /价税合计[：:￥¥\s]*(\d+\.?\d*)/
  const amountPattern = /[¥￥]\s*(\d+\.?\d*)\s*元/
  const datePattern = /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日号]?/

  const totalMatch = text.match(totalPattern)
  const amountMatch = text.match(amountPattern)
  const dateMatch = text.match(datePattern)

  if (totalMatch) {
    console.log(`[VAT-PARSER] Total amount match found (价税合计): ${totalMatch[0]}`)
  } else if (amountMatch) {
    console.log(`[VAT-PARSER] Generic amount match found: ${amountMatch[0]}`)
  } else {
    console.log(`[VAT-PARSER] ✗ VAT invoice parser failed: no amount match found`)
    return null
  }

  const amount = totalMatch
    ? parseFloat(totalMatch[1])
    : amountMatch
    ? parseFloat(amountMatch[1])
    : 0

  if (amount <= 0) {
    console.log(`[VAT-PARSER] ✗ VAT invoice parser failed: amount is zero or negative`)
    return null
  }

  let date = new Date()

  if (dateMatch) {
    console.log(`[VAT-PARSER] Date match found: ${dateMatch[0]}`)
    const year = parseInt(dateMatch[1])
    const month = parseInt(dateMatch[2])
    const day = parseInt(dateMatch[3])
    // Use UTC to avoid timezone issues
    date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  } else {
    console.log(`[VAT-PARSER] Date match not found (using current date as fallback)`)
  }

  // Try to determine category from content
  let category = '其他'
  if (text.includes('餐饮') || text.includes('食品')) {
    category = '餐饮'
    console.log(`[VAT-PARSER] Category determined: 餐饮 (found keywords: 餐饮/食品)`)
  } else if (text.includes('住宿') || text.includes('酒店')) {
    category = '住宿'
    console.log(`[VAT-PARSER] Category determined: 住宿 (found keywords: 住宿/酒店)`)
  } else if (text.includes('办公') || text.includes('文具')) {
    category = '办公'
    console.log(`[VAT-PARSER] Category determined: 办公 (found keywords: 办公/文具)`)
  } else if (text.includes('交通') || text.includes('汽油')) {
    category = '交通'
    console.log(`[VAT-PARSER] Category determined: 交通 (found keywords: 交通/汽油)`)
  } else {
    console.log(`[VAT-PARSER] Category defaulted to: 其他 (no specific category keywords found)`)
  }

  console.log(`[VAT-PARSER] ✓ VAT invoice recognized: amount=${amount}, date=${date.toISOString().split('T')[0]}, category="${category}", description="增值税发票"`)

  return {
    amount,
    date,
    description: '增值税发票',
    category,
    rawText: text
  }
}

/**
 * Parse regular invoice (普通发票) information from text
 */
function parseRegularInvoice(text: string): InvoiceData | null {
  console.log('[REGULAR-INVOICE-PARSER] Attempting to parse as regular invoice')

  // Keywords to identify regular invoice
  const keywords = ['普通发票', '通用机打发票', '通用定额发票', '电子发票（普通发票）']
  const hasKeyword = keywords.some(keyword => text.includes(keyword))

  if (!hasKeyword) {
    console.log(`[REGULAR-INVOICE-PARSER] ✗ Regular invoice parser failed: no keywords found (looking for: ${keywords.join(', ')})`)
    return null
  }

  const foundKeyword = keywords.find(keyword => text.includes(keyword))
  console.log(`[REGULAR-INVOICE-PARSER] Keyword detected: "${foundKeyword}"`)

  // Extract invoice number (usually 10-20 digits, appears early in text)
  // Pattern: continuous digits of 10-20 length
  const invoiceNumberPattern = /\b(\d{10,20})\b/
  const invoiceNumberMatch = text.match(invoiceNumberPattern)

  if (invoiceNumberMatch) {
    console.log(`[REGULAR-INVOICE-PARSER] Invoice number match found: ${invoiceNumberMatch[1]}`)
  }

  // Extract amount - try multiple patterns
  // Pattern 1: Chinese amount followed by number (e.g., "肆仟捌佰贰拾贰圆整 ¥ 4822.00")
  // Allow spaces/digits between Chinese and the amount
  const amountPattern1 = /[壹贰叁肆伍陆柒捌玖拾佰仟万亿圆整]+[\s\d¥￥]*?(\d{3,}\.\d{2})/
  // Pattern 2: Look for 4+ digit amounts with decimal (e.g., "4822.00")
  const amountPattern2 = /\b(\d{3,}\.\d{2})\b/g
  // Pattern 3: Price-tax total with explicit label
  const amountPattern3 = /价税合计[：:（(]*小写[）)]*[：:\s]*[¥￥]?\s*(\d+\.\d{2})/
  // Pattern 4: Chinese uppercase amount only (convert to number)
  const amountPattern4 = /([壹贰叁肆伍陆柒捌玖拾佰仟万亿]+)圆整/

  let amount = 0
  let amountMatch = null

  // Try pattern 1 first (Chinese + number - most reliable for regular invoices)
  amountMatch = text.match(amountPattern1)
  if (amountMatch) {
    amount = parseFloat(amountMatch[1])
    console.log(`[REGULAR-INVOICE-PARSER] Amount match found (Chinese + number): ${amountMatch[0]} -> ${amount}`)
  } else {
    // Try pattern 3 (价税合计 with 小写)
    amountMatch = text.match(amountPattern3)
    if (amountMatch) {
      amount = parseFloat(amountMatch[1])
      console.log(`[REGULAR-INVOICE-PARSER] Amount match found (价税合计小写): ${amountMatch[0]} -> ${amount}`)
    } else {
      // Try pattern 4 (Chinese uppercase amount only)
      amountMatch = text.match(amountPattern4)
      if (amountMatch) {
        amount = convertChineseNumberToArabic(amountMatch[1])
        console.log(`[REGULAR-INVOICE-PARSER] Amount match found (Chinese uppercase): ${amountMatch[0]} -> ${amount}`)
      } else {
        // Try pattern 2 (find all amounts >= 100 and pick the largest)
        const allAmounts = Array.from(text.matchAll(amountPattern2))
        if (allAmounts.length > 0) {
          // Filter amounts >= 100 (to avoid small tax amounts) and pick the largest
          const validAmounts = allAmounts
            .map(m => parseFloat(m[1]))
            .filter(a => a >= 100)
            .sort((a, b) => b - a) // Sort descending

          if (validAmounts.length > 0) {
            // Pick the largest amount (usually the total)
            amount = validAmounts[0]
            console.log(`[REGULAR-INVOICE-PARSER] Amount match found (largest amount >= 100): ${amount}`)
          }
        }
      }
    }
  }

  if (amount <= 0) {
    console.log(`[REGULAR-INVOICE-PARSER] ✗ Regular invoice parser failed: no valid amount found`)
    return null
  }

  // Extract date
  const datePattern1 = /开票日期[：:\s]*(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?/
  const datePattern2 = /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日号]?/

  let date = new Date()
  let dateMatch = text.match(datePattern1)

  if (dateMatch) {
    console.log(`[REGULAR-INVOICE-PARSER] Date match found (开票日期): ${dateMatch[0]}`)
    const year = parseInt(dateMatch[1])
    const month = parseInt(dateMatch[2])
    const day = parseInt(dateMatch[3])
    // Use UTC to avoid timezone issues
    date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  } else {
    dateMatch = text.match(datePattern2)
    if (dateMatch) {
      console.log(`[REGULAR-INVOICE-PARSER] Date match found (generic): ${dateMatch[0]}`)
      const year = parseInt(dateMatch[1])
      const month = parseInt(dateMatch[2])
      const day = parseInt(dateMatch[3])
      // Use UTC to avoid timezone issues
      date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
    } else {
      console.log(`[REGULAR-INVOICE-PARSER] Date match not found (using current date as fallback)`)
    }
  }

  // Extract buyer and seller info (optional, for description)
  const buyerPattern = /购买方[^销]*?([^\s\d]{2,20}(?:公司|企业|店|中心|部门|单位))/
  const sellerPattern = /销售方[^备]*?([^\s\d]{2,20}(?:公司|企业|店|中心|部门|单位|民宿))/

  const buyerMatch = text.match(buyerPattern)
  const sellerMatch = text.match(sellerPattern)

  let buyer = ''
  let seller = ''

  if (buyerMatch) {
    buyer = buyerMatch[1].trim()
    console.log(`[REGULAR-INVOICE-PARSER] Buyer found: ${buyer}`)
  }

  if (sellerMatch) {
    seller = sellerMatch[1].trim()
    console.log(`[REGULAR-INVOICE-PARSER] Seller found: ${seller}`)
  }

  // Determine category based on content keywords
  let category = '其他'
  if (text.includes('餐饮') || text.includes('食品') || text.includes('饮料')) {
    category = '餐饮'
    console.log(`[REGULAR-INVOICE-PARSER] Category determined: 餐饮 (found keywords: 餐饮/食品/饮料)`)
  } else if (text.includes('住宿') || text.includes('酒店') || text.includes('宾馆') || text.includes('民宿')) {
    category = '住宿'
    console.log(`[REGULAR-INVOICE-PARSER] Category determined: 住宿 (found keywords: 住宿/酒店/宾馆/民宿)`)
  } else if (text.includes('办公') || text.includes('文具') || text.includes('用品')) {
    category = '办公'
    console.log(`[REGULAR-INVOICE-PARSER] Category determined: 办公 (found keywords: 办公/文具/用品)`)
  } else if (text.includes('交通') || text.includes('停车') || text.includes('过路') || text.includes('汽油')) {
    category = '交通'
    console.log(`[REGULAR-INVOICE-PARSER] Category determined: 交通 (found keywords: 交通/停车/过路/汽油)`)
  } else {
    console.log(`[REGULAR-INVOICE-PARSER] Category defaulted to: 其他 (no specific category keywords found)`)
  }

  // Build description
  let description = '普通发票'

  if (invoiceNumberMatch) {
    const invoiceNo = invoiceNumberMatch[1]
    // Use last 4 digits for brevity
    description += ` ${invoiceNo.slice(-4)}`
  }

  if (seller) {
    // Add seller name (truncate if too long)
    const sellerShort = seller.length > 10 ? seller.substring(0, 10) + '...' : seller
    description += ` (${sellerShort})`
  }

  console.log(`[REGULAR-INVOICE-PARSER] ✓ Regular invoice recognized: amount=${amount}, date=${date.toISOString().split('T')[0]}, category="${category}", description="${description}"`)

  return {
    amount,
    date,
    description,
    category,
    rawText: text
  }
}

/**
 * Parse generic invoice information from text
 */
function parseGenericInvoice(text: string): InvoiceData | null {
  console.log('[GENERIC-PARSER] Attempting to parse as generic invoice')

  const amountPattern = /[¥￥]\s*(\d+\.?\d*)\s*元/
  const datePattern = /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日号]?/

  const amountMatch = text.match(amountPattern)
  const dateMatch = text.match(datePattern)

  if (!amountMatch) {
    console.log(`[GENERIC-PARSER] ✗ Generic invoice parser failed: no amount match found (pattern: [¥￥]\\s*(\\d+\\.?\\d*)\\s*元)`)
    return null
  }

  console.log(`[GENERIC-PARSER] Amount match found: ${amountMatch[0]}`)

  const amount = parseFloat(amountMatch[1])
  let date = new Date()

  if (dateMatch) {
    console.log(`[GENERIC-PARSER] Date match found: ${dateMatch[0]}`)
    const year = parseInt(dateMatch[1])
    const month = parseInt(dateMatch[2])
    const day = parseInt(dateMatch[3])
    // Use UTC to avoid timezone issues
    date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  } else {
    console.log(`[GENERIC-PARSER] Date match not found (using current date as fallback)`)
  }

  console.log(`[GENERIC-PARSER] ✓ Generic invoice recognized: amount=${amount}, date=${date.toISOString().split('T')[0]}, category="其他", description="发票"`)

  return {
    amount,
    date,
    description: '发票',
    category: '其他',
    rawText: text
  }
}

/**
 * Parse invoice data from PDF text
 */
export function parseInvoiceData(text: string): InvoiceData | null {
  console.log(`[INVOICE-PARSE] Starting invoice parsing with ${text.length} characters`)
  console.log(`[INVOICE-PARSE] Text preview (first 200 chars): ${text.substring(0, 200)}...`)

  // Try different parsers in order of specificity
  // Note: Regular invoice and VAT invoice should be checked first as they have more specific keywords
  const parsers = [
    { name: 'parseRegularInvoice', fn: parseRegularInvoice },
    { name: 'parseVATInvoice', fn: parseVATInvoice },
    { name: 'parseTrainTicket', fn: parseTrainTicket },
    { name: 'parseTaxiReceipt', fn: parseTaxiReceipt },
    { name: 'parseGenericInvoice', fn: parseGenericInvoice }
  ]

  for (const parser of parsers) {
    const result = parser.fn(text)
    if (result) {
      console.log(`[INVOICE-PARSE] ✓ Parser matched: ${parser.name}`)
      return result
    }
  }

  console.warn(`[INVOICE-PARSE] ⚠ All parsers failed to recognize invoice`)
  return null
}

/**
 * Parse invoice from PDF buffer
 */
export async function parseInvoicePDF(buffer: Buffer): Promise<InvoiceData | null> {
  console.log(`[PDF-PARSE] Parsing invoice PDF (buffer size: ${buffer.length} bytes)`)

  try {
    const text = await extractTextFromPDF(buffer)
    console.log(`[PDF-PARSE] Text extracted successfully (${text.length} characters)`)
    console.log(`[PDF-PARSE] Text: ${text}`)

    const result = parseInvoiceData(text)

    if (result) {
      console.log(`[PDF-PARSE] ✓ Invoice parsing successful`)
      console.log(`[PDF-PARSE] Result: amount=${result.amount}, date=${result.date.toISOString().split('T')[0]}, category="${result.category}", description="${result.description}"`)
    } else {
      console.warn(`[PDF-PARSE] ⚠ Invoice parsing returned null - no parser could recognize the invoice`)
    }

    return result
  } catch (error) {
    console.error('[PDF-PARSE] ✗ Invoice parsing error:', error)
    if (error instanceof Error) {
      console.error('[PDF-PARSE] Error stack:', error.stack)
    }
    return null
  }
}

/**
 * Parse invoice from OFD buffer
 */
export async function parseInvoiceOFD(buffer: Buffer): Promise<InvoiceData | null> {
  console.log(`[OFD-PARSE] Parsing invoice OFD (buffer size: ${buffer.length} bytes)`)

  try {
    const text = await extractTextFromOFD(buffer)
    console.log(`[OFD-PARSE] Text extracted successfully (${text.length} characters)`)
    console.log(`[OFD-PARSE] Text: ${text}`)

    // Reuse existing parseInvoiceData() function
    const result = parseInvoiceData(text)

    if (result) {
      console.log(`[OFD-PARSE] ✓ Invoice parsing successful`)
      console.log(`[OFD-PARSE] Result: amount=${result.amount}, date=${result.date.toISOString().split('T')[0]}, category="${result.category}", description="${result.description}"`)
    } else {
      console.warn(`[OFD-PARSE] ⚠ Invoice parsing returned null - no parser could recognize the invoice`)
    }

    return result
  } catch (error) {
    console.error('[OFD-PARSE] ✗ Invoice parsing error:', error)
    if (error instanceof Error) {
      console.error('[OFD-PARSE] Error stack:', error.stack)
    }
    return null
  }
}

/**
 * Unified invoice parser - auto-detects file type and routes to appropriate parser
 */
export async function parseInvoice(buffer: Buffer, fileType: string): Promise<InvoiceData | null> {
  console.log(`[INVOICE-PARSE] Parsing invoice of type: ${fileType}`)

  if (fileType === 'application/pdf' || fileType.includes('pdf')) {
    return parseInvoicePDF(buffer)
  } else if (fileType === 'application/ofd' || fileType === 'application/x-ofd' || fileType.includes('ofd')) {
    return parseInvoiceOFD(buffer)
  } else {
    console.error(`[INVOICE-PARSE] Unsupported file type: ${fileType}`)
    return null
  }
}
