-- Predictive Analytics Extension for Agency Management Platform
-- Adds comprehensive forecasting and predictive analysis capabilities

-- ============================================================================
-- PREDICTIVE ANALYTICS TABLE
-- ============================================================================

CREATE TABLE predictive_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Forecast Configuration
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('comprehensive', 'revenue', 'opportunity', 'risk')),
  forecast_period TEXT NOT NULL CHECK (forecast_period IN ('3_months', '6_months', '12_months')),
  
  -- Analysis Results
  predictions JSONB NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Data Quality Metrics
  historical_data_points INTEGER DEFAULT 0,
  intelligence_data_points INTEGER DEFAULT 0,
  
  -- Model Metadata
  model_metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_predictive_analytics_agency_id ON predictive_analytics(agency_id);
CREATE INDEX idx_predictive_analytics_client_id ON predictive_analytics(client_id);
CREATE INDEX idx_predictive_analytics_forecast_type ON predictive_analytics(forecast_type);
CREATE INDEX idx_predictive_analytics_generated_at ON predictive_analytics(generated_at DESC);

-- Composite index for common queries
CREATE INDEX idx_predictive_analytics_agency_type_date ON predictive_analytics(agency_id, forecast_type, generated_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE predictive_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access predictive analytics for their own agencies
CREATE POLICY "Users can access predictive analytics for their agencies" ON predictive_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM agency_memberships 
            WHERE agency_memberships.agency_id = predictive_analytics.agency_id 
            AND agency_memberships.user_id = auth.uid()
        )
    );

-- Policy: Users can insert predictive analytics for their agencies
CREATE POLICY "Users can insert predictive analytics for their agencies" ON predictive_analytics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM agency_memberships 
            WHERE agency_memberships.agency_id = predictive_analytics.agency_id 
            AND agency_memberships.user_id = auth.uid()
        )
    );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_predictive_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_predictive_analytics_updated_at
    BEFORE UPDATE ON predictive_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_predictive_analytics_updated_at();

-- Function to clean up expired predictions
CREATE OR REPLACE FUNCTION cleanup_expired_predictions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM predictive_analytics 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXTEND EXISTING TABLES
-- ============================================================================

-- Add predictive analytics preferences to agency settings
-- This assumes the agencies table already has a settings JSONB column
-- The settings column should now support predictive analytics configuration

-- Example agency settings for predictive analytics:
-- {
--   "predictive_analytics": {
--     "enabled": true,
--     "auto_generate_forecasts": false,
--     "default_forecast_period": "3_months",
--     "confidence_threshold": 0.7,
--     "forecast_frequency": "weekly",
--     "alert_thresholds": {
--       "revenue_decline": 0.15,
--       "risk_probability": 0.6
--     }
--   }
-- }

-- ============================================================================
-- SAMPLE DATA AND VIEWS
-- ============================================================================

-- View for latest predictions by agency
CREATE VIEW latest_predictions AS
SELECT DISTINCT ON (agency_id, client_id, forecast_type) 
    id,
    agency_id,
    client_id,
    forecast_type,
    forecast_period,
    confidence_score,
    generated_at,
    predictions->>'executive_summary' as summary
FROM predictive_analytics
ORDER BY agency_id, client_id, forecast_type, generated_at DESC;

-- View for high-confidence predictions
CREATE VIEW high_confidence_predictions AS
SELECT 
    pa.*,
    c.business_name,
    c.industry
FROM predictive_analytics pa
LEFT JOIN clients c ON pa.client_id = c.id
WHERE pa.confidence_score >= 0.8
ORDER BY pa.generated_at DESC;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT ALL ON predictive_analytics TO authenticated;
GRANT ALL ON latest_predictions TO authenticated;
GRANT ALL ON high_confidence_predictions TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE predictive_analytics IS 'Stores AI-generated predictive analysis and business forecasting data';
COMMENT ON COLUMN predictive_analytics.forecast_type IS 'Type of forecast: comprehensive, revenue, opportunity, or risk';
COMMENT ON COLUMN predictive_analytics.forecast_period IS 'Time period for forecast: 3_months, 6_months, or 12_months';
COMMENT ON COLUMN predictive_analytics.predictions IS 'JSONB containing detailed prediction results and analysis';
COMMENT ON COLUMN predictive_analytics.confidence_score IS 'AI confidence level from 0.0 to 1.0';
COMMENT ON COLUMN predictive_analytics.historical_data_points IS 'Number of historical data points used in analysis';
COMMENT ON COLUMN predictive_analytics.intelligence_data_points IS 'Number of market intelligence data points used';

-- ============================================================================
-- MAINTENANCE SCHEDULE
-- ============================================================================

-- Schedule the cleanup function to run daily (this would be set up in your scheduler)
-- Example: SELECT cron.schedule('cleanup-expired-predictions', '0 2 * * *', 'SELECT cleanup_expired_predictions();');