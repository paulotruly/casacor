import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { getToken } from "@/lib/cookies"


export function LoginForm() {
    const navigate = useNavigate()
    const { login, isLoading } = useAuth()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    
    useEffect(() => {
        const token = getToken()
        
        if (token) {
            navigate({ to: "/home", replace: true })
        }
    }, [navigate])
    
    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        setError("")
        
        try {
            // isso vai chamar a API /auth/login no backend
            await login(email, password)
            navigate({ to: "/home" })
            
        } catch (err) {
            setError("Credenciais inválidas!")
        }
    }
    
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "20px",
            backgroundColor: "#fafafa"
        }}>
            
            <h1 style={{ marginBottom: "24px", fontSize: "24px" }}>
                Login
            </h1>
            
            <form onSubmit={handleSubmit} style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                width: "100%",
                maxWidth: "300px"
            }}>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "14px", color: "#666" }}>
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        style={{
                            padding: "10px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            fontSize: "16px"
                        }}
                    />
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "14px", color: "#666" }}>
                        Senha
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        style={{
                            padding: "10px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            fontSize: "16px"
                        }}
                    />
                </div>
                
                {error && (
                    <p style={{ color: "red", fontSize: "14px" }}>
                        {error}
                    </p>
                )}
                
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        padding: "12px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#333",
                        color: "white",
                        fontSize: "16px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? 0.7 : 1
                    }}
                >
                    {isLoading ? "Entrando..." : "Entrar"}
                </button>
                
            </form>
            
        </div>
    )
}


export default LoginForm