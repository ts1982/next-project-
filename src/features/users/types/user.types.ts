/** ユーザーに紐づくロール情報 */
export interface UserRole {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  roleId: string;
  role: UserRole;
  timezone: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateUserResponse {
  user: Omit<User, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  };
}

export interface UpdateUserResponse {
  user: Omit<User, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  };
}
