import api from "@/lib/api";

export async function saveLifxToken(token: string) {
  try {
    const response = await api.post('/user/lifx-token', {
      token: token
    })
    return response.data
  } catch (error: any) {
    const message = error.response?.data?.detail || 'Erro ao salvar token'
    throw new Error(message)
  }
}

export async function getLifxTokenStatus() {
  const response = await api.get('/user/lifx-token/status')
  return response.data
}