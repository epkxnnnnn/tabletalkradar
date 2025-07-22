import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { AgencyProvider } from '@/components/AgencyProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TableTalk Radar - AI-Powered Business Intelligence Platform',
  description: 'AI-Powered Business Intelligence for Every Industry - Comprehensive Analysis, Insights, and Growth Strategies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AgencyProvider>
            {children}
          </AgencyProvider>
        </AuthProvider>
      </body>
    </html>
  )
}