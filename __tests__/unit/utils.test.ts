describe('Basic Tests', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2)
  })

  test('should handle string operations', () => {
    const str = 'BusinessScope AI'
    expect(str.includes('BusinessScope')).toBe(true)
    expect(str.length).toBeGreaterThan(0)
  })

  test('should handle array operations', () => {
    const arr = ['perplexity', 'kimi', 'claude', 'openai', 'gemini']
    expect(arr.length).toBe(5)
    expect(arr.includes('claude')).toBe(true)
  })
})