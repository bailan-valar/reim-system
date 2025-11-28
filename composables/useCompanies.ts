import type { Company, CreateCompanyInput } from '~/types/company'

export const useCompanies = () => {
  const fetchCompanies = async (): Promise<Company[]> => {
    const { data } = await $fetch('/api/companies', {
      method: 'GET'
    })
    return data
  }

  const fetchCompany = async (id: string): Promise<Company> => {
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

  return {
    fetchCompanies,
    fetchCompany,
    createCompany
  }
}
