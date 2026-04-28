import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { getToken, removeToken } from "../lib/cookies"
import { useAuth } from "@/context/AuthContext"

function Home() {
  const navigate = useNavigate()
  const token = getToken()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    removeToken()
    navigate({ to: "/" })
  }

  useEffect(() => {
    if (!token) {
      navigate({ to: "/", replace: true })
    }
  }, [token, navigate])

  if (!token) {
    return null
  }

  return (
    <>
      <p className='bg-yellow-300 text-[50px]'> Home </p>

      <button
      onClick={handleLogout}
      className="bg-red-600 text-[20px] text-white p-5 rounded-lg">
        Logout
      </button>
    </>
  )
}

export default Home
