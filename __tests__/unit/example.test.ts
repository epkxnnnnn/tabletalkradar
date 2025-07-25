describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify test environment is set up', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key');
  });
});