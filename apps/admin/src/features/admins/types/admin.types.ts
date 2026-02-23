/** 管理者に紐づくロール情報 */
export interface AdminRole {
  id: string;
  name: string;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  roleId: string;
  role: AdminRole;
  timezone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminListResponse {
  admins: Admin[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateAdminResponse {
  admin: Omit<Admin, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  };
}

export interface UpdateAdminResponse {
  admin: Omit<Admin, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  };
}
