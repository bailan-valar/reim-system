import { fetchInvoiceEmails } from '~/server/utils/emailService'

export default defineEventHandler(async (event) => {
  try {
    console.log('[EMAIL-API] Starting to fetch invoice emails from 163 mailbox...')

    const emails = await fetchInvoiceEmails()

    console.log(`[EMAIL-API] Successfully processed ${emails.length} invoice emails`)

    return {
      success: true,
      data: {
        processedCount: emails.length,
        emails: emails.map(email => ({
          subject: email.subject,
          from: email.from,
          date: email.date,
          attachmentCount: email.attachments.length
        }))
      },
      message: `成功处理 ${emails.length} 封发票邮件`
    }
  } catch (error: any) {
    console.error('[EMAIL-API] Error fetching invoice emails:', error)

    throw createError({
      statusCode: 500,
      message: error.message || '获取邮件失败'
    })
  }
})
