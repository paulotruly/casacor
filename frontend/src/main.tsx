import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import router from './router.ts'
import { RouterProvider } from '@tanstack/react-router'
import { AuthProvider } from './context/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router}/>
    </AuthProvider>
  </StrictMode>,
)
