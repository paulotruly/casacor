export interface AuthResponse {
  id: number;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: number;
  email: string;
}