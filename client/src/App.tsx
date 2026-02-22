import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Snippets } from './pages/Snippets'
import { Collections } from './pages/Collections'
import { Tags } from './pages/Tags'
import { Settings } from './pages/Settings'
import { CodePlayground } from './pages/CodePlayground'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-[var(--surface)]">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/snippets" element={<Snippets />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/playground" element={<CodePlayground />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
