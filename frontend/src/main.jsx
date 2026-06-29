import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
// NEW: Socket.IO context + react-hot-toast
import { SocketProvider } from './context/SocketContext'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      {/* SocketProvider must be inside AuthProvider so it can read user token */}
      <SocketProvider>
        <ToastProvider>
          <App />
          {/* react-hot-toast container — renders socket notification toasts */}
          <Toaster position="bottom-right" reverseOrder={false} />
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
)
