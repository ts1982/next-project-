export interface User {
  id: number;
  email: string;
  name: string;
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
