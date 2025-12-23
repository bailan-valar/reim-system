import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // 获取所有报销单，包含公司信息
    const reimbursements = await prisma.reimbursement.findMany({
      include: {
        company: true
      }
    })

    // 获取所有公司
    const companies = await prisma.company.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    // 定义所有可能的状态
    const statuses = ['待整理', '待打印单据', '待审批', '待打款', '已完成']

    // 初始化统计数据结构
    const stats: {
      [companyName: string]: {
        [status: string]: number
      }
    } = {}

    // 为每个公司初始化所有状态的金额为 0
    companies.forEach(company => {
      stats[company.name] = {}
      statuses.forEach(status => {
        stats[company.name][status] = 0
      })
    })

    // 添加"未分配公司"分类
    stats['未分配公司'] = {}
    statuses.forEach(status => {
      stats['未分配公司'][status] = 0
    })

    // 统计每个公司每个状态的报销单金额
    reimbursements.forEach(reimbursement => {
      const companyName = reimbursement.company?.name || '未分配公司'
      const status = reimbursement.status

      if (!stats[companyName]) {
        stats[companyName] = {}
        statuses.forEach(s => {
          stats[companyName][s] = 0
        })
      }

      if (!stats[companyName][status]) {
        stats[companyName][status] = 0
      }

      stats[companyName][status] += reimbursement.totalAmount
    })

    // 过滤掉所有状态金额都为 0 的公司
    const filteredStats: typeof stats = {}
    Object.keys(stats).forEach(companyName => {
      const hasData = Object.values(stats[companyName]).some(amount => amount > 0)
      if (hasData) {
        filteredStats[companyName] = stats[companyName]
      }
    })

    return {
      data: {
        stats: filteredStats,
        statuses,
        companies: Object.keys(filteredStats)
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || '获取统计数据失败'
    })
  }
})
