import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { getToken } from "../lib/cookies"

function Home() {
  const navigate = useNavigate()
  const token = getToken()

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
    </>
  )
}

export default Home
