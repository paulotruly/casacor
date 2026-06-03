import { Link, useNavigate, useLocation } from "@tanstack/react-router"
import { removeToken } from "../lib/cookies"
import { useAuth } from "@/context/AuthContext"

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    removeToken()
    navigate({ to: "/" })
  }

  const isActive = (path: string) => {
    if (path === "/home" && location.pathname === "/home") return true
    if (path === "/home/config" && location.pathname === "/home/config") return true
    return false
  }

  return (
    <header className="border-b border-casacor-line bg-casacor-cream/80 backdrop-blur-sm">
      <div className="max-w-editorial mx-auto px-8 lg:px-16 h-16 flex items-center justify-between">
        <Link to="/home" className="flex items-center no-underline group">
          <img
            src="/logo.png"
            alt="SONORA"
            className="h-8 w-auto transition-opacity duration-200 group-hover:opacity-70"
          />
        </Link>

        <nav className="flex items-center gap-8">
          <Link
            to="/home"
            className={`text-caption uppercase tracking-widest no-underline transition-all duration-200 ${
              isActive("/home")
                ? "text-casacor-black"
                : "text-casacor-gray-medium hover:text-casacor-black hover:scale-[1.05]"
            }`}
          >
            Gravação
          </Link>
          <Link
            to="/home/config"
            className={`text-caption uppercase tracking-widest no-underline transition-all duration-200 ${
              isActive("/home/config")
                ? "text-casacor-black"
                : "text-casacor-gray-medium hover:text-casacor-black hover:scale-[1.05]"
            }`}
          >
            Configurações
          </Link>
          <div className="w-px h-4 bg-casacor-line" />
          <button
            onClick={handleLogout}
            className="text-caption text-casacor-gray-medium uppercase tracking-widest bg-transparent border-none cursor-pointer transition-all duration-200 hover:text-casacor-black hover:scale-[1.02]"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
