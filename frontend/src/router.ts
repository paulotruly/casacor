import { createRouter, createRootRoute, createRoute, redirect} from '@tanstack/react-router'
import Login from './components/Login'
import Config from './components/Config'
import Interface from './components/Interface'
import { getToken } from './lib/cookies'
import Home from './pages/Home'

const rootRoute = createRootRoute()

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Login,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  beforeLoad: () => {
    const token = getToken()
    if (!token) {
      throw redirect({ to: "/" })
    }
  },
  component: Home,
})

const interfaceRoute = createRoute({
    getParentRoute: () => homeRoute,
    path: '/',
    component: Interface,
})

const configRoute = createRoute({
    getParentRoute: () => homeRoute,
    path: 'config',
    component: Config,
})

const routeTree = rootRoute.addChildren([
    loginRoute,
    homeRoute.addChildren([
        interfaceRoute,
        configRoute
    ])
])

const router = createRouter({routeTree})

export default router