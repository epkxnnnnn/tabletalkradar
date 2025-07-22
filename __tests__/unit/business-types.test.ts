import { businessCategories, getIndustryConfig, getBusinessTypePromptContext } from '@/lib/business-types'

describe('Business Types', () => {
  test('businessCategories should contain expected industries', () => {
    expect(businessCategories).toBeDefined()
    expect(businessCategories['food-hospitality']).toBeDefined()
    expect(businessCategories['professional-services']).toBeDefined()
    expect(businessCategories['technology']).toBeDefined()
  })

  test('getIndustryConfig should return valid config', () => {
    const config = getIndustryConfig('food-hospitality')
    expect(config).toHaveProperty('name')
    expect(config).toHaveProperty('categories')
    expect(config).toHaveProperty('focusAreas')
    expect(Array.isArray(config.categories)).toBe(true)
    expect(Array.isArray(config.focusAreas)).toBe(true)
  })

  test('getBusinessTypePromptContext should return formatted string', () => {
    const businessData = {
      industry: 'food-hospitality',
      business_type: 'restaurant',
      target_market: 'local families',
      business_size: 'small',
      location_type: 'physical'
    }
    
    const context = getBusinessTypePromptContext(businessData)
    expect(typeof context).toBe('string')
    expect(context).toContain('restaurant')
    expect(context).toContain('Food & Hospitality')
    expect(context).toContain('local families')
  })
})