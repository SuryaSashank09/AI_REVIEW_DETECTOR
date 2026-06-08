import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { AnalysisProvider } from '../../context/AnalysisContext'

export default function Layout() {
  return (
    <AnalysisProvider>
      <div style={{ display:'flex', minHeight:'100vh' }}>
        <Sidebar />
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <Header />
          <main style={{ flex:1, overflowY:'auto', padding:22, background:'var(--bg)' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </AnalysisProvider>
  )
}
