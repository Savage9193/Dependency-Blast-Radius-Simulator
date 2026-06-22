'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  GitBranch,
  PlayCircle,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/ui-store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/services', label: 'Services', icon: Server },
  { href: '/dependencies', label: 'Dependencies', icon: GitBranch },
  { href: '/simulations', label: 'Simulations', icon: PlayCircle },
  { href: '/history', label: 'History', icon: History },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const mobileOpen = useUiStore((s) => s.mobileSidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);

  const content = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-surface-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand">
          <Zap className="h-5 w-5 text-white" aria-hidden />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">DBRS</p>
            <p className="truncate text-xs text-gray-500">Blast Radius</p>
          </div>
        )}
        <button
          className="ml-auto hidden rounded-lg p-1.5 text-gray-400 hover:bg-surface-overlay hover:text-white lg:block"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button
          className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-surface-overlay hover:text-white lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand/15 text-brand-hover'
                  : 'text-gray-400 hover:bg-surface-overlay hover:text-white',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-surface-border bg-surface transition-all lg:static lg:translate-x-0',
          collapsed ? 'w-[72px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {content}
      </aside>
    </>
  );
}
