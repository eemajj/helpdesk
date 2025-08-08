export interface User {
  id?: string;
  username: string;
  fullName: string;
  email: string;
  position?: string;
  role: 'user' | 'support' | 'admin'; // Changed to lowercase to match backend enum
  isActive: boolean;
  createdAt?: string;
  lastLogin?: string;
  password?: string; // Only for creation, not stored
}