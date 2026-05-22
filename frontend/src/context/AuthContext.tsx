import { getMe } from "@/api";
import { getToken, setToken, getUserId, setUserId, removeToken, removeUserId, setRefreshToken } from "@/lib/cookies";
import type { AuthResponse, UserResponse } from "@/types";
import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";

type AuthState = {
    user: AuthResponse | null;
    userDetails: UserResponse | null;
    isAuthentic: boolean;
    isLoading: boolean;
}

type AuthAction = 
    | { type: "LOGIN"; payload: AuthResponse }
    | { type: "LOGOUT" }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_USER_DETAILS"; payload: UserResponse }

function AuthReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case "LOGIN":
            return {
                ...state,
                user: action.payload,
                isAuthentic: true,
                isLoading: false
            };
        
        case "LOGOUT":
            return {
                ...state, 
                user: null,
                userDetails: null,
                isAuthentic: false,
                isLoading: false
            };
        
        case "SET_LOADING":
            return {
                ...state, 
                isLoading: action.payload
            };
        
        case "SET_USER_DETAILS":
            return {
                ...state,
                userDetails: action.payload
            };
    }
}


interface AuthContextType {
    user: AuthResponse | null;
    userDetails: UserResponse | null;
    isAuthentic: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    fetchUserDetails: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userDetails: null,
    isAuthentic: false,
    isLoading: false,
    login: async () => {},
    logout: () => {},
    fetchUserDetails: async () => {}
});


interface AuthProviderProps {
    children: ReactNode
}


export function AuthProvider({children}: AuthProviderProps) {
    
    // não entendi isso
    const [state, dispatch] = useReducer(AuthReducer, {
        user: null,    
        userDetails: null,      
        isAuthentic: false, 
        isLoading: false   
    });

    const login = async (email: string, password: string) => {
        // dispatch: mostra que está carregando
        dispatch({ type: "SET_LOADING", payload: true })
        
        try {
            const response = await fetch("http://localhost:8000/auth/login", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/x-www-form-urlencoded" 
                },
                body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
            })
            
            if (!response.ok) {
                throw new Error("Login falhou. Verifique seu email e senha.")
            }
            
            const data: AuthResponse = await response.json()
            setToken(data.accessToken)
            setRefreshToken(data.refreshToken)
            setUserId(data.id)
            dispatch({ type: "LOGIN", payload: data })
            
        } catch (error) {
            dispatch({ type: "SET_LOADING", payload: false })
            throw error
        }
    }

    const logout = () => {
        removeToken()    // remove token do cookie
        removeUserId()   // remove id do cookie
        dispatch({ type: "LOGOUT" }) // atualiza estado
    }

    const fetchUserDetails = async () => {
        try {
            const data = await getMe()  // Isso já envia o token automaticamente!
            dispatch({ type: "SET_USER_DETAILS", payload: data })
        } catch (error) {
            // Erro silencioso se não tiver token ou token inválido
            console.log("Erro ao buscar dados do usuário:", error)
        }
    }

    useEffect(() => {
        const token = getToken()
        if (token && !state.user) {
            dispatch({
                type: "LOGIN",
                payload: { 
                    id: parseInt(getUserId() || "0"), 
                    email: "", 
                    accessToken: token, 
                    refreshToken: "",
                    tokenType: "Bearer"
                }
            })
            
            fetchUserDetails()
        }
    }, []) // [] = só executa uma vez quando o app carrega
    
    return (
        <AuthContext.Provider
            value={{
                user: state.user,
                userDetails: state.userDetails,
                isAuthentic: !!state.user,
                isLoading: state.isLoading,
                login,
                logout,
                fetchUserDetails
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext);
    
    if (context === undefined) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    
    return context;
}