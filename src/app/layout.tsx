import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TableTalk Radar - AI-Powered Restaurant Intelligence',
  description: '5-AI Restaurant Intelligence That Never Sleeps. Comprehensive monitoring and optimization recommendations for restaurants\' online presence.',
  keywords: 'restaurant intelligence, AI audit, online presence, restaurant marketing, local SEO, review monitoring',
  authors: [{ name: 'TableTalk Radar' }],
  creator: 'TableTalk Radar',
  publisher: 'TableTalk Radar',
  openGraph: {
    title: 'TableTalk Radar - AI-Powered Restaurant Intelligence',
    description: 'Continuous monitoring and optimization recommendations powered by multiple AI providers.',
    type: 'website',
    locale: 'en_US',
    siteName: 'TableTalk Radar',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TableTalk Radar - AI-Powered Restaurant Intelligence',
    description: '5-AI Restaurant Intelligence That Never Sleeps',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#8B0000',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}