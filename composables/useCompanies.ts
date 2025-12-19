import type { Company, CreateCompanyInput, UpdateCompanyInput, CompanyWithDetails } from '~/types/company'

export const useCompanies = () => {
  const fetchCompanies = async (): Promise<(Company & { _count?: { reimbursements: number } })[]> => {
    const { data } = await $fetch('/api/companies', {
      method: 'GET'
    })
    return data
  }

  const fetchCompany = async (id: string): Promise<CompanyWithDetails> => {
    const { data } = await $fetch(`/api/companies/${id}`, {
      method: 'GET'
    })
    return data
  }

  const createCompany = async (input: CreateCompanyInput): Promise<Company> => {
    const { data } = await $fetch('/api/companies', {
      method: 'POST',
      body: input
    })
    return data
  }

  const updateCompany = async (id: string, input: UpdateCompanyInput): Promise<Company> => {
    const { data } = await $fetch(`/api/companies/${id}`, {
      method: 'PUT',
      body: input
    })
    return data
  }

  const deleteCompany = async (id: string): Promise<void> => {
    await $fetch(`/api/companies/${id}`, {
      method: 'DELETE'
    })
  }

  return {
    fetchCompanies,
    fetchCompany,
    createCompany,
    updateCompany,
    deleteCompany
  }
}
