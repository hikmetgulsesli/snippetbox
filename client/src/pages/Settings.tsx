import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'

export function Settings() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

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
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
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
