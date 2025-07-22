describe('Smoke Tests', () => {
  test('application basics should work', () => {
    expect(true).toBe(true)
  })
  
  test('environment should be test', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })
})