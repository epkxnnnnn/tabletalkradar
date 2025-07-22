-- ADD SAMPLE DATA TO MAKE DASHBOARD USEFUL
-- Run this to populate your dashboard with realistic demo data

-- 1. Add sample market intelligence for your clients
INSERT INTO market_intelligence (
    agency_id,
    client_id,
    intelligence_type,
    source,
    confidence_score,
    title,
    description,
    insights,
    industry,
    is_active
) VALUES 
    -- LullaBar opportunities
    (
        '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf',
        (SELECT id FROM clients WHERE business_name = 'LullaBar Thai Fusion' LIMIT 1),
        'opportunity',
        'perplexity',
        0.87,
        'Late-Night Dining Market Expansion',
        'Opportunity to capture late-night dining market in Las Vegas Chinatown area',
        '{"summary": "Strong opportunity for late-night dining expansion", "opportunities": [{"title": "Food delivery partnerships", "impact": "25% revenue increase potential"}, {"title": "Weekend late-night promotions", "impact": "15% customer acquisition"}], "urgent_actions": ["Partner with DoorDash for late-night delivery", "Launch weekend 2-4am happy hour"]}',
        'Food & Beverage',
        true
    ),
    -- Daikon Vegan growth opportunity  
    (
        '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf',
        (SELECT id FROM clients WHERE business_name = 'Daikon Vegan Sushi' LIMIT 1),
        'opportunity',
        'claude',
        0.92,
        'Vegan Market Growth Trend',
        'Plant-based dining market showing 23% growth in Las Vegas area',
        '{"summary": "Vegan dining trend creating expansion opportunities", "opportunities": [{"title": "Corporate catering expansion", "impact": "35% revenue potential"}, {"title": "Vegan cooking classes", "impact": "New revenue stream"}], "urgent_actions": ["Contact local corporations for catering partnerships", "Develop weekend cooking class program"]}',
        'Food & Beverage',
        true
    ),
    -- Competitive risk for general market
    (
        '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf',
        NULL,
        'risk',
        'openai',
        0.78,
        'Increased Competition in Thai Restaurant Market',
        'New Thai restaurants opening in Las Vegas and Hawaii markets',
        '{"summary": "Competitive pressure increasing in key markets", "competitive_risks": [{"risk": "New Thai fusion restaurants", "severity": "medium", "description": "3 new competitors in Las Vegas area", "estimated_impact": "10-15% market share risk"}], "urgent_actions": ["Analyze competitor pricing and offerings", "Strengthen customer loyalty programs"]}',
        'Food & Beverage',
        true
    ),
    -- Spa market trends
    (
        '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf',
        (SELECT id FROM clients WHERE business_name = 'Bright Facial Spa & Thai Massage' LIMIT 1),
        'market_trend',
        'gemini',
        0.85,
        'Wellness Industry Growth Post-Pandemic',
        'Health and wellness services seeing sustained 18% growth',
        '{"summary": "Wellness industry showing strong recovery and growth", "trends": [{"trend": "Increased demand for stress relief services", "impact_level": "high", "adoption_rate": "78%"}, {"trend": "Corporate wellness programs", "impact_level": "medium", "adoption_rate": "45%"}]}',
        'Health & Wellness',
        true
    );

-- 2. Add sample predictive analytics
INSERT INTO predictive_analytics (
    agency_id,
    client_id,
    forecast_type,
    forecast_period,
    predictions,
    confidence_score,
    historical_data_points,
    intelligence_data_points,
    model_metadata
) VALUES 
    -- Revenue forecast for agency
    (
        '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf',
        NULL,
        'revenue',
        '3_months',
        '{
            "revenue_forecasting": {
                "summary": "15% growth expected over next 3 months",
                "monthly_projections": [
                    {"period": "August 2025", "projected_revenue": 18500, "confidence_level": 85},
                    {"period": "September 2025", "projected_revenue": 19200, "confidence_level": 82},
                    {"period": "October 2025", "projected_revenue": 20100, "confidence_level": 78}
                ]
            },
            "growth_trajectory": "Strong upward trend with seasonal adjustments"
        }',
        0.83,
        12,
        4,
        '{"model": "BusinessScope AI", "version": "2.0.0", "generated_at": "2025-07-22T10:00:00Z"}'
    );

-- 3. Add sample task automation tasks
INSERT INTO task_automation (
    agency_id,
    client_id,
    title,
    description,
    category,
    priority_score,
    impact_score,
    complexity,
    timeline,
    resource_requirements,
    automation_possible,
    requires_human_decision,
    status,
    dependencies,
    success_metrics
) VALUES 
    -- Critical task
    (
        '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf',
        (SELECT id FROM clients WHERE business_name = 'LullaBar Thai Fusion' LIMIT 1),
        'Update Google My Business Hours',
        'Correct operating hours on Google My Business listing to match current schedule',
        'critical',
        95,
        8,
        'low',
        '0-4 hours',
        'Marketing coordinator, 30 minutes',
        true,
        false,
        'pending',
        '["Google My Business access"]',
        '["Hours accuracy verified", "Customer inquiries reduced by 20%"]'
    ),
    -- High impact task
    (
        '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf',
        (SELECT id FROM clients WHERE business_name = 'Daikon Vegan Sushi' LIMIT 1),
        'Launch Vegan Lunch Delivery Campaign',
        'Create targeted social media campaign for weekday lunch delivery targeting office workers',
        'high_impact',
        88,
        9,
        'medium',
        '3-7 days',
        'Social media manager, graphic designer, 8-12 hours',
        false,
        true,
        'pending',
        '["Campaign creative approval", "Budget allocation"]',
        '["30% increase in lunch orders", "25% new customer acquisition"]'
    ),
    -- Strategic task
    (
        '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf',
        NULL,
        'Develop Client Referral Program',
        'Create comprehensive referral program to incentivize existing clients to refer new businesses',
        'strategic',
        82,
        10,
        'high',
        '2-3 weeks',
        'Marketing team, developer, 25-30 hours',
        false,
        true,
        'pending',
        '["Referral tracking system", "Incentive structure design"]',
        '["20% increase in new client acquisition", "15% improvement in client satisfaction"]'
    );

-- 4. Add sample audits to show recent activity
INSERT INTO audits (
    agency_id,
    client_id,
    audit_type,
    overall_score,
    scores,
    recommendations,
    status,
    created_at
) VALUES 
    (
        '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf',
        (SELECT id FROM clients WHERE business_name = 'LullaBar Thai Fusion' LIMIT 1),
        'comprehensive',
        87,
        '{"website": 85, "social_media": 78, "reviews": 92, "seo": 83, "local_listings": 89}',
        '["Improve social media posting frequency", "Optimize website mobile speed", "Enhance local SEO keywords"]',
        'completed',
        NOW() - INTERVAL '2 days'
    ),
    (
        '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf',
        (SELECT id FROM clients WHERE business_name = 'Daikon Vegan Sushi' LIMIT 1),
        'comprehensive',
        91,
        '{"website": 88, "social_media": 94, "reviews": 89, "seo": 92, "local_listings": 87}',
        '["Expand Google My Business photos", "Add more customer testimonials", "Optimize for vegan-related keywords"]',
        'completed',
        NOW() - INTERVAL '1 day'
    ),
    (
        '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf',
        (SELECT id FROM clients WHERE business_name = 'Bright Facial Spa & Thai Massage' LIMIT 1),
        'comprehensive',
        84,
        '{"website": 82, "social_media": 75, "reviews": 90, "seo": 85, "local_listings": 88}',
        '["Increase social media engagement", "Add online booking system", "Create wellness blog content"]',
        'completed',
        NOW() - INTERVAL '3 days'
    );

-- 5. Update client health scores based on audit results
UPDATE clients 
SET health_score = CASE 
    WHEN business_name = 'Daikon Vegan Sushi' THEN 91
    WHEN business_name = 'LullaBar Thai Fusion' THEN 87
    WHEN business_name = 'Bright Facial Spa & Thai Massage' THEN 84
    WHEN business_name = 'Basil Vegan Thai & Sushi' THEN 89
    WHEN business_name = 'Alisa Sushi & Thai Bistro' THEN 86
    WHEN business_name = 'Koloa Thai Bistro' THEN 85
    WHEN business_name = 'Chang Kao Thai Cuisine' THEN 78
    ELSE health_score
END,
last_audit_at = CASE
    WHEN business_name IN ('Daikon Vegan Sushi', 'LullaBar Thai Fusion', 'Bright Facial Spa & Thai Massage') 
    THEN NOW() - INTERVAL '1 day'
    ELSE last_audit_at
END
WHERE agency_id = '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf';

-- Verification queries
SELECT 'Sample data added successfully!' as result;

SELECT 
    'Market Intelligence' as data_type,
    COUNT(*) as count
FROM market_intelligence 
WHERE agency_id = '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf'

UNION ALL

SELECT 
    'Tasks' as data_type,
    COUNT(*) as count
FROM task_automation 
WHERE agency_id = '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf'

UNION ALL

SELECT 
    'Audits' as data_type,
    COUNT(*) as count
FROM audits 
WHERE agency_id = '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf'

UNION ALL

SELECT 
    'Predictions' as data_type,
    COUNT(*) as count
FROM predictive_analytics 
WHERE agency_id = '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf';

-- Show client summary with updated health scores
SELECT 
    business_name,
    location,
    health_score,
    status,
    CASE WHEN last_audit_at IS NOT NULL THEN '✅ Recent audit' ELSE '⏰ Audit due' END as audit_status
FROM clients 
WHERE agency_id = '3ee92de8-804a-4ef1-9bb4-65b89f9fecbf'
ORDER BY health_score DESC;