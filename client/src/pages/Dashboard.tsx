import { useQuery } from 'react-query'
import { 
  Code2, 
  FolderOpen, 
  Tags, 
  Clock,
  TrendingUp,
  Plus
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface Stats {
  total_snippets: number
  by_language: { language: string; count: number }[]
  recent_snippets: { id: string; title: string; language: string; created_at: string }[]
  top_tags: { name: string; color: string; count: number }[]
  collection_sizes: { name: string; color: string; count: number }[]
  timeline: { date: string; count: number }[]
}

async function fetchStats(): Promise<Stats> {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3512';
  const response = await fetch(`${API_URL}/api/stats`)
  if (!response.ok) throw new Error('Failed to fetch stats')
  return response.json()
}

export function Dashboard() {
  const { data: stats, isLoading } = useQuery('stats', fetchStats)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text)]">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 h-24 animate-pulse bg-[var(--surface-alt)]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text)]">Dashboard</h1>
        <Link
          to="/snippets"
          className="btn btn-primary cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Snippet
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Code2}
          label="Total Snippets"
          value={stats?.total_snippets || 0}
          color="cyan"
        />
        <StatCard
          icon={FolderOpen}
          label="Collections"
          value={stats?.collection_sizes.length || 0}
          color="green"
        />
        <StatCard
          icon={Tags}
          label="Tags"
          value={stats?.top_tags.length || 0}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Languages"
          value={stats?.by_language.length || 0}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Snippets */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--text-muted)]" />
            Recent Snippets
          </h2>
          <div className="space-y-3">
            {stats?.recent_snippets?.slice(0, 5).map((snippet) => (
              <Link
                key={snippet.id}
                to={`/snippets?id=${snippet.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-medium text-[var(--text)]">{snippet.title}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {new Date(snippet.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded bg-[var(--surface-alt)] text-[var(--text-muted)]">
                  {snippet.language}
                </span>
              </Link>
            )) || <p className="text-[var(--text-muted)]">No snippets yet</p>}
          </div>
        </div>

        {/* Top Tags */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
            <Tags className="w-5 h-5 text-[var(--text-muted)]" />
            Top Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {stats?.top_tags?.map((tag) => (
              <Link
                key={tag.name}
                to={`/snippets?tag=${tag.name}`}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-opacity hover:opacity-80 cursor-pointer"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name} ({tag.count})
              </Link>
            )) || <p className="text-[var(--text-muted)]">No tags yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number
  color: 'cyan' | 'green' | 'purple' | 'orange'
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colors = {
    cyan: 'bg-[var(--primary)]/10 text-[var(--primary)]',
    green: 'bg-[var(--success)]/10 text-[var(--success)]',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-[var(--warning)]/10 text-[var(--warning)]',
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-[var(--text-muted)]">{label}</p>
          <p className="text-2xl font-bold text-[var(--text)]">{value}</p>
        </div>
      </div>
    </div>
  )
}
