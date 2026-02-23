import { useState, useEffect, useRef } from 'react'
import { Moon, Sun, Monitor, Download, Upload, FileJson, Check, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3512';

export function Settings() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`${API_URL}/api/export`)
      if (!response.ok) throw new Error('Export failed')
      
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `snippets-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (file: File) => {
    setIsImporting(true)
    setImportStatus(null)
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (!data.snippets || !Array.isArray(data.snippets)) {
        throw new Error('Invalid format: missing snippets array')
      }
      
      const response = await fetch(`${API_URL}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }
      
      const result = await response.json()
      setImportStatus({ 
        type: 'success', 
        message: `Successfully imported ${result.imported || data.snippets.length} snippets` 
      })
    } catch (err) {
      setImportStatus({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Import failed' 
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/json') {
      handleImport(file)
    } else {
      setImportStatus({ type: 'error', message: 'Please upload a JSON file' })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImport(file)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {/* Appearance */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Appearance
        </h2>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme
          </label>
          <div className="flex gap-3">
            <ThemeButton
              active={theme === 'light'}
              onClick={() => setTheme('light')}
              icon={Sun}
              label="Light"
            />
            <ThemeButton
              active={theme === 'dark'}
              onClick={() => setTheme('dark')}
              icon={Moon}
              label="Dark"
            />
            <ThemeButton
              active={theme === 'system'}
              onClick={() => setTheme('system')}
              icon={Monitor}
              label="System"
            />
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Management
        </h2>

        <div className="space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Export Snippets</p>
                <p className="text-sm text-gray-500">Download all snippets as JSON</p>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>

          {/* Import */}
          <div 
            className={`p-4 border-2 border-dashed rounded-lg ${
              dragActive 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Import Snippets</p>
                  <p className="text-sm text-gray-500">Upload JSON file or drag and drop</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {isImporting ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>

          {/* Import Status */}
          {importStatus && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              importStatus.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              {importStatus.type === 'success' 
                ? <Check className="w-4 h-4" /> 
                : <AlertCircle className="w-4 h-4" />
              }
              <span className="text-sm">{importStatus.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          About
        </h2>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>SnippetBox</strong> - Code Snippet Manager</p>
          <p>Version: 1.0.0</p>
          <p>A modern, self-hosted code snippet manager for developers.</p>
        </div>
      </div>
    </div>
  )
}

interface ThemeButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}

function ThemeButton({ active, onClick, icon: Icon, label }: ThemeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
        active
          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}
