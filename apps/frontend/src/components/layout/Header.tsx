'use client';

import { Menu, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useUiStore } from '@/store/ui-store';
import { useSocketContext } from '@/providers/socket-provider';
import Badge from '@/components/ui/Badge';

export function Header({ title, description }: { title: string; description?: string }) {
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const { status } = useSocketContext();

  const statusConfig = {
    connected: { icon: Wifi, label: 'Live', variant: 'success' as const },
    connecting: { icon: Loader2, label: 'Connecting', variant: 'warning' as const },
    disconnected: { icon: WifiOff, label: 'Offline', variant: 'default' as const },
  };

  const { icon: StatusIcon, label, variant } = statusConfig[status];

  return (
    <header className="sticky top-0 z-30 border-b border-surface-border bg-surface/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-8">
        <button
          className="rounded-lg p-2 text-gray-400 hover:bg-surface-overlay hover:text-white lg:hidden"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-white lg:text-xl">{title}</h1>
          {description && <p className="text-sm text-gray-400">{description}</p>}
        </div>
        <Badge variant={variant} className="gap-1.5">
          <StatusIcon
            className={`h-3 w-3 ${status === 'connecting' ? 'animate-spin' : ''}`}
            aria-hidden
          />
          {label}
        </Badge>
      </div>
    </header>
  );
}
