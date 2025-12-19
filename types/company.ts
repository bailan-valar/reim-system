export interface Company {
  id: string
  name: string
  logoUrl?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CreateCompanyInput {
  name: string
  logoUrl?: string
}

export interface UpdateCompanyInput {
  name?: string
  logoUrl?: string | null
}

export interface CompanyListQuery {
  sortBy?: 'name' | 'createdAt'
  order?: 'asc' | 'desc'
}

export interface CompanyWithDetails extends Company {
  _count: {
    reimbursements: number
  }
  reimbursements?: Array<{
    id: string
    title: string
    totalAmount: number
    status: string
    createdAt: Date | string
  }>
  totalAmount?: number
}
