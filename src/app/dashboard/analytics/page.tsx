'use client'

import { AuthProvider } from '@/components/providers/AuthProvider'
import { AgencyProvider } from '@/components/providers/AgencyProvider'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import AdvancedAnalytics from '@/components/features/analytics/AdvancedAnalytics'
import AIAnalysisPanel from '@/components/features/analytics/AIAnalysisPanel'
import MarketIntelligence from '@/components/features/analytics/MarketIntelligence'
import PredictiveAnalytics from '@/components/features/analytics/PredictiveAnalytics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AnalyticsPage() {
  return (
    <AuthProvider>
      <AgencyProvider>
        <DashboardLayout userRole="superadmin">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
              <p className="text-gray-400 mt-1">
                Comprehensive business intelligence and performance analytics
              </p>
            </div>

            {/* Analytics Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
                <TabsTrigger value="overview" className="text-white data-[state=active]:bg-red-600">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="ai-analysis" className="text-white data-[state=active]:bg-red-600">
                  AI Analysis
                </TabsTrigger>
                <TabsTrigger value="market-intel" className="text-white data-[state=active]:bg-red-600">
                  Market Intelligence
                </TabsTrigger>
                <TabsTrigger value="predictive" className="text-white data-[state=active]:bg-red-600">
                  Predictive Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <AdvancedAnalytics />
              </TabsContent>

              <TabsContent value="ai-analysis" className="mt-6">
                <AIAnalysisPanel />
              </TabsContent>

              <TabsContent value="market-intel" className="mt-6">
                <MarketIntelligence />
              </TabsContent>

              <TabsContent value="predictive" className="mt-6">
                <PredictiveAnalytics />
              </TabsContent>
            </Tabs>
          </div>
        </DashboardLayout>
      </AgencyProvider>
    </AuthProvider>
  )
}