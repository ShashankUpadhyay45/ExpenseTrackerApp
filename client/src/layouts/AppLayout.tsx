import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Target, Receipt, Goal, Wallet, BarChart3, Sparkles, FileText, Settings, LogOut, Search, Bell } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ArrowLeftRight, label: 'Transactions', path: '/transactions' },
  { icon: Target, label: 'Budgets', path: '/budgets' },
  { icon: Receipt, label: 'Bills', path: '/bills' },
  { icon: Goal, label: 'Goals', path: '/goals' },
  { icon: Wallet, label: 'Accounts', path: '/accounts' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Sparkles, label: 'AI Insights', path: '/ai-insights' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function AppLayout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-[260px] flex-col border-r border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-950 md:flex">
        <div className="flex h-16 items-center px-6 border-b border-surface-200 dark:border-surface-800">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-500">SpendSage</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                      : 'text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t border-surface-200 p-4 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold dark:bg-primary-900 dark:text-primary-300">
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">
                {(user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email) || 'User'}
              </p>
              <p className="truncate text-xs text-surface-500">{user?.email || 'user@example.com'}</p>
            </div>
            <button onClick={logout} className="p-2 text-surface-500 hover:text-danger-500 transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-surface-200 bg-white px-6 dark:border-surface-800 dark:bg-surface-950">
          <div className="flex items-center md:hidden">
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-500">SpendSage</h1>
          </div>
          <div className="hidden md:flex flex-1 items-center px-4">
            <button className="flex w-full max-w-md items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-4 py-2 text-sm text-surface-500 dark:border-surface-800 dark:bg-surface-900">
              <Search className="h-4 w-4" />
              <span>Search transactions... (Cmd+K)</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-surface-500 hover:text-surface-900 dark:hover:text-surface-50">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-danger-500"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-surface-200 bg-white/80 backdrop-blur-md dark:border-surface-800 dark:bg-surface-950/80 md:hidden pb-safe">
        {[navItems[0], navItems[1], { icon: null, label: 'Add', path: '/add' }, navItems[2], { icon: Settings, label: 'More', path: '/menu' }].map((item, i) => (
          item.icon ? (
            <NavLink
              key={i}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center space-y-1 w-16',
                  isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ) : (
            <div key={i} className="flex flex-col items-center justify-center -mt-8">
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600">
                <span className="text-2xl leading-none">+</span>
              </button>
            </div>
          )
        ))}
      </nav>
    </div>
  );
}
