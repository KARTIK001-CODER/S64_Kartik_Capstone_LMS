import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App'
import { AppContextProvider } from './context/AppContext'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </BrowserRouter>,
)
