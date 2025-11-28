// Test script to read and parse the sample OFD file
const fs = require('fs')
const JSZip = require('jszip')
const { parseString } = require('xml2js')

async function testOFDFile() {
  const filePath = 'C:\\Users\\ventu\\Desktop\\团建4822.ofd'

  try {
    console.log('Reading OFD file:', filePath)
    const buffer = fs.readFileSync(filePath)
    console.log('File size:', buffer.length, 'bytes')

    // Load as ZIP
    const zip = await JSZip.loadAsync(buffer)
    console.log('\n=== OFD Archive Contents ===')
    const fileList = Object.keys(zip.files)
    console.log('Total files:', fileList.length)
    fileList.forEach(name => console.log('  -', name))

    // Extract text from XML files
    const xmlFiles = fileList.filter(name =>
      name.endsWith('.xml') && !name.startsWith('__MACOSX')
    )

    console.log('\n=== Processing XML Files ===')
    console.log('XML files found:', xmlFiles.length)

    let allText = ''

    // Read each XML file
    for (const xmlFile of xmlFiles) {
      console.log(`\n--- Processing: ${xmlFile} ---`)
      const xmlContent = await zip.files[xmlFile].async('string')

      // Show first 500 chars of XML
      console.log('XML Preview:', xmlContent.substring(0, 500))

      // Try to extract text
      await new Promise((resolve) => {
        parseString(xmlContent, (err, result) => {
          if (err) {
            console.log('Parse error:', err.message)
            resolve()
            return
          }

          const text = extractTextFromXML(result)
          if (text.trim()) {
            console.log(`\nExtracted text (${text.length} chars):`)
            console.log(text)
            allText += text + ' '
          } else {
            console.log('No text extracted from this file')
          }
          resolve()
        })
      })
    }

    console.log('\n=== FULL EXTRACTED TEXT ===')
    console.log(allText.trim())
    console.log('\n=== TEXT LENGTH ===')
    console.log(allText.trim().length, 'characters')

    // Try to identify invoice fields
    console.log('\n=== INVOICE FIELD DETECTION ===')
    identifyInvoiceFields(allText)

  } catch (error) {
    console.error('Error:', error.message)
    console.error(error.stack)
  }
}

function extractTextFromXML(obj) {
  let text = ''

  if (typeof obj === 'string') {
    return obj
  }

  if (typeof obj === 'object' && obj !== null) {
    if (obj.TextCode) {
      text += extractTextFromXML(obj.TextCode) + ' '
    }
    if (obj.TextObject) {
      text += extractTextFromXML(obj.TextObject) + ' '
    }
    if (obj._) {
      text += obj._ + ' '
    }

    for (const key in obj) {
      if (key !== '_' && key !== '$') {
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

function identifyInvoiceFields(text) {
  // Test various patterns
  const patterns = {
    '发票类型': [/普通发票/, /通用机打发票/, /通用定额发票/],
    '发票代码': [/发票代码[：:\s]*(\d{10,12})/, /代码[：:\s]*(\d{10,12})/],
    '发票号码': [/发票号码[：:\s]*(\d{8})/, /No[：:.\s]*(\d{8})/, /号码[：:\s]*(\d{8})/],
    '金额': [
      /价税合计[：:￥¥\s]*(\d+\.?\d*)/,
      /合计金额[：:￥¥\s]*(\d+\.?\d*)/,
      /小写[：:\s]*[￥¥]?\s*(\d+\.\d{2})/,
      /[¥￥]\s*(\d+\.\d{2})\s*元/
    ],
    '日期': [
      /开票日期[：:\s]*(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?/,
      /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日号]?/
    ],
    '购买方': [/购买方[名称]*[：:\s]*([^\n\r]{2,50})/],
    '销售方': [/销售方[名称]*[：:\s]*([^\n\r]{2,50})/]
  }

  for (const [field, regexList] of Object.entries(patterns)) {
    console.log(`\n${field}:`)
    let found = false
    for (const regex of regexList) {
      const match = text.match(regex)
      if (match) {
        console.log(`  ✓ Pattern matched: ${regex}`)
        console.log(`  ✓ Result: ${match[0]}`)
        if (match[1]) console.log(`  ✓ Captured: ${match[1]}`)
        found = true
        break
      }
    }
    if (!found) {
      console.log(`  ✗ No match found`)
    }
  }
}

testOFDFile()
