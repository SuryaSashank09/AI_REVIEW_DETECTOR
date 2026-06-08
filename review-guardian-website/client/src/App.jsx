import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import AnalyzeProduct from './pages/AnalyzeProduct'
import SuspiciousReviews from './pages/SuspiciousReviews'
import TrueRating from './pages/TrueRating'
import History from './pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="analyze"    element={<AnalyzeProduct />} />
          <Route path="suspicious" element={<SuspiciousReviews />} />
          <Route path="rating"     element={<TrueRating />} />
          <Route path="history"    element={<History />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
