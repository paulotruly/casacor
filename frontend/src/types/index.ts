// autenticação e autorização

export interface RegisterInput {
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  email: string;
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

// usuário

export interface UserResponse {
  id: number;
  email: string;
}

// clássificação de áudio

export interface ClassifyAudioInput {
  audio: Blob;
}

export type SecondaryClass = [string, number];

export interface ClassifyAudioResponse {
  detected_class: string;
  confidence: number;
  secondary_classes: SecondaryClass[];
  applied_color: string;
  color_hex: string;
}

// classes de som

export interface SoundClass {
  class_name: string;
  color_name: string;
  color_hex: string;
  is_active: boolean;
}

export interface CreateSoundClassInput {
  class_name: string;
  color_name: string;
  color_hex: string;
}

export interface UpdateSoundClassInput {
  color_name?: string;
  color_hex?: string;
  is_active?: boolean;
}

export interface UpdateSoundClassResponse {
  message: string;
  class_name: string;
}

export interface DeleteSoundClassResponse {
  message: string;
  class_name: string;
}

// lâmpada

export interface LampStatusResponse {
  power: string;
  color: string;
  brightness: number;
}

export interface LampPowerInput {
  power: boolean;
}

export interface LampPowerResponse {
  power: string;
}

export interface LampColorInput {
  color: string;
  brightness: number;
}

export interface LampColorResponse {
  color: string;
  brightness: number;
}

// api e saúde do sistema

export interface ApiInfoResponse {
  message: string;
  version: string;
  docs: string;
  lifx_configured: boolean;
}

export interface HealthResponse {
  status: string;
}

// mensagens genéricas de resposta da API, como erros ou confirmações de ações que não se encaixam nas outras categorias

export interface MessageResponse {
  message: string;
}