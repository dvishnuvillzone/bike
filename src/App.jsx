import { useEffect, useState } from 'react'
import { StoreProvider } from './data/store'
import { useStore } from './data/storeContext'
import { PAGE_META } from './data/navigation'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { Toast } from './components/UI'
import Dashboard from './pages/Dashboard'
import CustomerLogin from './pages/customer login pages/CustomerLogin'
import Track from './pages/customer login pages/Track'
import Bikes from './pages/Bikes'
import Categories from './pages/Categories'
import NewJob from './pages/NewJob'
import Assignment from './pages/Assignment'
import Technicians from './pages/Technicians'
import Pending from './pages/Pending'
import Completed from './pages/Completed'
import Billing from './pages/Billing'
import DailyReport from './pages/DailyReport'
import Reports from './pages/Reports'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import './App.css'

const PAGES = {
  dashboard: Dashboard,
  'customer-login': CustomerLogin,
  'customer/login': CustomerLogin,
  track: Track,
  bikes: Bikes,
  categories: Categories,
  'new-job': NewJob,
  assignment: Assignment,
  technicians: Technicians,
  pending: Pending,
  completed: Completed,
  billing: Billing,
  'daily-report': DailyReport,
  reports: Reports,
  'admin/login': AdminLogin,
  admin: AdminDashboard,
}

const readPage = () => {
  const path = window.location.pathname.replace(/^\/+/, '')
  const hash = window.location.hash.replace(/^#\/?/, '')
  const raw = path || hash
  return PAGES[raw] ? raw : 'dashboard'
}

function Shell() {
  const { toast, clearToast } = useStore()
  const [page, setPage] = useState(readPage)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onChange = () => setPage(readPage())
    window.addEventListener('popstate', onChange)
    window.addEventListener('hashchange', onChange)
    return () => {
      window.removeEventListener('popstate', onChange)
      window.removeEventListener('hashchange', onChange)
    }
  }, [])

  const meta = PAGE_META[page] || PAGE_META.dashboard
  const Page = PAGES[page] || Dashboard

  const noChrome = page === 'customer/login' || page === 'admin/login' || page === 'track'

  useEffect(() => {
    document.title = `${meta.title} · Villzone Bike Service`
  }, [meta.title])

  const navigate = (id) => {
    if (!PAGES[id]) return
    setPage(id)
    setMenuOpen(false)
    window.history.pushState({}, '', `/${id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      {!noChrome && (
        <Sidebar
          page={page}
          onNavigate={navigate}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      )}
      <div className={noChrome ? 'app-main no-sidebar' : 'app-main'}>
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenu={() => setMenuOpen(true)}
          onNavigate={navigate}
          hideMenu={page === 'customer/login' || page === 'admin/login' || page === 'track'}
          hideExtras={page === 'customer/login' || page === 'track'}
        />
        <main className="page">
          <Page key={page} navigate={navigate} />
        </main>
      </div>
      <Toast toast={toast} onClose={clearToast} />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
