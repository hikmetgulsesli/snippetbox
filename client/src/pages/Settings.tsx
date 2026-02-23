import { useTheme } from '../contexts/ThemeContext'
import { Moon, Sun } from 'lucide-react'

export function Settings() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">Settings</h1>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
          Appearance
        </h2>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-[var(--text-muted)]">
            Theme
          </label>
          <div className="flex gap-3 flex-wrap">
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
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
          About
        </h2>
        <div className="space-y-2 text-sm text-[var(--text-muted)]">
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
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]
        ${
        active
          ? 'border-[var(--primary)] bg-[var(--primary-900)]/30 text-[var(--primary)]'
          : 'border-[var(--border)] hover:bg-[var(--surface-alt)] hover:border-[var(--border-subtle)] text-[var(--text-muted)]'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  )
}
