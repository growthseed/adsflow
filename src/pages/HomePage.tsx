// DEPRECATED: Este arquivo não é mais usado
// O MVP agora usa LandingPage.tsx e DashboardPage.tsx
// Este arquivo será removido em breve
import { Navigate } from 'react-router-dom'

export default function HomePage() {
  return <Navigate to="/" replace />
}
