import { Link, useNavigate } from "@tanstack/react-router"
import { getToken, removeToken } from "../lib/cookies"
import { useAuth } from "@/context/AuthContext"

function Header() {
  const navigate = useNavigate()
  const token = getToken()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    removeToken()
    navigate({ to: "/" })
  }

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        backgroundColor: "#111",
        color: "#fff",
      }}
    >
      <div style={{ fontWeight: "bold" }}>
        meu app
      </div>

      <nav style={{ display: "flex", gap: "16px" }}>
        <Link
          to="/home"
          style={{ color: "#fff", textDecoration: "none" }}
        >
          home
        </Link>
        <Link
          to="/home/config"
          style={{ color: "#fff", textDecoration: "none" }}
        >
          config
        </Link>
      </nav>

      {token && (
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "red",
            color: "#fff",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          logout
        </button>
      )}
    </header>
  )
}

export default Header