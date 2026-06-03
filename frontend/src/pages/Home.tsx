import { Outlet } from "@tanstack/react-router"
import Header from "@/components/header"

function Home() {
  return (
    <div className="min-h-screen bg-casacor-cream flex flex-col">
      <Header/>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default Home
