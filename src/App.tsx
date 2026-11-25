import { Navigate, Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { BrandHeader } from './components/BrandHeader'
import { CatalogPage } from './pages/CatalogPage'
import { FeedPage } from './pages/FeedPage'
import { MaterialDetailsPage } from './pages/MaterialDetailsPage'
import { AddMaterialPage } from './pages/AddMaterialPage'
import { LoginPage } from './pages/LoginPage'
import { useAppSelector } from './store/hooks'

function BusyOverlay() {
  const pending = useAppSelector((state) => state.materials.pending)
  const authLoading = useAppSelector((state) => state.auth.status === 'loading')
  if (!pending && !authLoading) return null
  return <div className="busy-overlay" role="status" aria-live="polite"><span className="spinner-border" /><strong>AJAX-запрос…</strong></div>
}

export default function App() {
  return (
    <div className="app-shell">
      <BrandHeader />
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/add" element={<AddMaterialPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/materials/:materialId" element={<MaterialDetailsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <BusyOverlay />
    </div>
  )
}
