import axios from "axios";
import { getToken, getRefreshToken, removeToken, removeRefreshToken, removeUserId } from "@/lib/cookies";
import { toast } from "sonner";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

// roda antes de toda requisição que fizer com a api, pega o token e injeta no header 'Authorization'
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// roda antes de toda resposta da requisição, seja sucesso ou erro
// em suma, serve pra renovar o token se HOUVER o refresh token ainda
api.interceptors.response.use(
  (response) => response, // se deu certo, só passa pra frente
  async (error) => { // se deu erro...
    const originalRequest = error.config; // guarda a requisição que foi feita

    if (error.response?.status === 401 && !originalRequest._retried) { // se foi erro de token expirado/inválido e nao tentou reenviar
      originalRequest._retried = true; // marca que tentou
      const refreshToken = getRefreshToken(); // busca o refresh token
      if (originalRequest.url === "/auth/login") { // se for a rota de login, não tenta renovar
        removeToken();
        removeRefreshToken();
        removeUserId();
        return Promise.reject(error);
      }
      if (!refreshToken) { // se não tiver, limpa tudo
        removeToken();
        removeRefreshToken();
        removeUserId();
        window.location.href = "/"; // envia pro login
        return Promise.reject(error);
      }
      try { // tenta renovar o token de acesso
        const res = await axios.post("http://localhost:8000/auth/refresh", {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = res.data; // pega o novo token de acesso
        const { setToken, setRefreshToken } = await import("@/lib/cookies"); // importa funções do cookies
        setToken(access_token); // seta o token
        if (newRefreshToken) setRefreshToken(newRefreshToken); // se tiver um refreshtoken, seta ele também
        originalRequest.headers.Authorization = `Bearer ${access_token}`; // atualiza a header
        return api(originalRequest); // reenvia a mesma requisição que falhou, mas agora com o token válido
      } catch {
        removeToken(); // se o refresh falhou, só limpa tudo e manda pro login
        removeRefreshToken();
        removeUserId();
        toast.error("Sessão expirada, faça login novamente");
        window.location.href = "/";
        return Promise.reject(error);
      }
    }
    if (error.response?.status === 403) {
      toast.error("Você não tem permissão para essa ação");
    }
    return Promise.reject(error);
  }
);

export default api;