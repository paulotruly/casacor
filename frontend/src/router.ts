import { createRouter, createRootRoute, createRoute} from '@tanstack/react-router'
import Home from './components/Home'
import Login from './components/Login'

const rootRoute = createRootRoute()

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Login,
})

const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/home',
    component: Home,
})

const routeTree = rootRoute.addChildren([
    loginRoute,    
    homeRoute
])

const router = createRouter({routeTree})

export default router