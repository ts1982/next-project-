export interface Store {
  id: number;
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  publishedAt: string | null;
  unpublishedAt: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreListItem {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  publishedAt: string | null;
  unpublishedAt: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface CreateStoreInput {
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  publishedAt?: string | null;
  unpublishedAt?: string | null;
  timezone?: string;
}

export interface UpdateStoreInput {
  name?: string;
  description?: string | null;
  address?: string;
  phone?: string | null;
  email?: string | null;
  publishedAt?: string | null;
  unpublishedAt?: string | null;
  timezone?: string;
}
