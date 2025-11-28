export interface Company {
  id: string
  name: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CreateCompanyInput {
  name: string
}

export interface UpdateCompanyInput {
  name?: string
}

export interface CompanyListQuery {
  sortBy?: 'name' | 'createdAt'
  order?: 'asc' | 'desc'
}
