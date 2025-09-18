import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
// import { registerSW } from 'virtual:pwa-register'

// Registrar Service Worker para funcionalidad offline (temporalmente deshabilitado)
// const updateSW = registerSW({
//   onNeedRefresh() {
//     // Mostrar notificación al usuario de que hay una actualización disponible
//     if (confirm('Nueva versión disponible. ¿Desea actualizar?')) {
//       updateSW(true)
//     }
//   },
//   onOfflineReady() {
//     console.log('Aplicación lista para funcionar sin conexión')
//   },
// })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
