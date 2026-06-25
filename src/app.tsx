import { PropsWithChildren } from 'react'
import { AuthProvider } from './components/AuthStore'
import './app.scss'

function App({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>
}

export default App
