'use client';

import { AppShell } from '@/components/layout/AppShell';
import { ServiceList } from '@/features/services/ServiceList';

export default function ServicesPage() {
  return (
    <AppShell title="Services" description="Manage your microservices and their metadata">
      <ServiceList />
    </AppShell>
  );
}
