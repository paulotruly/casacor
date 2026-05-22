import api from "@/lib/api";
import type { RegisterInput, RegisterResponse, LoginInput, AuthResponse, UserResponse, ClassifyAudioInput, ClassifyAudioResponse, SoundClass, CreateSoundClassInput, UpdateSoundClassInput, UpdateSoundClassResponse, DeleteSoundClassResponse, LampStatusResponse, LampPowerInput, LampPowerResponse, LampColorInput, LampColorResponse, ApiInfoResponse, HealthResponse } from "@/types";

// autenticação

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>("/auth/register", input);
  return response.data;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const params = new URLSearchParams();
  params.append("username", input.username);
  params.append("password", input.password);

  // a API de login do backend espera os dados no formato x-www-form-urlencoded
  // então a gente tem que converter o JSON pra esse formato antes de enviar
  const response = await api.post<AuthResponse>( "/auth/login", params,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response.data;
}

// usuário

export async function getMe(): Promise<UserResponse> {
  const response = await api.get<UserResponse>("/users/me");
  return response.data;
}

// classificação de áudio

// essa função recebe o áudio como Blob, envia pra API como FormData e recebe a classificação de volta
export async function classifyAudio(input: ClassifyAudioInput): Promise<ClassifyAudioResponse> {
  const formData = new FormData();
  formData.append("audio", input.audio, "audio.wav");
  
  const response = await api.post<ClassifyAudioResponse>("/classify", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

// classes de som

export async function getClasses(): Promise<SoundClass[]> { // visualiza as classes de som do usuário
  const response = await api.get<SoundClass[]>("/config/user/classes");
  return response.data;
}

export async function getAllClasses(): Promise<SoundClass[]> { // visualiza todas as classes de som disponíveis, inclusive as inativas, para o usuário escolher quais ativar
  const response = await api.get<SoundClass[]>("/ai/classes/all");
  return response.data;
}

export async function createClass(input: CreateSoundClassInput): Promise<SoundClass> { // cria uma nova classe de som personalizada pro usuário
  const response = await api.post<SoundClass>("/config/user/classes", input);
  return response.data;
}

export async function updateClass( // atualiza as configurações de uma classe de som específica do usuário, como cor ou ativação
  className: string,
  input: UpdateSoundClassInput
): Promise<UpdateSoundClassResponse> {
  const response = await api.put<UpdateSoundClassResponse>(
    `/config/user/classes/${className}`,
    input
  );
  return response.data;
}

export async function deleteClass(className: string): Promise<DeleteSoundClassResponse> { // deleta uma classe de som personalizada do usuário
  const response = await api.delete<DeleteSoundClassResponse>(
    `/config/user/classes/${className}`
  );
  return response.data;
}

// lâmpada

export async function getLampStatus(): Promise<LampStatusResponse> { // consulta o status atual da lâmpada, como se está ligada, cor e brilho
  const response = await api.get<LampStatusResponse>("/lamp/status");
  return response.data;
}

export async function setLampPower(input: LampPowerInput): Promise<LampPowerResponse> { // liga ou desliga a lâmpada
  const response = await api.post<LampPowerResponse>("/lamp/power", input);
  return response.data;
}

export async function setLampColor(input: LampColorInput): Promise<LampColorResponse> { // muda a cor e brilho da lâmpada
  const response = await api.post<LampColorResponse>("/lamp/color", input);
  return response.data;
}

// api

export async function getApiInfo(): Promise<ApiInfoResponse> { // consulta informações sobre a API, como versão, documentação e se a integração com a LIFX está configurada corretamente
  const response = await api.get<ApiInfoResponse>("/");
  return response.data;
}

export async function getHealth(): Promise<HealthResponse> { // consulta a saúde do sistema, verificando se os serviços essenciais estão operacionais
  const response = await api.get<HealthResponse>("/health");
  return response.data;
}