export interface Role {
  _id: string;
  name: string;
  description?: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  isEmailVerified: boolean;
  isRestricted: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  data: T;
}
