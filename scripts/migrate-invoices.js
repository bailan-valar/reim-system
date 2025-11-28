// 数据迁移脚本：将 ExpenseItem 中的单发票数据迁移到 Invoice 表
const { PrismaClient } = require('@prisma/client')

async function migrateInvoices() {
  const prisma = new PrismaClient()

  try {
    console.log('开始迁移发票数据...')

    // 1. 查询所有有发票的费用项目
    const expenseItems = await prisma.$queryRaw`
      SELECT id, invoiceFileName, invoiceFilePath, amount, date, description, hasInvoice
      FROM expense_items
      WHERE hasInvoice = 1 AND invoiceFileName IS NOT NULL AND invoiceFilePath IS NOT NULL
    `

    console.log(`找到 ${expenseItems.length} 个需要迁移的费用项目`)

    if (expenseItems.length === 0) {
      console.log('没有需要迁移的数据')
      return
    }

    // 2. 为每个费用项目创建对应的 Invoice 记录
    for (const item of expenseItems) {
      console.log(`迁移费用项目 ${item.id} 的发票...`)

      // 检查 invoices 表是否存在
      try {
        await prisma.$executeRaw`
          INSERT INTO invoices (id, expenseItemId, fileName, filePath, amount, date, description, uploadedAt, createdAt, updatedAt)
          VALUES (
            lower(hex(randomblob(16))),
            ${item.id},
            ${item.invoiceFileName},
            ${item.invoiceFilePath},
            ${item.amount},
            ${item.date},
            ${item.description || ''},
            datetime('now'),
            datetime('now'),
            datetime('now')
          )
        `
        console.log(`✓ 成功迁移费用项目 ${item.id} 的发票`)
      } catch (error) {
        console.error(`✗ 迁移费用项目 ${item.id} 失败:`, error.message)
      }
    }

    console.log('发票数据迁移完成！')
  } catch (error) {
    console.error('迁移过程中出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateInvoices()
  .then(() => {
    console.log('迁移脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('迁移脚本执行失败:', error)
    process.exit(1)
  })
