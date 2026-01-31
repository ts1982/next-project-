export interface Store {
  id: number
  name: string
  description: string | null
  address: string
  phone: string | null
  email: string | null
  createdAt: Date
  updatedAt: Date
}

export interface StoreListItem {
  id: number
  name: string
  address: string
  phone: string | null
  createdAt: Date
}

export interface CreateStoreInput {
  name: string
  description?: string
  address: string
  phone?: string
  email?: string
}

export interface UpdateStoreInput {
  name?: string
  description?: string | null
  address?: string
  phone?: string | null
  email?: string | null
}
