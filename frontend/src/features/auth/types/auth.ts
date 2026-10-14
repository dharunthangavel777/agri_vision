export interface User {
  id: string; // Firebase Auth UID
  identifier: string; // Email address
  email?: string;
  type: 'email' | 'google' | 'mobile';
  role?: 'farmer' | 'admin';
  name?: string;
  photoURL?: string;
  location?: string;
  farmType?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  isNewUser: boolean;
}
