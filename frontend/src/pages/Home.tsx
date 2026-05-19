import { Outlet } from "@tanstack/react-router"
import Header from "@/components/header"

function Home() {
  return (
    <>
      <Header/>
      <Outlet />
    </>
  )
}

export default Home
