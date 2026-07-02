import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'
import { Toaster } from 'react-hot-toast'

import { SocketProvider } from './context/SocketContext.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <Provider store={store}>
    <SocketProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
          success: {
            iconTheme: { primary: '#ff4d2d', secondary: '#fff' },
            style: { background: '#fff', color: '#1a1a1a', border: '1px solid #ffe0d6' },
          },
          error: {
            style: { background: '#fff', color: '#1a1a1a', border: '1px solid #ffd6d6' },
          },
        }}
      />
      <App />
    </SocketProvider>
  </Provider>
  </BrowserRouter>
 
)

