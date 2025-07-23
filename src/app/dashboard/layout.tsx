import React from 'react';
import { AgencyProvider } from '@/components/AgencyProvider';
import { ClientProvider } from '@/components/ClientProvider';
import { MultiLocationClientProvider } from '@/components/MultiLocationClientProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgencyProvider>
      <ClientProvider>
        <MultiLocationClientProvider>
          <div className="min-h-screen bg-slate-900">
            {children}
          </div>
        </MultiLocationClientProvider>
      </ClientProvider>
    </AgencyProvider>
  );
} 