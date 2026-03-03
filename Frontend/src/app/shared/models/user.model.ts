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
}

export interface ApiListResponse<T> {
  data: T[];
}