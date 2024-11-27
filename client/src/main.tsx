// import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (import.meta.env.VITE_DEBUG === 'true') {
  // Enable debug logs for all socket.io-client instances
  localStorage.debug = 'socket.io-client:socket';
}


createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <App/>
  // </StrictMode>,
)
