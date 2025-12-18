import Imap from 'imap'
import { simpleParser, ParsedMail, Attachment } from 'mailparser'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import prisma from './prisma'
import { recognizeInvoiceBuffer } from './tencentOcr'

export interface EmailConfig {
  user: string
  password: string
  host: string
  port: number
  tls: boolean
}

export interface InvoiceAttachment {
  filename: string
  content: Buffer
  contentType: string
}

export interface ProcessedEmail {
  subject: string
  from: string
  date: Date
  attachments: InvoiceAttachment[]
}

/**
 * 163邮箱IMAP配置
 */
export function get163EmailConfig(): EmailConfig {
  const user = process.env.EMAIL_163_USER
  const password = process.env.EMAIL_163_PASSWORD

  if (!user || !password) {
    throw new Error('请配置163邮箱账号和密码环境变量: EMAIL_163_USER, EMAIL_163_PASSWORD')
  }

  return {
    user,
    password,
    host: 'imap.163.com',
    port: 993,
    tls: true
  }
}

/**
 * 检查邮件主题是否包含发票或报销关键词
 */
export function isInvoiceEmail(subject: string): boolean {
  const keywords = ['发票', '报销', '凭证', '电子发票']
  return keywords.some(keyword => subject.includes(keyword))
}

/**
 * 检查附件是否为发票文件
 */
export function isInvoiceAttachment(filename: string, contentType: string): boolean {
  const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.ofd']
  const validContentTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/ofd'
  ]

  const hasValidExtension = validExtensions.some(ext =>
    filename.toLowerCase().endsWith(ext)
  )
  const hasValidContentType = validContentTypes.some(type =>
    contentType.toLowerCase().includes(type)
  )

  return hasValidExtension || hasValidContentType
}

/**
 * 保存附件到发票盒子目录
 */
export async function saveAttachmentToInvoiceBox(
  attachment: InvoiceAttachment
): Promise<{ fileName: string; filePath: string }> {
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'invoice-box')

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = attachment.filename.split('.').pop()
  const fileName = `${timestamp}-${randomString}-email.${extension}`
  const fullPath = join(uploadDir, fileName)

  await writeFile(fullPath, attachment.content)

  return {
    fileName,
    filePath: `/uploads/invoice-box/${fileName}`
  }
}

/**
 * 处理邮件附件并保存到发票盒子
 */
export async function processInvoiceAttachment(
  attachment: InvoiceAttachment,
  emailSubject: string,
  emailDate: Date
): Promise<void> {
  try {
    console.log(`[EMAIL-SERVICE] Processing attachment: ${attachment.filename}`)

    // 保存附件
    const { fileName, filePath } = await saveAttachmentToInvoiceBox(attachment)
    console.log(`[EMAIL-SERVICE] Attachment saved: ${filePath}`)

    // 使用OCR识别发票信息
    let ocrData = null
    try {
      console.log('[EMAIL-SERVICE] Attempting OCR recognition...')
      ocrData = await recognizeInvoiceBuffer(attachment.content, attachment.contentType)

      if (ocrData.success) {
        console.log('[EMAIL-SERVICE] OCR recognition successful')
      } else {
        console.log('[EMAIL-SERVICE] OCR recognition failed:', ocrData.error)
      }
    } catch (error) {
      console.error('[EMAIL-SERVICE] OCR recognition error:', error)
    }

    // 准备发票数据
    const invoiceNumber = ocrData?.invoiceNumber || `EMAIL-${Date.now()}`
    const totalAmount = ocrData?.totalAmount || 0
    const invoiceDate = ocrData?.invoiceDate ? new Date(ocrData.invoiceDate) : emailDate
    const invoiceType = ocrData?.invoiceType || '其他'
    const taxRate = ocrData?.taxRate || null
    const taxAmount = ocrData?.taxAmount || null

    // 检查发票号码是否已存在
    const existingInvoice = await prisma.invoiceBox.findUnique({
      where: { invoiceNumber }
    })

    if (existingInvoice) {
      console.log(`[EMAIL-SERVICE] Invoice already exists: ${invoiceNumber}`)
      return
    }

    // 创建发票盒子记录
    const invoice = await prisma.invoiceBox.create({
      data: {
        invoiceNumber,
        invoiceType,
        totalAmount,
        taxRate,
        taxAmount,
        invoiceDate,
        fileName,
        filePath,
        status: '未使用'
      }
    })

    console.log(`[EMAIL-SERVICE] Invoice created successfully: ${invoice.id}`)
  } catch (error) {
    console.error('[EMAIL-SERVICE] Error processing attachment:', error)
    throw error
  }
}

/**
 * 解析邮件并提取发票附件
 */
export async function parseEmail(emailBuffer: Buffer): Promise<ProcessedEmail> {
  const parsed: ParsedMail = await simpleParser(emailBuffer)

  const invoiceAttachments: InvoiceAttachment[] = []

  if (parsed.attachments && parsed.attachments.length > 0) {
    for (const attachment of parsed.attachments) {
      const filename = attachment.filename || 'unknown'
      const contentType = attachment.contentType || 'application/octet-stream'

      if (isInvoiceAttachment(filename, contentType)) {
        invoiceAttachments.push({
          filename,
          content: attachment.content,
          contentType
        })
      }
    }
  }

  return {
    subject: parsed.subject || '',
    from: parsed.from?.text || '',
    date: parsed.date || new Date(),
    attachments: invoiceAttachments
  }
}

/**
 * 连接到163邮箱并获取未读的发票邮件
 */
export async function fetchInvoiceEmails(): Promise<ProcessedEmail[]> {
  return new Promise((resolve, reject) => {
    const config = get163EmailConfig()
    const imap = new Imap(config)
    const processedEmails: ProcessedEmail[] = []

    imap.once('ready', () => {
      console.log('[EMAIL-SERVICE] IMAP connection ready')

      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('[EMAIL-SERVICE] Error opening inbox:', err)
          reject(err)
          return
        }

        console.log(`[EMAIL-SERVICE] Inbox opened, total messages: ${box.messages.total}`)

        // 搜索未读邮件
        imap.search(['UNSEEN'], (err, results) => {
          if (err) {
            console.error('[EMAIL-SERVICE] Error searching emails:', err)
            reject(err)
            return
          }

          if (!results || results.length === 0) {
            console.log('[EMAIL-SERVICE] No unread emails found')
            imap.end()
            resolve([])
            return
          }

          console.log(`[EMAIL-SERVICE] Found ${results.length} unread emails`)

          const fetch = imap.fetch(results, { bodies: '' })
          let processedCount = 0

          fetch.on('message', (msg, seqno) => {
            console.log(`[EMAIL-SERVICE] Processing message #${seqno}`)

            msg.on('body', (stream) => {
              let buffer = Buffer.alloc(0)

              stream.on('data', (chunk) => {
                buffer = Buffer.concat([buffer, chunk])
              })

              stream.once('end', async () => {
                try {
                  const email = await parseEmail(buffer)

                  // 检查是否为发票邮件
                  if (isInvoiceEmail(email.subject)) {
                    console.log(`[EMAIL-SERVICE] Invoice email found: ${email.subject}`)
                    processedEmails.push(email)

                    // 处理附件
                    for (const attachment of email.attachments) {
                      await processInvoiceAttachment(attachment, email.subject, email.date)
                    }
                  }

                  processedCount++
                  if (processedCount === results.length) {
                    imap.end()
                  }
                } catch (error) {
                  console.error('[EMAIL-SERVICE] Error parsing email:', error)
                  processedCount++
                  if (processedCount === results.length) {
                    imap.end()
                  }
                }
              })
            })
          })

          fetch.once('error', (err) => {
            console.error('[EMAIL-SERVICE] Fetch error:', err)
            reject(err)
          })

          fetch.once('end', () => {
            console.log('[EMAIL-SERVICE] Fetch completed')
          })
        })
      })
    })

    imap.once('error', (err) => {
      console.error('[EMAIL-SERVICE] IMAP error:', err)
      reject(err)
    })

    imap.once('end', () => {
      console.log('[EMAIL-SERVICE] IMAP connection ended')
      resolve(processedEmails)
    })

    imap.connect()
  })
}

/**
 * 标记邮件为已读
 */
export async function markEmailsAsRead(uids: number[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const config = get163EmailConfig()
    const imap = new Imap(config)

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err) => {
        if (err) {
          reject(err)
          return
        }

        imap.addFlags(uids, ['\\Seen'], (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
          imap.end()
        })
      })
    })

    imap.once('error', reject)
    imap.connect()
  })
}
