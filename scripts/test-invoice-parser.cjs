// Test script to verify invoice parsing using invoiceParser.ts
const fs = require('fs')
const path = require('path')
const { getDocument } = require('pdfjs-dist/legacy/build/pdf');

// Dynamic import for ES modules
async function testInvoiceParser() {
  // Get file path from command line arguments
  const filePath = process.argv[2] || 'C:\\Users\\ventu\\Desktop\\团建4822.ofd'

  try {
    const loadingTask = getDocument(filePath);
    loadingTask.promise.then(pdfDoc => {
        console.log(`PDF has ${pdfDoc.numPages} pages.`);
        pdfDoc.getPage(1).then(page => {
            page.getTextContent().then(textContent => {
                console.log(textContent.items.map(str => str.str).join(''));
            });
        });
    }).catch(err => {
        console.error('Error:', err);
    });

  } catch (error) {
    console.error('\n=== ERROR ===')
    console.error('Error:', error.message)
    console.error('\nStack trace:')
    console.error(error.stack)
  }
}

// Run the test
testInvoiceParser().catch(err => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
