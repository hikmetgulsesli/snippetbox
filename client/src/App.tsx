import { useState, useEffect, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Snippets } from './pages/Snippets'
import { Collections } from './pages/Collections'
import { Tags } from './pages/Tags'
import { Settings } from './pages/Settings'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider, useToast } from './contexts/ToastContext'
import { useKeyboardShortcuts, APP_SHORTCUTS } from './hooks/useKeyboardShortcuts'
import { Menu, X } from 'lucide-react'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { showToast } = useToast()

  // Handle keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...APP_SHORTCUTS.NEW_SNIPPET,
      handler: () => {
        window.location.href = '/snippets?new=true'
      }
    },
    {
      ...APP_SHORTCUTS.SEARCH,
      handler: () => {
        setSearchOpen(true)
      }
    },
    {
      ...APP_SHORTCUTS.SAVE,
      handler: () => {
        // Trigger save in forms - this is handled by the form itself
        showToast('Saving...', 'info')
      }
    }
  ])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [])

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth < 768) {
      setMobileMenuOpen(!mobileMenuOpen)
    } else {
      setSidebarOpen(!sidebarOpen)
    }
  }, [mobileMenuOpen, sidebarOpen])

  return (
    <div className="flex h-screen bg-[var(--surface)]">
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-elevated)] transition-colors"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="w-5 h-5 text-[var(--text)]" />
        ) : (
          <Menu className="w-5 h-5 text-[var(--text)]" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <Sidebar 
        isOpen={window.innerWidth >= 768 ? sidebarOpen : mobileMenuOpen} 
        onToggle={toggleSidebar}
        isMobile={window.innerWidth < 768}
      />
      
      <main className={`flex-1 overflow-auto transition-all duration-300 ${window.innerWidth >= 768 ? (sidebarOpen ? 'ml-64' : 'ml-16') : (mobileMenuOpen ? 'ml-64' : 'ml-0')}`}>
        <div className="p-6 pt-16 md:pt-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/snippets" element={<Snippets searchOpen={searchOpen} onSearchClose={() => setSearchOpen(false)} />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
