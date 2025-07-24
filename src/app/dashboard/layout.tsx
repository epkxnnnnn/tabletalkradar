import React from 'react';
import { SimpleAgencyProvider } from '@/components/providers/SimpleAgencyProvider';
import { ClientProvider } from '@/components/features/clients/ClientProvider';
import { MultiLocationClientProvider } from '@/components/features/clients/MultiLocationClientProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SimpleAgencyProvider>
      <ClientProvider>
        <MultiLocationClientProvider>
          <div className="min-h-screen bg-slate-900">
            {children}
          </div>
        </MultiLocationClientProvider>
      </ClientProvider>
    </SimpleAgencyProvider>
  );
} 