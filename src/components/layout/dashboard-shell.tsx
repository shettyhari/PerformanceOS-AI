'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getRoleLabel } from '@/lib/auth/rbac';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
] as const;

export function DashboardSidebar() {
  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold tracking-tight">PerformanceOS</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-accent-foreground',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function DashboardHeader() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const initials = session.user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U';

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-sm">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium">{session.user.name}</p>
          <p className="text-xs text-muted-foreground">
            {getRoleLabel(session.user.role)}
          </p>
        </div>
        <div className="group relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ''} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="invisible absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border bg-popover p-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
