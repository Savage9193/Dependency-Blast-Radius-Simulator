'use client';

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { API_BASE } from '@/lib/api';

export default function SettingsPage() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

  return (
    <AppShell title="Settings" description="Application configuration and connection details">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader
            title="API Connection"
            description="Backend API endpoint configuration"
          />
          <div className="space-y-4">
            <Input
              label="API URL"
              value={API_BASE}
              readOnly
              hint="Set via NEXT_PUBLIC_API_URL environment variable"
            />
            <Input
              label="WebSocket URL"
              value={wsUrl}
              readOnly
              hint="Set via NEXT_PUBLIC_WS_URL environment variable"
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Environment" />
          <div className="flex flex-wrap gap-2">
            <Badge variant="brand">Next.js App Router</Badge>
            <Badge variant="default">React Query</Badge>
            <Badge variant="default">Socket.IO</Badge>
            <Badge variant="default">React Flow</Badge>
            <Badge variant="default">Recharts</Badge>
          </div>
        </Card>

        <Card>
          <CardHeader title="About" description="Dependency Blast Radius Simulator" />
          <p className="text-sm text-gray-400">
            DBRS helps platform teams visualize service dependencies, detect circular
            references, and simulate failure scenarios to understand blast radius impact before
            incidents occur.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
