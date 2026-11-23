import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Mesmas fontes da Intranet: Geist (interface) e Geist Mono (números, datas).
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './index.css'
import App from './App.tsx'
import { TemaProvider } from './contexts/TemaContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TemaProvider>
        <App />
      </TemaProvider>
    </BrowserRouter>
  </StrictMode>,
)
