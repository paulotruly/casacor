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
            await login(email, password)
            navigate({ to: "/home" })

        } catch (err) {
            setError("Credenciais inválidas!")
        }
    }

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-1/2 bg-casacor-cream-secondary relative overflow-hidden items-center justify-center p-16">
                <div className="max-w-lg">
                    <div className="mb-12">
                        <div className="w-12 h-[1px] bg-casacor-gold mb-8" />
                        <img
                            src="/logo.png"
                            alt="SONORA"
                            className="h-10 w-auto mb-6"
                        />
                        <p className="text-heading-sm text-casacor-gray-dark font-light leading-relaxed">
                            Análise inteligente de ambientes, iluminação adaptativa e experiência sensorial.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <p className="text-body-lg text-casacor-gray-medium font-light leading-relaxed">
                            O SONORA conecta classificação de áudio em tempo real com controle de iluminação inteligente, criando ambientes que reagem ao som — uma experiência imersiva desenvolvida para o projeto Morhar + CASACOR.
                        </p>

                        <div className="divider-line" />

                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <p className="text-caption text-casacor-gold uppercase tracking-widest mb-2">Análise</p>
                                <p className="text-body-sm text-casacor-gray-dark font-light">Classificação de áudio por IA em tempo real</p>
                            </div>
                            <div>
                                <p className="text-caption text-casacor-gold uppercase tracking-widest mb-2">Iluminação</p>
                                <p className="text-body-sm text-casacor-gray-dark font-light">Controle adaptativo de lâmpadas inteligentes</p>
                            </div>
                            <div>
                                <p className="text-caption text-casacor-gold uppercase tracking-widest mb-2">Experiência</p>
                                <p className="text-body-sm text-casacor-gray-dark font-light">Ambientes que respondem à sonoridade do espaço</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16">
                        <svg className="w-full h-8 opacity-20" viewBox="0 0 400 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 16 L50 2 L100 16 L150 4 L200 16 L250 8 L300 16 L350 12 L400 16" stroke="#4A4A4A" strokeWidth="0.5" />
                            <line x1="0" y1="16" x2="400" y2="16" stroke="#4A4A4A" strokeWidth="0.25" strokeDasharray="2 4" />
                            <circle cx="50" cy="2" r="1.5" fill="#B79B6C" opacity="0.6" />
                            <circle cx="150" cy="4" r="1.5" fill="#B79B6C" opacity="0.6" />
                            <circle cx="250" cy="8" r="1.5" fill="#B79B6C" opacity="0.6" />
                            <circle cx="350" cy="12" r="1.5" fill="#B79B6C" opacity="0.6" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-casacor-cream">
                <div className="w-full max-w-sm">
                    <div className="mb-12">
                        <div className="w-8 h-[1px] bg-casacor-gold mb-6" />
                        <h2 className="text-heading-md text-casacor-black font-light">
                            Acessar
                        </h2>
                        <p className="text-body-sm text-casacor-gray-medium mt-2">
                            Entre com suas credenciais para continuar
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="block text-caption text-casacor-gray-dark uppercase tracking-widest mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                className="input-line"
                            />
                        </div>

                        <div>
                            <label className="block text-caption text-casacor-gray-dark uppercase tracking-widest mb-2">
                                Senha
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="input-line"
                            />
                        </div>

                        {error && (
                            <p className="text-body-sm text-red-500">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                        >
                            {isLoading ? "Entrando..." : "Entrar"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default LoginForm
