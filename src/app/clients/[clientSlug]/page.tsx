import { Metadata } from 'next'
import ClientDashboardLayout from '@/components/features/clients/ClientDashboardLayout'

export async function generateMetadata({ params }: { params: { clientSlug: string } }): Promise<Metadata> {
  return {
    title: `Client Dashboard - ${params.clientSlug}`,
    description: 'Client business intelligence dashboard',
  }
}

export default function ClientDashboardPage({ params }: { params: { clientSlug: string } }) {
  return <ClientDashboardLayout clientSlug={params.clientSlug} />
}