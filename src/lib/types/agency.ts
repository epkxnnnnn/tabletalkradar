// Agency Management Types for Multi-Tenant System

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise' | 'custom'
export type SubscriptionStatus = 'active' | 'cancelled' | 'suspended' | 'trial'
export type AgencyRole = 'owner' | 'admin' | 'manager' | 'client_manager' | 'analyst'
export type MembershipStatus = 'invited' | 'active' | 'suspended' | 'removed'
export type ClientTier = 'basic' | 'standard' | 'premium' | 'enterprise'
export type AssignmentRole = 'primary' | 'assigned' | 'observer'

// ============================================================================
// Core Agency Types
// ============================================================================

export interface Agency {
  id: string
  name: string
  slug: string
  owner_id: string
  
  // Subscription
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  trial_ends_at?: string
  
  // Limits
  max_team_members: number
  max_clients: number
  max_monthly_audits: number
  
  // Configuration
  settings: AgencySettings
  branding: AgencyBranding
  
  // Contact
  contact_email?: string
  contact_phone?: string
  website?: string
  address?: AgencyAddress
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface AgencySettings {
  // Automation preferences
  auto_assign_clients?: boolean
  default_audit_frequency?: 'weekly' | 'monthly' | 'quarterly'
  enable_ai_insights?: boolean
  enable_predictive_analytics?: boolean
  
  // Notification preferences
  notification_channels?: ('email' | 'sms' | 'slack' | 'webhook')[]
  alert_thresholds?: {
    performance_change: number
    risk_score: number
    opportunity_score: number
  }
  
  // Reporting preferences
  report_formats?: ('pdf' | 'html' | 'json')[]
  report_frequency?: 'daily' | 'weekly' | 'monthly'
  include_competitive_analysis?: boolean
  
  // Client portal settings
  enable_client_portal?: boolean
  allow_client_data_export?: boolean
  custom_domain?: string
  
  // API and integrations
  webhook_urls?: string[]
  api_rate_limits?: {
    requests_per_minute: number
    requests_per_hour: number
  }
}

export interface AgencyBranding {
  // Visual identity
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  font_family?: string
  
  // Company info for white-label
  company_name?: string
  website_url?: string
  support_email?: string
  support_phone?: string
  
  // Client-facing customization
  client_portal_theme?: 'light' | 'dark' | 'custom'
  custom_css?: string
  favicon_url?: string
  
  // Email templates
  email_header_image?: string
  email_footer_text?: string
  email_signature?: string
}

export interface AgencyAddress {
  street?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  timezone?: string
}

// ============================================================================
// Agency Membership Types
// ============================================================================

export interface AgencyMembership {
  id: string
  agency_id: string
  user_id: string
  role: AgencyRole
  permissions: AgencyPermissions
  status: MembershipStatus
  
  // Invitation tracking
  invited_by?: string
  invitation_token?: string
  invitation_expires_at?: string
  joined_at?: string
  
  // Metadata
  created_at: string
  updated_at: string
  
  // Populated relations
  user?: {
    id: string
    full_name?: string
    email?: string
    avatar_url?: string
  }
  agency?: Agency
}

export interface AgencyPermissions {
  // Client management
  can_create_clients?: boolean
  can_edit_clients?: boolean
  can_delete_clients?: boolean
  can_assign_clients?: boolean
  
  // Audit management  
  can_run_audits?: boolean
  can_view_all_audits?: boolean
  can_delete_audits?: boolean
  
  // Report management
  can_generate_reports?: boolean
  can_customize_reports?: boolean
  can_share_reports?: boolean
  
  // Team management
  can_invite_members?: boolean
  can_manage_roles?: boolean
  can_remove_members?: boolean
  
  // Agency settings
  can_edit_agency_settings?: boolean
  can_manage_billing?: boolean
  can_access_analytics?: boolean
  
  // Advanced features
  can_manage_automations?: boolean
  can_access_ai_insights?: boolean
  can_manage_integrations?: boolean
}

// ============================================================================
// Client Management Types
// ============================================================================

export interface EnhancedClient {
  id: string
  agency_id: string
  user_id?: string // Legacy field, might be null for agency-created clients
  
  // Basic info
  business_name: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  industry?: string
  location?: string
  
  // Agency-specific fields
  client_tier: ClientTier
  monthly_budget?: number
  priority_level?: 'low' | 'medium' | 'high' | 'critical'
  
  // Status and health
  status: 'active' | 'inactive' | 'churned' | 'prospect'
  health_score?: number // 0-100
  satisfaction_score?: number // 0-100
  
  // Business metrics
  annual_revenue?: number
  employee_count?: number
  market_cap?: string
  
  // Configuration
  audit_frequency?: 'weekly' | 'monthly' | 'quarterly'
  services_enabled: string[]
  custom_fields?: Record<string, any>
  
  // Metadata
  created_at: string
  updated_at: string
  last_audit_at?: string
  
  // Populated relations
  assignments?: ClientAssignment[]
  recent_audits?: any[]
  performance_metrics?: ClientPerformanceMetrics
}

export interface ClientAssignment {
  id: string
  client_id: string
  user_id: string
  agency_id: string
  role: AssignmentRole
  assigned_by?: string
  assigned_at: string
  
  // Populated relations
  user?: {
    id: string
    full_name?: string
    email?: string
    role?: AgencyRole
  }
}

export interface ClientPerformanceMetrics {
  // Overall performance
  current_score: number
  previous_score?: number
  score_trend: 'improving' | 'declining' | 'stable'
  
  // Key metrics
  seo_score: number
  reputation_score: number
  social_media_score: number
  website_performance_score: number
  
  // Business impact
  estimated_monthly_revenue_impact?: number
  leads_generated?: number
  conversion_rate?: number
  
  // Comparative metrics
  industry_percentile?: number
  competitor_comparison?: 'ahead' | 'behind' | 'equal'
  
  // Alerts and opportunities
  active_alerts: number
  open_opportunities: number
  last_updated: string
}

// ============================================================================
// Intelligence Layer Types
// ============================================================================

export type IntelligenceType = 'competitor' | 'market_trend' | 'opportunity' | 'risk' | 'customer_insight'
export type AISource = 'perplexity' | 'claude' | 'openai' | 'gemini' | 'kimi' | 'manual'

export interface MarketIntelligence {
  id: string
  agency_id: string
  client_id?: string
  
  intelligence_type: IntelligenceType
  source: AISource
  confidence_score: number
  
  title: string
  description: string
  insights: Record<string, any>
  raw_data?: Record<string, any>
  
  // Context
  industry?: string
  location?: string
  time_period?: string
  
  // Status
  is_active: boolean
  created_at: string
  expires_at?: string
}

export type PredictionType = 'revenue' | 'risk' | 'opportunity' | 'customer_behavior' | 'market_change'

export interface PredictiveAnalytics {
  id: string
  agency_id: string
  client_id?: string
  
  prediction_type: PredictionType
  prediction_data: Record<string, any>
  confidence_score: number
  
  prediction_date: string
  prediction_period: 'week' | 'month' | 'quarter'
  
  // Validation
  actual_outcome?: Record<string, any>
  accuracy_score?: number
  validated_at?: string
  
  created_at: string
  model_version: string
}

// ============================================================================
// Automation Layer Types
// ============================================================================

export type WorkflowType = 'review_management' | 'social_media' | 'seo' | 'reporting' | 'monitoring'
export type WorkflowStatus = 'running' | 'completed' | 'failed' | 'cancelled'

export interface AutomationWorkflow {
  id: string
  agency_id: string
  client_id?: string
  
  name: string
  description?: string
  workflow_type: WorkflowType
  
  // Configuration
  triggers: Record<string, any>
  actions: Record<string, any>
  conditions?: Record<string, any>
  
  // Status
  is_active: boolean
  last_run_at?: string
  next_run_at?: string
  
  // Statistics
  total_runs: number
  successful_runs: number
  failed_runs: number
  
  created_at: string
  updated_at: string
  created_by: string
}

export interface AutomationLog {
  id: string
  workflow_id: string
  agency_id: string
  client_id?: string
  
  status: WorkflowStatus
  started_at: string
  completed_at?: string
  
  // Results
  actions_taken?: Record<string, any>
  results?: Record<string, any>
  error_message?: string
  
  triggered_by?: string
  execution_time_ms?: number
}

// ============================================================================
// Communication Layer Types
// ============================================================================

export type CommunicationType = 'email' | 'sms' | 'call' | 'meeting' | 'report' | 'alert'
export type CommunicationStatus = 'draft' | 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed'

export interface ClientCommunication {
  id: string
  agency_id: string
  client_id: string
  
  communication_type: CommunicationType
  subject?: string
  content: string
  
  sent_by?: string
  recipients: string[] // Array of recipient IDs or emails
  
  status: CommunicationStatus
  scheduled_at?: string
  sent_at?: string
  read_at?: string
  
  created_at: string
  template_used?: string
  auto_generated: boolean
}

// ============================================================================
// Dashboard and Analytics Types
// ============================================================================

export interface AgencyDashboardData {
  agency: Agency
  membership: AgencyMembership
  
  // Overview metrics
  total_clients: number
  active_clients: number
  total_team_members: number
  
  // Performance metrics
  average_client_score: number
  score_trend: 'up' | 'down' | 'stable'
  monthly_audits_completed: number
  monthly_audits_remaining: number
  
  // Recent activity
  recent_audits: any[]
  recent_alerts: any[]
  recent_communications: ClientCommunication[]
  
  // Intelligence insights
  market_opportunities: MarketIntelligence[]
  risk_alerts: MarketIntelligence[]
  predictions: PredictiveAnalytics[]
  
  // Automation status
  active_workflows: AutomationWorkflow[]
  recent_automations: AutomationLog[]
  
  // Team performance
  team_productivity: {
    member_id: string
    member_name: string
    clients_managed: number
    audits_completed: number
    client_satisfaction: number
  }[]
}

export interface ClientOverviewData {
  client: EnhancedClient
  performance: ClientPerformanceMetrics
  assignments: ClientAssignment[]
  recent_audits: any[]
  intelligence: MarketIntelligence[]
  communications: ClientCommunication[]
  automation_status: {
    active_workflows: number
    recent_executions: number
    success_rate: number
  }
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T> {
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface AgencyContextData {
  current_agency: Agency
  membership: AgencyMembership
  permissions: AgencyPermissions
  available_agencies: Agency[]
}

// ============================================================================
// Form and Input Types
// ============================================================================

export interface CreateAgencyInput {
  name: string
  contact_email?: string
  contact_phone?: string
  website?: string
  industry?: string
  subscription_plan?: SubscriptionPlan
}

export interface InviteMemberInput {
  email: string
  role: AgencyRole
  permissions?: Partial<AgencyPermissions>
  message?: string
}

export interface CreateClientInput {
  business_name: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  industry?: string
  location?: string
  client_tier?: ClientTier
  services_enabled: string[]
  assign_to?: string[]
}

export interface UpdateAgencySettingsInput {
  settings?: Partial<AgencySettings>
  branding?: Partial<AgencyBranding>
  contact_email?: string
  contact_phone?: string
  website?: string
  address?: Partial<AgencyAddress>
}