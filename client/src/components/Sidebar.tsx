import { 
  LayoutDashboard, 
  Code2, 
  FolderOpen, 
  Tags, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/snippets', icon: Code2, label: 'Snippets' },
  { path: '/collections', icon: FolderOpen, label: 'Collections' },
  { path: '/tags', icon: Tags, label: 'Tags' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-50',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {isOpen && (
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-primary-600" />
            <span className="font-bold text-lg text-gray-900 dark:text-white">SnippetBox</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {isOpen ? (
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      <nav className="p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span className="font-medium">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
