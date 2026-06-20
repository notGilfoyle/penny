import { NavLink, Outlet } from 'react-router-dom'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

// ── Icon paths (Heroicons outline style) ──────────────────────────────────────

const ICON_HOME       = 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
const ICON_TXNS       = 'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4'
const ICON_DEBTS      = 'M3 10h18M7 15h1m4 0h1m-7-8h12a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z'
const ICON_RECURRING  = 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
const ICON_CATEGORIES = 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
const ICON_REPORTS    = 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'

const navItems = [
  { to: '/',             label: 'Dashboard',   mobileLabel: 'Home',  end: true,  icon: ICON_HOME },
  { to: '/transactions', label: 'Transactions', mobileLabel: 'Txns',             icon: ICON_TXNS },
  { to: '/debts',        label: 'Debts',        mobileLabel: 'Debts',            icon: ICON_DEBTS },
  { to: '/recurring',   label: 'Recurring',    mobileLabel: 'Rules',            icon: ICON_RECURRING },
  { to: '/categories',  label: 'Categories',   mobileLabel: 'Tags',             icon: ICON_CATEGORIES },
  { to: '/reports',     label: 'Reports',      mobileLabel: 'Stats',            icon: ICON_REPORTS },
]

export function Layout() {
  const { canInstall, install, dismiss } = useInstallPrompt()

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 bg-slate-900 flex-col">
        <div className="px-5 py-6 border-b border-slate-800">
          <span className="text-lg font-semibold text-white tracking-tight">Penny</span>
          <p className="text-xs text-slate-400 mt-0.5">Personal Finance</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-slate-800 space-y-2">
          {canInstall && (
            <button
              onClick={() => void install()}
              className="w-full text-left text-xs text-slate-400 hover:text-white transition-colors py-1"
            >
              ↓ Install app
            </button>
          )}
          <p className="text-xs text-slate-500">₹ INR · v0.1</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0 flex flex-col">
        {/* Install banner — mobile only */}
        {canInstall && (
          <div className="md:hidden flex items-center justify-between px-4 py-2 bg-slate-900 text-white text-xs">
            <span>Add Penny to your home screen</span>
            <div className="flex items-center gap-3">
              <button onClick={() => void install()} className="font-semibold text-emerald-400">
                Install
              </button>
              <button onClick={dismiss} className="text-slate-400">✕</button>
            </div>
          </div>
        )}
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map(({ to, mobileLabel, end, icon: IconPath }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-slate-900' : 'text-slate-400'
              }`
            }
          >
            <NavIcon path={IconPath} />
            {mobileLabel}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function NavIcon({ path }: { path: string }) {
  return (
    <svg
      width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  )
}
