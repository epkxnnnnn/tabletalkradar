// Universal Business Intelligence Types and Definitions

export interface BusinessData {
  industry: string
  business_type: string
  target_market: string
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  location_type: 'local' | 'regional' | 'national' | 'international'
}

export interface IndustryConfig {
  name: string
  categories: string[]
  focusAreas: string[]
  commonMetrics: string[]
  keyIndicators: string[]
}

export const businessCategories = {
  'food-hospitality': {
    name: 'Food & Hospitality',
    categories: [
      'Restaurant', 'Fast Food', 'Fine Dining', 'Café', 'Bar & Nightlife', 
      'Hotel', 'Event Venue', 'Catering', 'Food Truck', 'Bakery'
    ],
    focusAreas: ['Customer Experience', 'Food Quality', 'Service Speed', 'Ambiance', 'Online Reviews'],
    commonMetrics: ['Customer Satisfaction', 'Order Accuracy', 'Wait Times', 'Revenue per Customer'],
    keyIndicators: ['Review Ratings', 'Repeat Customers', 'Peak Hour Performance', 'Menu Performance']
  },
  'retail-ecommerce': {
    name: 'Retail & E-commerce',
    categories: [
      'Online Store', 'Physical Retail', 'Fashion', 'Electronics', 'Home & Garden', 
      'Sports & Recreation', 'Beauty & Personal Care', 'Automotive', 'Books & Media', 'Specialty Store'
    ],
    focusAreas: ['Product Quality', 'Customer Service', 'Inventory Management', 'Brand Presence', 'Sales Performance'],
    commonMetrics: ['Conversion Rate', 'Customer Acquisition Cost', 'Customer Lifetime Value', 'Return Rate'],
    keyIndicators: ['Sales Growth', 'Customer Reviews', 'Market Share', 'Inventory Turnover']
  },
  'professional-services': {
    name: 'Professional Services',
    categories: [
      'Legal Services', 'Accounting & Finance', 'Consulting', 'Marketing Agency', 'Design Services', 
      'Real Estate', 'Insurance', 'Healthcare Services', 'Education & Training', 'IT Services'
    ],
    focusAreas: ['Service Quality', 'Client Relationships', 'Expertise & Credentials', 'Response Time', 'Results Delivery'],
    commonMetrics: ['Client Retention Rate', 'Project Success Rate', 'Revenue per Client', 'Billable Hours'],
    keyIndicators: ['Client Satisfaction', 'Referral Rate', 'Industry Recognition', 'Case Study Results']
  },
  'healthcare-wellness': {
    name: 'Healthcare & Wellness',
    categories: [
      'Medical Practice', 'Dental Office', 'Mental Health Services', 'Physical Therapy', 'Spa & Wellness', 
      'Fitness Center', 'Veterinary Services', 'Alternative Medicine', 'Medical Devices', 'Health Tech'
    ],
    focusAreas: ['Patient Care Quality', 'Safety & Compliance', 'Accessibility', 'Treatment Outcomes', 'Patient Experience'],
    commonMetrics: ['Patient Satisfaction', 'Treatment Success Rate', 'Wait Times', 'Compliance Score'],
    keyIndicators: ['Health Outcomes', 'Patient Reviews', 'Regulatory Compliance', 'Referral Network']
  },
  'technology': {
    name: 'Technology',
    categories: [
      'Software Company', 'SaaS Platform', 'Mobile App', 'Web Development', 'AI/ML Services', 
      'Cybersecurity', 'Cloud Services', 'Hardware', 'Gaming', 'Fintech'
    ],
    focusAreas: ['Product Innovation', 'User Experience', 'Security', 'Performance', 'Market Adoption'],
    commonMetrics: ['User Engagement', 'Uptime', 'Feature Adoption', 'Customer Churn'],
    keyIndicators: ['Product-Market Fit', 'Technical Performance', 'Security Score', 'Innovation Index']
  },
  'manufacturing': {
    name: 'Manufacturing',
    categories: [
      'Consumer Goods', 'Industrial Equipment', 'Automotive', 'Electronics', 'Textiles', 
      'Food Processing', 'Pharmaceutical', 'Aerospace', 'Construction Materials', 'Energy'
    ],
    focusAreas: ['Product Quality', 'Production Efficiency', 'Supply Chain', 'Safety Standards', 'Environmental Impact'],
    commonMetrics: ['Production Volume', 'Quality Score', 'Delivery Performance', 'Cost per Unit'],
    keyIndicators: ['Manufacturing Excellence', 'Supply Chain Resilience', 'Quality Control', 'Operational Efficiency']
  },
  'financial-services': {
    name: 'Financial Services',
    categories: [
      'Banking', 'Investment Firm', 'Insurance Company', 'Credit Union', 'Fintech Startup', 
      'Accounting Firm', 'Tax Services', 'Wealth Management', 'Payment Processing', 'Cryptocurrency'
    ],
    focusAreas: ['Security & Compliance', 'Customer Trust', 'Financial Performance', 'Risk Management', 'Digital Innovation'],
    commonMetrics: ['Customer Acquisition', 'Asset Growth', 'Risk Score', 'Compliance Rate'],
    keyIndicators: ['Financial Health', 'Regulatory Compliance', 'Customer Trust Score', 'Innovation Index']
  },
  'education': {
    name: 'Education',
    categories: [
      'School', 'University', 'Online Learning', 'Vocational Training', 'Corporate Training', 
      'Tutoring Services', 'Educational Technology', 'Certification Programs', 'Research Institution', 'Library'
    ],
    focusAreas: ['Learning Outcomes', 'Student Engagement', 'Curriculum Quality', 'Accessibility', 'Technology Integration'],
    commonMetrics: ['Student Success Rate', 'Engagement Score', 'Completion Rate', 'Graduate Outcomes'],
    keyIndicators: ['Educational Excellence', 'Student Satisfaction', 'Learning Effectiveness', 'Innovation in Teaching']
  },
  'non-profit': {
    name: 'Non-Profit',
    categories: [
      'Charity Organization', 'Foundation', 'Religious Organization', 'Community Service', 'Advocacy Group', 
      'Environmental Organization', 'Arts & Culture', 'Sports Organization', 'Social Services', 'Research Institute'
    ],
    focusAreas: ['Mission Impact', 'Community Engagement', 'Fundraising Effectiveness', 'Transparency', 'Volunteer Management'],
    commonMetrics: ['Impact Metrics', 'Donor Retention', 'Volunteer Hours', 'Program Effectiveness'],
    keyIndicators: ['Social Impact', 'Community Trust', 'Fundraising Success', 'Mission Alignment']
  },
  'other': {
    name: 'Other',
    categories: ['Startup', 'Family Business', 'Cooperative', 'Social Enterprise', 'Government Agency', 'Other'],
    focusAreas: ['Business Performance', 'Stakeholder Satisfaction', 'Operational Efficiency', 'Growth Potential', 'Market Position'],
    commonMetrics: ['Performance Score', 'Stakeholder Satisfaction', 'Efficiency Rating', 'Growth Rate'],
    keyIndicators: ['Business Health', 'Market Performance', 'Operational Excellence', 'Strategic Alignment']
  }
}

export const universalScoringCategories = {
  'online_presence': {
    name: 'Online Presence',
    weight: 0.2,
    description: 'Digital footprint and online visibility'
  },
  'customer_experience': {
    name: 'Customer Experience', 
    weight: 0.25,
    description: 'Customer satisfaction and experience quality'
  },
  'operational_excellence': {
    name: 'Operational Excellence',
    weight: 0.2, 
    description: 'Efficiency and effectiveness of operations'
  },
  'market_performance': {
    name: 'Market Performance',
    weight: 0.2,
    description: 'Competitive position and market presence'
  },
  'innovation_growth': {
    name: 'Innovation & Growth',
    weight: 0.15,
    description: 'Innovation capacity and growth potential'
  }
}

export function getIndustryConfig(industry: string): IndustryConfig {
  return businessCategories[industry as keyof typeof businessCategories] || businessCategories.other
}

export function getIndustryFocus(businessData: BusinessData): string[] {
  const config = getIndustryConfig(businessData.industry)
  return config.focusAreas
}

export function getIndustrySpecificAnalysis(businessData: BusinessData): {
  primaryMetrics: string[]
  keyIndicators: string[]
  industryContext: string
} {
  const config = getIndustryConfig(businessData.industry)
  
  return {
    primaryMetrics: config.commonMetrics,
    keyIndicators: config.keyIndicators,
    industryContext: `As a ${config.name.toLowerCase()} business, focus areas include ${config.focusAreas.slice(0, 3).join(', ')}`
  }
}

export function getBusinessTypePromptContext(businessData: BusinessData): string {
  const config = getIndustryConfig(businessData.industry)
  
  return `This is a ${businessData.business_type} in the ${config.name} industry, targeting ${businessData.target_market} market. Key focus areas include: ${config.focusAreas.join(', ')}.`
}

const businessTypesExport = {
  businessCategories,
  universalScoringCategories,
  getIndustryConfig,
  getIndustryFocus, 
  getIndustrySpecificAnalysis,
  getBusinessTypePromptContext
}

export default businessTypesExport