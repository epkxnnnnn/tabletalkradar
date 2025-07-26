import { Metadata } from 'next'
import ClientDashboardLayout from '@/components/features/clients/ClientDashboardLayout'

export async function generateMetadata({ params }: { params: Promise<{ clientSlug: string }> }): Promise<Metadata> {
  const { clientSlug } = await params
  return {
    title: `Client Dashboard - ${clientSlug}`,
    description: 'Client business intelligence dashboard',
  }
}

export default async function ClientDashboardPage({ params }: { params: Promise<{ clientSlug: string }> }) {
  const { clientSlug } = await params
  return <ClientDashboardLayout clientSlug={clientSlug} />
}