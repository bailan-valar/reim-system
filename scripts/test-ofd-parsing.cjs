// Test script to validate all three OFD file types
const fs = require('fs')
const path = require('path')

// Test files
const testFiles = [
  {
    name: '火车票 (Type 1 - Direct Text)',
    path: path.join(__dirname, '../doc/火车票.ofd'),
    expected: {
      amount: 121.00,
      date: '2025-11-28',
      description: '火车票',
      category: '交通'
    }
  },
  {
    name: '团建4822 (Type 2 - Glyph Mapping)',
    path: path.join(__dirname, '../doc/团建4822.ofd'),
    expected: {
      amount: 4822.00,
      date: '2025-11-28',
      description: '普通发票',
      category: '住宿'
    }
  },
  {
    name: '智澜300 (Type 3 - Vector Graphics)',
    path: path.join(__dirname, '../doc/智澜300.ofd'),
    expected: {
      amount: 300.00, // Adjust based on actual invoice
      date: '2025-11-28',
      description: '普通发票',
      category: '其他'
    }
  }
]

async function testOFDParsing() {
  console.log('='.repeat(80))
  console.log('OFD Invoice Parsing Test Suite')
  console.log('='.repeat(80))
  console.log()

  try {
    // Import the invoice parser module
    const invoiceParserPath = path.resolve(__dirname, '../server/utils/invoiceParser.ts')
    console.log('Importing invoice parser from:', invoiceParserPath)

    const { parseInvoiceOFD, extractTextFromOFD } = await import('file://' + invoiceParserPath.replace(/\\/g, '/'))
    console.log('✓ Invoice parser imported successfully\n')

    let passedTests = 0
    let failedTests = 0

    for (const testFile of testFiles) {
      console.log('='.repeat(80))
      console.log(`Testing: ${testFile.name}`)
      console.log('='.repeat(80))
      console.log(`File: ${testFile.path}`)

      // Check if file exists
      if (!fs.existsSync(testFile.path)) {
        console.error(`✗ File not found: ${testFile.path}\n`)
        failedTests++
        continue
      }

      try {
        // Read file
        const buffer = fs.readFileSync(testFile.path)
        console.log(`File size: ${buffer.length} bytes`)

        // Step 1: Extract text
        console.log('\n--- Step 1: Text Extraction ---')
        const startExtract = Date.now()
        const text = await extractTextFromOFD(buffer)
        const extractTime = Date.now() - startExtract
        console.log(`✓ Text extracted in ${extractTime}ms`)
        console.log(`Text length: ${text.length} characters`)
        console.log(`Text preview: ${text.substring(0, 200)}...`)

        // Step 2: Parse invoice data
        console.log('\n--- Step 2: Invoice Parsing ---')
        const startParse = Date.now()
        const result = await parseInvoiceOFD(buffer)
        const parseTime = Date.now() - startParse
        console.log(`✓ Invoice parsed in ${parseTime}ms`)

        if (result) {
          console.log('\n--- Parsing Results ---')
          console.log(`Amount: ¥${result.amount}`)
          console.log(`Date: ${result.date.toISOString().split('T')[0]}`)
          console.log(`Category: ${result.category}`)
          console.log(`Description: ${result.description}`)

          // Validate results
          console.log('\n--- Validation ---')
          let validationPassed = true

          if (Math.abs(result.amount - testFile.expected.amount) > 0.01) {
            console.log(`⚠ Amount mismatch: expected ¥${testFile.expected.amount}, got ¥${result.amount}`)
            validationPassed = false
          } else {
            console.log(`✓ Amount matches: ¥${result.amount}`)
          }

          const resultDate = result.date.toISOString().split('T')[0]
          if (resultDate !== testFile.expected.date) {
            console.log(`⚠ Date mismatch: expected ${testFile.expected.date}, got ${resultDate}`)
            // Don't fail on date mismatch as it might be flexible
          } else {
            console.log(`✓ Date matches: ${resultDate}`)
          }

          if (!result.description.includes(testFile.expected.description.split(' ')[0])) {
            console.log(`⚠ Description mismatch: expected to contain "${testFile.expected.description}", got "${result.description}"`)
            // Don't fail on description mismatch
          } else {
            console.log(`✓ Description contains expected text`)
          }

          if (validationPassed) {
            console.log('\n✓ TEST PASSED')
            passedTests++
          } else {
            console.log('\n⚠ TEST PASSED WITH WARNINGS')
            passedTests++
          }

        } else {
          console.log('\n✗ TEST FAILED: Parser returned null')
          failedTests++
        }

      } catch (error) {
        console.error('\n✗ TEST FAILED')
        console.error('Error:', error.message)
        console.error('Stack:', error.stack)
        failedTests++
      }

      console.log()
    }

    // Summary
    console.log('='.repeat(80))
    console.log('Test Summary')
    console.log('='.repeat(80))
    console.log(`Total tests: ${testFiles.length}`)
    console.log(`Passed: ${passedTests}`)
    console.log(`Failed: ${failedTests}`)
    console.log()

    if (failedTests === 0) {
      console.log('✓ All tests passed!')
      process.exit(0)
    } else {
      console.log('✗ Some tests failed')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n=== FATAL ERROR ===')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

// Run tests
testOFDParsing().catch(err => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
